import { Injectable, Logger } from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../../infra/db/prisma.service';
import { TokenService } from '../auth/token.service';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import { DEFAULT_SYSTEM_ROLES } from '../roles/default-roles';
import { RegisterTenantDto } from './dto/onboarding.dto';

export const DEFAULT_PLANS = [
  {
    id: 'pln_starter',
    code: 'STARTER',
    name: 'Starter',
    description: 'For small schools up to 300 students',
    priceMonthly: 1499,
    priceYearly: 14990,
    currency: 'INR',
    trialDays: 14,
    limits: {
      students: 300,
      staff: 30,
      storageGb: 5,
      smsCredits: 500,
    },
    features: ['Attendance', 'Fees', 'Students', 'Staff'],
    isActive: true,
  },
  {
    id: 'pln_growth',
    code: 'GROWTH',
    name: 'Growth',
    description: 'For schools up to 1000 students',
    priceMonthly: 2999,
    priceYearly: 29990,
    currency: 'INR',
    trialDays: 14,
    limits: {
      students: 1000,
      staff: 100,
      storageGb: 20,
      smsCredits: 2000,
    },
    features: ['Attendance', 'Fees', 'Exams', 'Communication', 'Reports'],
    isActive: true,
  },
  {
    id: 'pln_pro',
    code: 'PRO',
    name: 'Pro',
    description: 'For larger institutions up to 3000 students',
    priceMonthly: 5999,
    priceYearly: 59990,
    currency: 'INR',
    trialDays: 14,
    limits: {
      students: 3000,
      staff: 300,
      storageGb: 100,
      smsCredits: 10000,
    },
    features: ['Everything in Growth', 'Custom Roles', 'Audit Logs', 'Priority Support'],
    isActive: true,
  },
];

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly idGen: IdGenerator,
  ) {}

  async getPublicPlans() {
    try {
      let plans = await this.prisma.saasPlan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: 'asc' },
      });

      if (plans.length === 0) {
        this.logger.log('Seeding initial SaaS plans...');
        for (const p of DEFAULT_PLANS) {
          await this.prisma.saasPlan.create({
            data: {
              id: p.id,
              code: p.code,
              name: p.name,
              description: p.description,
              priceMonthly: p.priceMonthly,
              priceYearly: p.priceYearly,
              currency: p.currency,
              trialDays: p.trialDays,
              limits: p.limits,
              features: p.features,
              isActive: p.isActive,
            },
          });
        }
        plans = await this.prisma.saasPlan.findMany({
          where: { isActive: true },
          orderBy: { priceMonthly: 'asc' },
        });
      }

      return plans.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        priceMonthly: Number(p.priceMonthly),
        priceYearly: Number(p.priceYearly),
        currency: p.currency,
        trialDays: p.trialDays,
        limits: p.limits,
        features: p.features,
        isActive: p.isActive,
      }));
    } catch (err: any) {
      this.logger.warn(`Failed to fetch plans from database (${err.message}). Returning static default plans.`);
      return DEFAULT_PLANS;
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async registerSchool(dto: RegisterTenantDto) {
    let baseSlug = this.slugify(dto.schoolName);
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = `school-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let slug = baseSlug;
    let existingSlug = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Check email uniqueness
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new DomainError('DUPLICATE_ENTRY', 'A user with this email already exists');
    }

    // Resolve plan
    const planCode = dto.planCode || 'GROWTH';
    let plan = await this.prisma.saasPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      await this.getPublicPlans(); // ensures seeded
      plan = await this.prisma.saasPlan.findFirst({
        where: { code: planCode },
      });
      if (!plan) {
        plan = await this.prisma.saasPlan.findFirst({
          where: { isActive: true },
        });
      }
    }

    if (!plan) {
      throw new DomainError('VALIDATION_ERROR', `Plan '${planCode}' not found`);
    }

    const tenantId = `ten_${this.idGen.generate()}`;
    const userId = `usr_${this.idGen.generate()}`;
    const subId = `sub_${this.idGen.generate()}`;
    const sessionId = `ses_${this.idGen.generate()}`;
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const trialDays = plan.trialDays || 14;
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Current academic year name (e.g. 2026-27)
    const currentYear = now.getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    const sessionName = `${currentYear}-${nextYearShort}`;

    const startDate = new Date(currentYear, 3, 1); // April 1
    const endDate = new Date(currentYear + 1, 2, 31); // March 31

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          name: dto.schoolName,
          slug,
          board: dto.board || 'CBSE',
          address: {
            city: dto.city,
            state: dto.state,
          },
          email: dto.email,
          phone: dto.phone,
          status: 'TRIAL',
        },
      });

      // 2. Create Default Roles
      let superAdminRoleId = '';
      for (const roleDef of DEFAULT_SYSTEM_ROLES) {
        const roleId = `rol_${this.idGen.generate()}`;
        if (roleDef.key === 'SUPER_ADMIN') {
          superAdminRoleId = roleId;
        }
        await tx.tenantRole.create({
          data: {
            id: roleId,
            tenantId,
            key: roleDef.key,
            name: roleDef.name,
            description: roleDef.description,
            isSystem: roleDef.isSystem,
            permissions: roleDef.permissions,
          },
        });
      }

      // 3. Create Super Admin User
      const user = await tx.user.create({
        data: {
          id: userId,
          tenantId,
          name: dto.adminName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          roleId: superAdminRoleId,
          roleKey: 'SUPER_ADMIN',
          roleName: 'Super Admin',
          status: 'ACTIVE',
        },
        include: {
          role: true,
        },
      });

      // 4. Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          id: subId,
          tenantId,
          planId: plan.id,
          planName: plan.name,
          status: 'TRIAL',
          billingCycle: dto.billingCycle || 'YEARLY',
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenew: true,
          limits: plan.limits as any,
          usage: {
            students: 0,
            staff: 1,
            storageGb: 0,
            smsCredits: 0,
          },
        },
      });

      // 5. Create default Academic Session
      await tx.academicSession.create({
        data: {
          id: sessionId,
          schoolId: tenantId,
          name: sessionName,
          startDate,
          endDate,
          status: 'current',
          isCurrent: true,
          createdBy: userId,
        },
      });

      return { tenant, user, subscription };
    });

    const permissions = Array.isArray(result.user.role.permissions)
      ? (result.user.role.permissions as string[])
      : [];

    const tokens = await this.tokenService.createTokenPair({
      id: result.user.id,
      tenantId: result.tenant.id,
      roleKey: result.user.roleKey,
      permissions,
    });

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        logoUrl: result.tenant.logoUrl,
        brandColor: result.tenant.brandColor,
        board: result.tenant.board,
        udiseCode: result.tenant.udiseCode,
        address: result.tenant.address,
        phone: result.tenant.phone,
        email: result.tenant.email,
        timezone: result.tenant.timezone,
        currency: result.tenant.currency,
        status: result.tenant.status,
        createdAt: result.tenant.createdAt.toISOString(),
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        avatarUrl: result.user.avatarUrl,
        roleId: result.user.roleId,
        roleKey: result.user.roleKey,
        roleName: result.user.roleName,
        status: result.user.status,
        linkedStaffId: null,
        linkedStudentIds: [],
        lastLoginAt: null,
        createdAt: result.user.createdAt.toISOString(),
      },
      subscription: {
        id: result.subscription.id,
        planId: result.subscription.planId,
        planName: result.subscription.planName,
        status: result.subscription.status,
        billingCycle: result.subscription.billingCycle,
        trialEndsAt: result.subscription.trialEndsAt?.toISOString().slice(0, 10),
        currentPeriodStart: result.subscription.currentPeriodStart.toISOString().slice(0, 10),
        currentPeriodEnd: result.subscription.currentPeriodEnd.toISOString().slice(0, 10),
        autoRenew: result.subscription.autoRenew,
        usage: result.subscription.usage,
        limits: result.subscription.limits,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getOnboardingStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new DomainError('NOT_FOUND', 'Tenant not found');
    }

    const sessionCount = await this.prisma.academicSession.count({
      where: { schoolId: tenantId },
    });

    const userCount = await this.prisma.user.count({
      where: { tenantId },
    });

    const isProfileDone = !!(tenant.phone && tenant.email && tenant.address);
    const isSessionDone = sessionCount > 0;
    const isClassesDone = false; // Classes not added yet
    const isFeeDone = false;
    const isStaffDone = false;
    const isStudentsDone = false;
    const isInviteTeamDone = userCount > 1;

    const steps = [
      {
        key: 'school_profile',
        title: 'Complete school profile',
        isDone: isProfileDone,
        link: '/settings/school',
      },
      {
        key: 'academic_session',
        title: 'Set academic session',
        isDone: isSessionDone,
        link: '/academic/sessions',
      },
      {
        key: 'classes',
        title: 'Add classes & sections',
        isDone: isClassesDone,
        link: '/academic/classes',
      },
      {
        key: 'fee_structure',
        title: 'Create fee structure',
        isDone: isFeeDone,
        link: '/fees/structures',
      },
      {
        key: 'staff',
        title: 'Add staff',
        isDone: isStaffDone,
        link: '/staff/new',
      },
      {
        key: 'students',
        title: 'Add or import students',
        isDone: isStudentsDone,
        link: '/students/import',
      },
      {
        key: 'invite_team',
        title: 'Invite your team',
        isDone: isInviteTeamDone,
        link: '/administrators',
      },
    ];

    const completedCount = steps.filter((s) => s.isDone).length;

    return {
      completedCount,
      totalCount: steps.length,
      steps,
    };
  }

  async dismissOnboarding(tenantId: string) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingDismissed: true },
    });

    return {
      dismissed: true,
    };
  }
}
