import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { Tenant, User, TenantRole } from '@prisma/client';

export type UserWithRole = User & { role: TenantRole; tenant?: Tenant | null };

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async findTenantById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findUserByIdentifier(identifier: string, tenantId?: string): Promise<UserWithRole | null> {
    const where: any = {
      OR: [{ email: identifier }, { phone: identifier }],
    };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.user.findFirst({
      where,
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async findUserById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  async updateUserProfile(id: string, data: { name?: string; phone?: string; avatarUrl?: string | null }): Promise<UserWithRole> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async createPasswordReset(id: string, userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.passwordReset.create({
      data: {
        id,
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findPasswordReset(tokenHash: string): Promise<any> {
    return this.prisma.passwordReset.findUnique({
      where: { tokenHash },
    });
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async getActiveSession(tenantId: string): Promise<any> {
    return this.prisma.academicSession.findFirst({
      where: {
        schoolId: tenantId,
        isCurrent: true,
      },
    });
  }

  async getLatestSubscription(tenantId: string): Promise<any> {
    return this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

