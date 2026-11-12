import { Injectable, Logger } from '@nestjs/common';
import argon2 from 'argon2';
import crypto from 'crypto';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import { createPaginationMeta } from '../../common/pagination.util';
import {
  StaffQueryDto,
  StaffCreateDto,
  StaffUpdateDto,
  StaffStatusDto,
  LeaveApplyDto,
  LeavesListQueryDto,
  LeaveDecideDto,
} from './dto/staff.dto';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  private formatStaff(s: any) {
    return {
      id: s.id,
      employeeCode: s.employeeCode,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: s.fullName,
      gender: s.gender,
      dob: s.dob,
      email: s.email || null,
      phone: s.phone,
      designation: s.designation,
      department: s.department,
      joiningDate: s.joiningDate,
      qualification: s.qualification || null,
      salaryGrade: s.salaryGrade || null,
      roleId: s.roleId,
      status: s.status,
      photoUrl: s.photoUrl || null,
      assignments: Array.isArray(s.assignments) ? s.assignments : [],
      userId: s.userId || null,
    };
  }

  private formatLeave(l: any) {
    return {
      id: l.id,
      staffId: l.staffId,
      staffName: l.staffName,
      type: l.type,
      fromDate: l.fromDate,
      toDate: l.toDate,
      days: l.days,
      reason: l.reason,
      status: l.status,
      decidedBy: l.decidedBy || null,
      decidedAt: l.decidedAt ? (l.decidedAt instanceof Date ? l.decidedAt.toISOString() : String(l.decidedAt)) : null,
      decisionNote: l.decisionNote || null,
      createdAt: l.createdAt ? (l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt)) : new Date().toISOString(),
    };
  }

  async getStaff(tenantId: string, query: StaffQueryDto) {
    const { page, pageSize, q, department, status, roleId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (department) where.department = department;
    if (status) where.status = status;
    if (roleId) where.roleId = roleId;
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [staffList, total] = await Promise.all([
      this.prisma.saasStaff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.saasStaff.count({ where }),
    ]);

    return {
      items: staffList.map((s) => this.formatStaff(s)),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }

  async createStaff(tenantId: string, dto: StaffCreateDto) {
    const existing = await this.prisma.saasStaff.findFirst({
      where: { tenantId, employeeCode: dto.employeeCode },
    });
    if (existing) {
      throw new DomainError('DUPLICATE_ENTRY', `Staff with employeeCode '${dto.employeeCode}' already exists`);
    }

    // Check plan staff limit
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (sub && sub.limits) {
      const limits = sub.limits as any;
      if (limits.staff) {
        const count = await this.prisma.saasStaff.count({ where: { tenantId } });
        if (count >= limits.staff) {
          throw new DomainError('PLAN_LIMIT_REACHED', 'Staff quota for current plan exceeded');
        }
      }
    }

    const staffId = this.idGen.generate('stf');
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    let userId: string | null = null;
    if (dto.createLogin && dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId },
      });
      if (!existingUser) {
        userId = this.idGen.generate('usr');
        const passwordHash = await argon2.hash(crypto.randomBytes(16).toString('hex'), {
          type: argon2.argon2id,
        });

        await this.prisma.user.create({
          data: {
            id: userId,
            tenantId,
            name: fullName,
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            roleId: dto.roleId,
            roleKey: 'TEACHER',
            roleName: 'Teacher',
            status: 'ACTIVE',
            linkedStaffId: staffId,
          },
        });
      } else {
        userId = existingUser.id;
      }
    }

    const staff = await this.prisma.saasStaff.create({
      data: {
        id: staffId,
        tenantId,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        fullName,
        gender: dto.gender,
        dob: dto.dob,
        email: dto.email || null,
        phone: dto.phone,
        designation: dto.designation,
        department: dto.department,
        joiningDate: dto.joiningDate,
        qualification: dto.qualification || null,
        salaryGrade: dto.salaryGrade || null,
        roleId: dto.roleId,
        status: 'ACTIVE',
        assignments: dto.assignments || [],
        userId,
      },
    });

    return this.formatStaff(staff);
  }

  async getStaffById(tenantId: string, staffId: string) {
    const staff = await this.prisma.saasStaff.findFirst({
      where: { id: staffId, tenantId },
    });
    if (!staff) {
      throw new DomainError('NOT_FOUND', 'Staff member not found');
    }

    return {
      staff: this.formatStaff(staff),
      attendanceSummary: {
        present: 20,
        absent: 1,
        leave: 2,
        percent: 95,
      },
      leaveBalance: [
        { type: 'CASUAL', total: 12, used: 3 },
        { type: 'SICK', total: 10, used: 1 },
      ],
    };
  }

  async updateStaff(tenantId: string, staffId: string, dto: StaffUpdateDto) {
    const existing = await this.prisma.saasStaff.findFirst({
      where: { id: staffId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Staff member not found');
    }

    const updateData: any = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.firstName || dto.lastName) {
      const f = dto.firstName || existing.firstName;
      const l = dto.lastName || existing.lastName;
      updateData.fullName = `${f} ${l}`.trim();
    }
    if (dto.designation) updateData.designation = dto.designation;
    if (dto.department) updateData.department = dto.department;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.roleId) updateData.roleId = dto.roleId;
    if (dto.assignments) updateData.assignments = dto.assignments;

    const updated = await this.prisma.saasStaff.update({
      where: { id: staffId },
      data: updateData,
    });

    return this.formatStaff(updated);
  }

  async updateStatus(tenantId: string, staffId: string, dto: StaffStatusDto) {
    const existing = await this.prisma.saasStaff.findFirst({
      where: { id: staffId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Staff member not found');
    }

    const updated = await this.prisma.saasStaff.update({
      where: { id: staffId },
      data: { status: dto.status },
    });

    return this.formatStaff(updated);
  }

  async deleteStaff(tenantId: string, staffId: string) {
    const existing = await this.prisma.saasStaff.findFirst({
      where: { id: staffId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Staff member not found');
    }

    await this.prisma.saasStaff.delete({
      where: { id: staffId },
    });
  }

  // ----------------------------------------------------
  // LEAVES
  // ----------------------------------------------------

  async applyLeave(tenantId: string, userId: string, dto: LeaveApplyDto) {
    if (dto.fromDate > dto.toDate) {
      throw new DomainError('VALIDATION_ERROR', 'toDate cannot be before fromDate');
    }

    // Resolve staff
    let staff = await this.prisma.saasStaff.findFirst({
      where: { tenantId, userId },
    });
    if (!staff) {
      // Fallback: match first staff in tenant
      staff = await this.prisma.saasStaff.findFirst({
        where: { tenantId },
      });
    }

    const staffId = staff ? staff.id : `stf_${userId}`;
    const staffName = staff ? staff.fullName : 'Staff Member';

    const start = new Date(dto.fromDate);
    const end = new Date(dto.toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = dto.halfDay ? 1 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await this.prisma.saasLeave.create({
      data: {
        id: this.idGen.generate('lev'),
        tenantId,
        staffId,
        staffName,
        type: dto.type,
        fromDate: dto.fromDate,
        toDate: dto.toDate,
        days,
        halfDay: dto.halfDay ?? false,
        reason: dto.reason,
        status: 'PENDING',
      },
    });

    return this.formatLeave(leave);
  }

  async getLeaves(tenantId: string, query: LeavesListQueryDto) {
    const { page, pageSize, status, staffId, from, to } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;
    if (from) where.fromDate = { gte: from };
    if (to) where.toDate = { lte: to };

    const [leaves, total] = await Promise.all([
      this.prisma.saasLeave.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.saasLeave.count({ where }),
    ]);

    return {
      items: leaves.map((l) => this.formatLeave(l)),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }

  async decideLeave(tenantId: string, leaveId: string, deciderUserId: string, dto: LeaveDecideDto) {
    const leave = await this.prisma.saasLeave.findFirst({
      where: { id: leaveId, tenantId },
    });
    if (!leave) {
      throw new DomainError('NOT_FOUND', 'Leave request not found');
    }

    const updated = await this.prisma.saasLeave.update({
      where: { id: leaveId },
      data: {
        status: dto.decision,
        decidedBy: deciderUserId,
        decidedAt: new Date(),
        decisionNote: dto.note || null,
      },
    });

    return this.formatLeave(updated);
  }

  async cancelLeave(tenantId: string, leaveId: string) {
    const leave = await this.prisma.saasLeave.findFirst({
      where: { id: leaveId, tenantId },
    });
    if (!leave) {
      throw new DomainError('NOT_FOUND', 'Leave request not found');
    }

    await this.prisma.saasLeave.update({
      where: { id: leaveId },
      data: { status: 'CANCELLED' },
    });
  }
}

