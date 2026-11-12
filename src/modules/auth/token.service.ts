import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';

export interface TokenUserContext {
  id: string;
  tenantId?: string | null;
  roleKey: string;
  permissions: string[];
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGen: IdGenerator,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateAccessToken(user: TokenUserContext): string {
    return jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenantId || undefined,
        roleKey: user.roleKey,
        permissions: user.permissions,
        isPlatformOwner: user.roleKey === 'PLATFORM_OWNER',
      },
      env.JWT_SECRET,
      { expiresIn: '15m' },
    );
  }

  async createTokenPair(user: TokenUserContext, rememberMe = false): Promise<GeneratedTokens> {
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = `rtf_${this.idGen.generate()}`;
    const expiresInDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    try {
      await this.prisma.refreshToken.create({
        data: {
          id: `rt_${this.idGen.generate()}`,
          userId: user.id,
          tokenHash,
          familyId,
          expiresAt,
          isRevoked: false,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to store refresh token in DB: ${err.message}`);
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 min in seconds
    };
  }

  async rotateRefreshToken(rawRefreshToken: string): Promise<GeneratedTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new DomainError('UNAUTHENTICATED', 'Invalid refresh token');
    }

    // Reuse detection
    if (tokenRecord.isRevoked) {
      this.logger.warn(`Refresh token reuse detected for family ${tokenRecord.familyId}. Revoking all tokens.`);
      await this.prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { isRevoked: true },
      });
      throw new DomainError('UNAUTHENTICATED', 'Refresh token reuse detected. Please log in again.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });
      throw new DomainError('TOKEN_EXPIRED', 'Refresh token has expired');
    }

    // Revoke current token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Create next token in family
    const nextRawToken = crypto.randomBytes(32).toString('hex');
    const nextTokenHash = this.hashToken(nextRawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        id: `rt_${this.idGen.generate()}`,
        userId: tokenRecord.userId,
        tokenHash: nextTokenHash,
        familyId: tokenRecord.familyId,
        expiresAt,
        isRevoked: false,
      },
    });

    const user = tokenRecord.user;
    const permissions = Array.isArray(user.role.permissions) ? (user.role.permissions as string[]) : [];
    const accessToken = this.generateAccessToken({
      id: user.id,
      tenantId: user.tenantId,
      roleKey: user.roleKey,
      permissions,
    });

    return {
      accessToken,
      refreshToken: nextRawToken,
      expiresIn: 900,
    };
  }

  async revokeRefreshToken(rawRefreshToken?: string, userId?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    } else if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }
}

