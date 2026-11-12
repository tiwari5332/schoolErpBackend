import { Injectable, Logger } from '@nestjs/common';
import argon2 from 'argon2';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { TokenService } from './token.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import {
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repo: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  private sanitizeUser(user: any) {
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

  private sanitizeTenant(tenant: any) {
    if (!tenant) return null;
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl || null,
      brandColor: tenant.brandColor || '#4F46E5',
      board: tenant.board || 'CBSE',
      udiseCode: tenant.udiseCode || null,
      address: tenant.address || null,
      phone: tenant.phone || null,
      email: tenant.email,
      timezone: tenant.timezone || 'Asia/Kolkata',
      currency: tenant.currency || 'INR',
      status: tenant.status || 'ACTIVE',
      createdAt: tenant.createdAt.toISOString(),
    };
  }

  async login(dto: LoginDto) {
    let tenantId: string | undefined;
    let tenant: any = null;

    if (dto.tenantSlug) {
      tenant = await this.repo.findTenantBySlug(dto.tenantSlug);
      if (!tenant) {
        throw new DomainError('UNAUTHENTICATED', 'Tenant not found with provided slug');
      }
      tenantId = tenant.id;
    }

    const user = await this.repo.findUserByIdentifier(dto.identifier, tenantId);
    if (!user) {
      throw new DomainError('UNAUTHENTICATED', 'Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new DomainError('UNAUTHENTICATED', 'Invalid credentials');
    }

    if (user.status === 'INACTIVE') {
      throw new DomainError('UNAUTHENTICATED', 'Account is deactivated');
    }

    if (!tenant && user.tenantId) {
      tenant = await this.repo.findTenantById(user.tenantId);
    }

    if (tenant && tenant.status === 'SUSPENDED') {
      throw new DomainError('SUBSCRIPTION_EXPIRED', 'Tenant subscription is suspended');
    }

    await this.repo.updateLastLogin(user.id);

    const permissions = Array.isArray(user.role.permissions) ? (user.role.permissions as string[]) : [];

    const tokens = await this.tokenService.createTokenPair(
      {
        id: user.id,
        tenantId: user.tenantId,
        roleKey: user.roleKey,
        permissions,
      },
      dto.rememberMe,
    );

    let subscription: any = null;
    if (user.tenantId) {
      const sub = await this.repo.getLatestSubscription(user.tenantId);
      if (sub) {
        subscription = {
          status: sub.status,
          trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString().slice(0, 10) : null,
        };
      } else {
        subscription = {
          status: tenant?.status || 'TRIAL',
          trialEndsAt: null,
        };
      }
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.sanitizeUser(user),
      tenant: this.sanitizeTenant(tenant),
      permissions,
      subscription,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    return this.tokenService.rotateRefreshToken(dto.refreshToken);
  }

  async logout(dto: LogoutDto, userId?: string) {
    await this.tokenService.revokeRefreshToken(dto.refreshToken, userId);
  }

  async me(userId: string, tenantId?: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new DomainError('UNAUTHENTICATED', 'User not found');
    }

    let tenant = user.tenant;
    if (!tenant && tenantId) {
      tenant = await this.repo.findTenantById(tenantId);
    }

    const permissions = Array.isArray(user.role.permissions) ? (user.role.permissions as string[]) : [];

    let activeSession: any = null;
    if (user.tenantId) {
      const session = await this.repo.getActiveSession(user.tenantId);
      if (session) {
        activeSession = {
          id: session.id,
          name: session.name,
          startDate: session.startDate.toISOString().slice(0, 10),
          endDate: session.endDate.toISOString().slice(0, 10),
          status: session.status,
          isCurrent: session.isCurrent,
        };
      }
    }

    return {
      user: this.sanitizeUser(user),
      tenant: this.sanitizeTenant(tenant),
      permissions,
      activeSession,
      serverDate: this.clock.today('Asia/Kolkata'),
      serverDateTime: this.clock.nowIso(),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.repo.findUserByIdentifier(dto.identifier);
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await this.repo.createPasswordReset(
        `pwr_${this.idGen.generate()}`,
        user.id,
        tokenHash,
        expiresAt,
      );

      this.logger.log(`Password reset link requested for user ${user.id}`);
    }

    return {
      message: 'If the account exists, a reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const resetRecord = await this.repo.findPasswordReset(tokenHash);

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new DomainError('TOKEN_EXPIRED', 'Reset token is invalid or expired');
    }

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.repo.updateUserPassword(resetRecord.userId, passwordHash);
    await this.repo.markPasswordResetUsed(resetRecord.id);

    return {
      message: 'Password updated',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new DomainError('UNAUTHENTICATED', 'User not found');
    }

    const isCurrentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isCurrentValid) {
      throw new DomainError('VALIDATION_ERROR', 'Current password is incorrect');
    }

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.repo.updateUserPassword(userId, passwordHash);

    return {
      message: 'Password changed',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updatedUser = await this.repo.updateUserProfile(userId, dto);
    return {
      user: this.sanitizeUser(updatedUser),
    };
  }
}

