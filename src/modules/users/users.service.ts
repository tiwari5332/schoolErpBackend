import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import argon2 from 'argon2';
import { PrismaService } from '../../infra/db/prisma.service';
import { TokenService } from '../auth/token.service';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import { createPaginationMeta } from '../../common/pagination.util';
import {
  UsersQueryDto,
  UserInviteDto,
  UserUpdateDto,
  UserStatusDto,
} from './dto/users.dto';
import { AcceptInviteDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly idGen: IdGenerator,
  ) {}

  private formatUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      roleId: user.roleId,
      roleKey: user.roleKey,
      roleName: user.roleName || user.role?.name || 'User',
      status: user.status,
      linkedStaffId: user.linkedStaffId || null,
      linkedStudentIds: Array.isArray(user.linkedStudentIds) ? user.linkedStudentIds : [],
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getUsers(tenantId: string, query: UsersQueryDto) {
    const { page, pageSize, search, roleId, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (roleId) {
      where.roleId = roleId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => this.formatUser(u)),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }

  async inviteUser(tenantId: string, dto: UserInviteDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });
    if (existing) {
      throw new DomainError('DUPLICATE_ENTRY', 'User with this email already exists in this school');
    }

    const role = await this.prisma.tenantRole.findFirst({
      where: { id: dto.roleId, OR: [{ tenantId }, { tenantId: null }] },
    });
    if (!role) {
      throw new DomainError('VALIDATION_ERROR', 'Role not found');
    }

    // Check plan limits for staff
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (sub && sub.limits) {
      const limits = sub.limits as any;
      if (limits.staff) {
        const currentCount = await this.prisma.user.count({ where: { tenantId } });
        if (currentCount >= limits.staff) {
          throw new DomainError('PLAN_LIMIT_REACHED', 'Staff limit for current subscription plan reached');
        }
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const userId = `usr_${this.idGen.generate()}`;
    const placeholderPasswordHash = await argon2.hash(crypto.randomBytes(16).toString('hex'), {
      type: argon2.argon2id,
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          id: userId,
          tenantId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash: placeholderPasswordHash,
          roleId: role.id,
          roleKey: role.key,
          roleName: role.name,
          status: 'INVITED',
          mustChangePassword: true,
        },
        include: { role: true },
      });

      await tx.userInvite.create({
        data: {
          id: `inv_${this.idGen.generate()}`,
          tenantId,
          email: dto.email,
          name: dto.name,
          phone: dto.phone,
          roleId: role.id,
          tokenHash,
          expiresAt,
        },
      });

      return createdUser;
    });

    const inviteLink = `https://app.edutrio.com/accept-invite?token=${rawToken}`;

    return {
      user: this.formatUser(user),
      inviteLink,
    };
  }

  async updateUser(tenantId: string, userId: string, dto: UserUpdateDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new DomainError('NOT_FOUND', 'User not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    if (dto.roleId && dto.roleId !== user.roleId) {
      const role = await this.prisma.tenantRole.findFirst({
        where: { id: dto.roleId, OR: [{ tenantId }, { tenantId: null }] },
      });
      if (!role) {
        throw new DomainError('VALIDATION_ERROR', 'Target role not found');
      }
      updateData.roleId = role.id;
      updateData.roleKey = role.key;
      updateData.roleName = role.name;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true },
    });

    return this.formatUser(updated);
  }

  async updateUserStatus(tenantId: string, userId: string, dto: UserStatusDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new DomainError('NOT_FOUND', 'User not found');
    }

    if (dto.status === 'INACTIVE' && user.roleKey === 'SUPER_ADMIN') {
      const activeSuperAdminCount = await this.prisma.user.count({
        where: { tenantId, roleKey: 'SUPER_ADMIN', status: 'ACTIVE' },
      });
      if (activeSuperAdminCount <= 1) {
        throw new DomainError('VALIDATION_ERROR', 'Cannot deactivate the only active Super Admin');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      include: { role: true },
    });

    return this.formatUser(updated);
  }

  async triggerPasswordReset(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new DomainError('NOT_FOUND', 'User not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.passwordReset.create({
      data: {
        id: `pwr_${this.idGen.generate()}`,
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.log(`Password reset triggered for user ${user.id} by admin`);

    return {
      message: 'Reset link sent',
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const invite = await this.prisma.userInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new DomainError('TOKEN_EXPIRED', 'Invite token is invalid or has expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: invite.email, tenantId: invite.tenantId },
      include: { role: true },
    });

    if (!user) {
      throw new DomainError('NOT_FOUND', 'User matching invite was not found');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
        },
      });

      await tx.userInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });

    const permissions = Array.isArray(user.role.permissions)
      ? (user.role.permissions as string[])
      : [];

    const tokens = await this.tokenService.createTokenPair({
      id: user.id,
      tenantId: user.tenantId,
      roleKey: user.roleKey,
      permissions,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}

