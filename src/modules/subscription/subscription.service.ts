import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import {
  SubscriptionCheckoutDto,
  SubscriptionConfirmDto,
  SubscriptionChangePlanDto,
  SubscriptionCancelDto,
  SubscriptionInvoicesQueryDto,
} from './dto/subscription.dto';
import { createPaginationMeta } from '../../common/pagination.util';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGen: IdGenerator,
  ) {}

  private formatSubscription(sub: any) {
    return {
      id: sub.id,
      planId: sub.planId,
      planName: sub.planName,
      status: sub.status,
      billingCycle: sub.billingCycle,
      trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString().slice(0, 10) : null,
      currentPeriodStart: sub.currentPeriodStart.toISOString().slice(0, 10),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString().slice(0, 10),
      autoRenew: sub.autoRenew,
      usage: sub.usage || {
        students: 0,
        staff: 0,
        storageGb: 0,
        smsCredits: 0,
      },
      limits: sub.limits || {
        students: 1000,
        staff: 100,
        storageGb: 20,
        smsCredits: 2000,
      },
    };
  }

  async getSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      throw new DomainError('NOT_FOUND', 'No active subscription found for tenant');
    }

    return this.formatSubscription(sub);
  }

  async checkout(tenantId: string, dto: SubscriptionCheckoutDto) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { code: dto.planCode },
    });

    if (!plan) {
      throw new DomainError('VALIDATION_ERROR', `Plan '${dto.planCode}' not found`);
    }

    let baseAmount = dto.billingCycle === 'YEARLY'
      ? Number(plan.priceYearly)
      : Number(plan.priceMonthly);

    // Apply coupon discount if given (e.g. 10%)
    if (dto.couponCode && dto.couponCode.toUpperCase().includes('10')) {
      baseAmount = Math.round(baseAmount * 0.9);
    }

    const orderId = `ord_${this.idGen.generate()}`;

    await this.prisma.paymentOrder.create({
      data: {
        id: orderId,
        tenantId,
        orderId,
        gateway: 'RAZORPAY',
        planId: plan.id,
        billingCycle: dto.billingCycle,
        amount: baseAmount,
        currency: 'INR',
        status: 'CREATED',
      },
    });

    return {
      orderId,
      gateway: 'RAZORPAY',
      amount: baseAmount,
      currency: 'INR',
      gatewayPayload: {
        key: 'rzp_test_edutrio_mock',
        orderId: `rzp_order_${orderId}`,
      },
    };
  }

  async confirm(tenantId: string, dto: SubscriptionConfirmDto) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { orderId: dto.orderId },
    });

    if (!order || order.tenantId !== tenantId) {
      throw new DomainError('PAYMENT_FAILED', 'Order not found or invalid');
    }

    const plan = await this.prisma.saasPlan.findUnique({
      where: { id: order.planId },
    });

    if (!plan) {
      throw new DomainError('PAYMENT_FAILED', 'Associated plan not found');
    }

    const now = new Date();
    const periodDurationMs = order.billingCycle === 'YEARLY'
      ? 365 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const currentPeriodEnd = new Date(now.getTime() + periodDurationMs);

    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedSub = await this.prisma.$transaction(async (tx) => {
      // 1. Mark order paid
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentId: dto.paymentId,
          signature: dto.signature,
        },
      });

      // 2. Update tenant status
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });

      // 3. Upsert / update subscription
      const existingSub = await tx.subscription.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      let sub;
      if (existingSub) {
        sub = await tx.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            planName: plan.name,
            status: 'ACTIVE',
            billingCycle: order.billingCycle,
            trialEndsAt: null,
            currentPeriodStart: now,
            currentPeriodEnd,
            autoRenew: true,
            limits: plan.limits as any,
          },
        });
      } else {
        sub = await tx.subscription.create({
          data: {
            id: `sub_${this.idGen.generate()}`,
            tenantId,
            planId: plan.id,
            planName: plan.name,
            status: 'ACTIVE',
            billingCycle: order.billingCycle,
            currentPeriodStart: now,
            currentPeriodEnd,
            autoRenew: true,
            limits: plan.limits as any,
            usage: { students: 0, staff: 1, storageGb: 0, smsCredits: 0 },
          },
        });
      }

      // 4. Create invoice
      await tx.subscriptionInvoice.create({
        data: {
          id: `inv_${this.idGen.generate()}`,
          tenantId,
          number: invoiceNumber,
          planId: plan.id,
          planName: plan.name,
          amount: order.amount,
          currency: 'INR',
          status: 'PAID',
          billingCycle: order.billingCycle,
          issuedAt: now,
          pdfUrl: `https://files.edutrio.com/invoices/${invoiceNumber}.pdf`,
        },
      });

      return sub;
    });

    return this.formatSubscription(updatedSub);
  }

  async changePlan(tenantId: string, dto: SubscriptionChangePlanDto) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { code: dto.planCode },
    });

    if (!plan) {
      throw new DomainError('VALIDATION_ERROR', `Plan '${dto.planCode}' not found`);
    }

    const currentSub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSub) {
      throw new DomainError('NOT_FOUND', 'Subscription not found');
    }

    // Check usage limits if downgrading
    const usage = (currentSub.usage as any) || {};
    const newLimits = (plan.limits as any) || {};

    if (newLimits.students && (usage.students || 0) > newLimits.students) {
      throw new DomainError(
        'PLAN_LIMIT_REACHED',
        `Current student count (${usage.students}) exceeds new plan limit (${newLimits.students})`,
      );
    }

    const updatedSub = await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId: plan.id,
        planName: plan.name,
        billingCycle: dto.billingCycle,
        limits: plan.limits as any,
      },
    });

    return this.formatSubscription(updatedSub);
  }

  async cancel(tenantId: string, dto: SubscriptionCancelDto) {
    const currentSub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSub) {
      throw new DomainError('NOT_FOUND', 'Subscription not found');
    }

    const updatedSub = await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        autoRenew: false,
      },
    });

    this.logger.log(`Subscription cancelled for tenant ${tenantId}. Reason: ${dto.reason || 'None'}`);

    return this.formatSubscription(updatedSub);
  }

  async getInvoices(tenantId: string, query: SubscriptionInvoicesQueryDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      this.prisma.subscriptionInvoice.findMany({
        where: { tenantId },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.subscriptionInvoice.count({
        where: { tenantId },
      }),
    ]);

    const items = invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      issuedAt: inv.issuedAt.toISOString().slice(0, 10),
      pdfUrl: inv.pdfUrl,
    }));

    return {
      items,
      meta: createPaginationMeta(page, pageSize, total),
    };
  }
}

