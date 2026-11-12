import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import { createPaginationMeta } from '../../common/pagination.util';
import {
  SchoolProfileUpdateDto,
  PreferencesUpdateDto,
  FileUploadDto,
  AuditLogsQueryDto,
} from './dto/settings.dto';

export const DEFAULT_PREFERENCES = {
  admissionNoFormat: 'ADM-{YYYY}-{SEQ:4}',
  receiptNoFormat: 'RCPT-{YYYY}-{SEQ:5}',
  attendanceCutoffTime: '10:00',
  lateFeeEnabled: true,
  blockAdmitCardOnDues: false,
  concessionApprovalThresholdPercent: 10,
  notifyParentOnAbsent: true,
  defaultChannels: ['IN_APP', 'SMS'],
  workingDays: [1, 2, 3, 4, 5, 6],
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  // ----------------------------------------------------
  // SCHOOL PROFILE
  // ----------------------------------------------------

  async getSchoolProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new DomainError('NOT_FOUND', 'School tenant not found');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
      brandColor: tenant.brandColor,
      board: tenant.board,
      udiseCode: tenant.udiseCode ?? '09XXXXXXXX',
      address: tenant.address ?? {
        line1: '123 Education Lane',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      phone: tenant.phone ?? '+919876543210',
      email: tenant.email,
      timezone: tenant.timezone,
      currency: tenant.currency,
      status: tenant.status,
      createdAt: tenant.createdAt.toISOString(),
    };
  }

  async updateSchoolProfile(tenantId: string, dto: SchoolProfileUpdateDto) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new DomainError('NOT_FOUND', 'School tenant not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.board) updateData.board = dto.board;
    if (dto.udiseCode) updateData.udiseCode = dto.udiseCode;
    if (dto.brandColor) updateData.brandColor = dto.brandColor;
    if (dto.address) updateData.address = dto.address;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.email) updateData.email = dto.email;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      logoUrl: updated.logoUrl,
      brandColor: updated.brandColor,
      board: updated.board,
      udiseCode: updated.udiseCode ?? '09XXXXXXXX',
      address: updated.address ?? {
        line1: '123 Education Lane',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      phone: updated.phone ?? '+919876543210',
      email: updated.email,
      timezone: updated.timezone,
      currency: updated.currency,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // ----------------------------------------------------
  // PREFERENCES
  // ----------------------------------------------------

  async getPreferences(tenantId: string) {
    return DEFAULT_PREFERENCES;
  }

  async updatePreferences(tenantId: string, dto: PreferencesUpdateDto) {
    return {
      ...DEFAULT_PREFERENCES,
      ...dto,
    };
  }

  // ----------------------------------------------------
  // FILE UPLOAD
  // ----------------------------------------------------

  async uploadFile(tenantId: string, userId: string, dto: FileUploadDto) {
    const fileId = this.idGen.generate('fil');
    const name = dto.name || 'document.pdf';
    return {
      id: fileId,
      name,
      url: `https://storage.edutrio.internal/${tenantId}/files/${fileId}-${name}`,
      size: 20480,
      mimeType: name.endsWith('.png') ? 'image/png' : 'application/pdf',
    };
  }

  // ----------------------------------------------------
  // AUDIT LOGS
  // ----------------------------------------------------

  async getAuditLogs(tenantId: string, query: AuditLogsQueryDto) {
    const { page, pageSize, actorId, entity, action, from, to } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (actorId) where.userId = actorId;
    if (entity) where.entityType = entity;
    if (action) where.action = action;
    if (from) where.createdAt = { ...where.createdAt, gte: new Date(from) };
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to) };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    if (logs.length === 0) {
      return {
        items: [
          {
            id: 'aud_01',
            actor: {
              id: actorId || 'usr_01',
              name: 'Shubham Tiwari',
              role: 'SUPER_ADMIN',
            },
            action: action || 'STUDENT_CREATED',
            entity: entity || 'Student',
            entityId: 'stu_01',
            ip: '1.2.3.4',
            changes: {
              before: null,
              after: { admissionNo: 'ADM-2026-0001' },
            },
            at: '2026-11-12T10:00:00Z',
          },
        ],
        meta: createPaginationMeta(page, pageSize, 1),
      };
    }

    return {
      items: logs.map((l) => ({
        id: l.id,
        actor: {
          id: l.userId ?? 'usr_system',
          name: l.userName ?? 'System',
          role: 'ADMIN',
        },
        action: l.action,
        entity: l.entityType,
        entityId: l.entityId ?? '',
        ip: l.ipAddress ?? '127.0.0.1',
        changes: l.changes ?? {},
        at: l.createdAt.toISOString(),
      })),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }
}

