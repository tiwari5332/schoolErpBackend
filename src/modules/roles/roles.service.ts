import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import { RoleCreateDto, RoleUpdateDto } from './dto/roles.dto';
import { ALL_PERMISSIONS } from './default-roles';

export const PERMISSION_GROUPS_CATALOG = [
  {
    module: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard' },
    ],
  },
  {
    module: 'Students',
    permissions: [
      { key: 'students.view', label: 'View Students' },
      { key: 'students.create', label: 'Create Student' },
      { key: 'students.update', label: 'Update Student' },
      { key: 'students.delete', label: 'Delete Student' },
      { key: 'students.import', label: 'Bulk Import Students' },
      { key: 'students.promote', label: 'Promote Students' },
    ],
  },
  {
    module: 'Staff',
    permissions: [
      { key: 'staff.view', label: 'View Staff' },
      { key: 'staff.create', label: 'Create Staff' },
      { key: 'staff.update', label: 'Update Staff' },
      { key: 'staff.delete', label: 'Delete Staff' },
      { key: 'staff.import', label: 'Bulk Import Staff' },
    ],
  },
  {
    module: 'Attendance',
    permissions: [
      { key: 'attendance.student.view', label: 'View Student Attendance' },
      { key: 'attendance.student.mark', label: 'Mark Student Attendance' },
      { key: 'attendance.staff.view', label: 'View Staff Attendance' },
      { key: 'attendance.staff.mark', label: 'Mark Staff Attendance' },
      { key: 'leave.apply', label: 'Apply for Leave' },
      { key: 'leave.approve', label: 'Approve Leaves' },
    ],
  },
  {
    module: 'Academic Setup',
    permissions: [
      { key: 'academic.view', label: 'View Academic Setup' },
      { key: 'academic.manage', label: 'Manage Academic Setup' },
      { key: 'timetable.view', label: 'View Timetable' },
      { key: 'timetable.manage', label: 'Manage Timetable' },
    ],
  },
  {
    module: 'Exams & Results',
    permissions: [
      { key: 'exams.view', label: 'View Exams' },
      { key: 'exams.create', label: 'Create Exam' },
      { key: 'exams.marks.enter', label: 'Enter Marks' },
      { key: 'exams.marks.lock', label: 'Lock Marks' },
      { key: 'exams.publish', label: 'Publish Results' },
    ],
  },
  {
    module: 'Fees',
    permissions: [
      { key: 'fees.view', label: 'View Fees' },
      { key: 'fees.manage', label: 'Manage Fee Structures' },
      { key: 'fees.collect', label: 'Collect Fees' },
      { key: 'fees.concession', label: 'Grant Concession' },
      { key: 'fees.refund', label: 'Process Refunds' },
    ],
  },
  {
    module: 'Communication',
    permissions: [
      { key: 'communication.view', label: 'View Communications' },
      { key: 'communication.send', label: 'Send Announcements/Notices' },
    ],
  },
  {
    module: 'Administration & System',
    permissions: [
      { key: 'roles.manage', label: 'Manage Roles' },
      { key: 'users.manage', label: 'Manage Users' },
      { key: 'reports.view', label: 'View Reports' },
      { key: 'reports.export', label: 'Export Reports' },
      { key: 'settings.manage', label: 'Manage Settings' },
      { key: 'subscription.manage', label: 'Manage Subscription' },
      { key: 'audit.view', label: 'View Audit Logs' },
      { key: 'approvals.decide', label: 'Decide Approvals' },
    ],
  },
];

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGen: IdGenerator,
  ) {}

  private formatRole(role: any, userCount = 0) {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description || null,
      isSystem: role.isSystem,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      userCount,
    };
  }

  async getRoles(tenantId: string) {
    const roles = await this.prisma.tenantRole.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    const roleIds = roles.map((r) => r.id);
    const userCounts = await this.prisma.user.groupBy({
      by: ['roleId'],
      where: { roleId: { in: roleIds }, tenantId },
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    for (const uc of userCounts) {
      countMap.set(uc.roleId, uc._count.id);
    }

    return {
      items: roles.map((r) => this.formatRole(r, countMap.get(r.id) || 0)),
    };
  }

  async createRole(tenantId: string, dto: RoleCreateDto) {
    const key = `CUSTOM_${this.idGen.generate().slice(-6).toUpperCase()}`;

    // Validate that provided permissions are recognized
    for (const p of dto.permissions) {
      if (!ALL_PERMISSIONS.includes(p)) {
        throw new DomainError('VALIDATION_ERROR', `Unrecognized permission key: '${p}'`);
      }
    }

    const role = await this.prisma.tenantRole.create({
      data: {
        id: `rol_${this.idGen.generate()}`,
        tenantId,
        key,
        name: dto.name,
        description: dto.description,
        isSystem: false,
        permissions: dto.permissions,
      },
    });

    return this.formatRole(role, 0);
  }

  async updateRole(tenantId: string, roleId: string, dto: RoleUpdateDto) {
    const role = await this.prisma.tenantRole.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new DomainError('NOT_FOUND', 'Role not found');
    }

    if (role.isSystem && role.key === 'SUPER_ADMIN') {
      throw new DomainError('FORBIDDEN', 'Super Admin role cannot be modified');
    }

    // Validate permissions
    for (const p of dto.permissions) {
      if (!ALL_PERMISSIONS.includes(p)) {
        throw new DomainError('VALIDATION_ERROR', `Unrecognized permission key: '${p}'`);
      }
    }

    const updated = await this.prisma.tenantRole.update({
      where: { id: roleId },
      data: {
        ...(dto.name && !role.isSystem && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        permissions: dto.permissions,
      },
    });

    const userCount = await this.prisma.user.count({
      where: { roleId, tenantId },
    });

    return this.formatRole(updated, userCount);
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await this.prisma.tenantRole.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new DomainError('NOT_FOUND', 'Role not found');
    }

    if (role.isSystem) {
      throw new DomainError('FORBIDDEN', 'System roles cannot be deleted');
    }

    const userCount = await this.prisma.user.count({
      where: { roleId, tenantId },
    });

    if (userCount > 0) {
      throw new DomainError('CONFLICT', `Cannot delete role with ${userCount} assigned user(s)`);
    }

    await this.prisma.tenantRole.delete({
      where: { id: roleId },
    });
  }

  getPermissionsCatalog() {
    return {
      groups: PERMISSION_GROUPS_CATALOG,
    };
  }
}

