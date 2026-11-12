import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import {
  PeriodsPutDto,
  TimetableByClassQueryDto,
  TimetableByTeacherQueryDto,
  TimetableEntryUpsertDto,
  TimetableSubstituteDto,
  TimetableFreeTeachersQueryDto,
} from './dto/timetable.dto';

export const DEFAULT_PERIODS = [
  { id: 'per_01', name: 'Period 1', startTime: '08:30', endTime: '09:15', isBreak: false, order: 1 },
  { id: 'per_02', name: 'Period 2', startTime: '09:15', endTime: '10:00', isBreak: false, order: 2 },
  { id: 'per_brk', name: 'Short Break', startTime: '10:00', endTime: '10:15', isBreak: true, order: 3 },
  { id: 'per_03', name: 'Period 3', startTime: '10:15', endTime: '11:00', isBreak: false, order: 4 },
  { id: 'per_04', name: 'Period 4', startTime: '11:00', endTime: '11:45', isBreak: false, order: 5 },
  { id: 'per_lnch', name: 'Lunch Break', startTime: '11:45', endTime: '12:30', isBreak: true, order: 6 },
  { id: 'per_05', name: 'Period 5', startTime: '12:30', endTime: '13:15', isBreak: false, order: 7 },
  { id: 'per_06', name: 'Period 6', startTime: '13:15', endTime: '14:00', isBreak: false, order: 8 },
];

@Injectable()
export class TimetableService {
  private readonly logger = new Logger(TimetableService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  private formatEntry(e: any) {
    return {
      id: e.id,
      classId: e.classId,
      sectionId: e.sectionId,
      dayOfWeek: e.dayOfWeek,
      periodId: e.periodId,
      subjectId: e.subjectId,
      subjectName: e.subjectName,
      teacherId: e.teacherId,
      teacherName: e.teacherName,
      room: e.room || null,
    };
  }

  // ----------------------------------------------------
  // PERIODS
  // ----------------------------------------------------

  async getPeriods(tenantId: string) {
    let periods = await this.prisma.saasPeriod.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    });

    if (periods.length === 0) {
      return {
        items: DEFAULT_PERIODS,
        workingDays: [1, 2, 3, 4, 5, 6],
      };
    }

    const workingDays = (periods[0]?.workingDays as number[]) || [1, 2, 3, 4, 5, 6];

    return {
      items: periods.map((p) => ({
        id: p.id,
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak: p.isBreak,
        order: p.order,
      })),
      workingDays,
    };
  }

  async replacePeriods(tenantId: string, dto: PeriodsPutDto) {
    const workingDays = dto.workingDays || [1, 2, 3, 4, 5, 6];

    // Remove existing periods
    await this.prisma.saasPeriod.deleteMany({
      where: { tenantId },
    });

    const createdItems: any[] = [];
    for (const p of dto.periods) {
      const id = p.id || this.idGen.generate('per');
      const item = await this.prisma.saasPeriod.create({
        data: {
          id,
          tenantId,
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          isBreak: p.isBreak ?? false,
          order: p.order,
          workingDays,
        },
      });
      createdItems.push({
        id: item.id,
        name: item.name,
        startTime: item.startTime,
        endTime: item.endTime,
        isBreak: item.isBreak,
        order: item.order,
      });
    }

    return {
      items: createdItems,
    };
  }

  // ----------------------------------------------------
  // TIMETABLE VIEWS
  // ----------------------------------------------------

  async getTimetableByClass(tenantId: string, query: TimetableByClassQueryDto) {
    const { classId, sectionId } = query;

    const periodsRes = await this.getPeriods(tenantId);

    const entries = await this.prisma.saasTimetableEntry.findMany({
      where: { tenantId, classId, sectionId },
      orderBy: [{ dayOfWeek: 'asc' }, { periodId: 'asc' }],
    });

    return {
      periods: periodsRes.items,
      entries: entries.map((e) => this.formatEntry(e)),
    };
  }

  async getTimetableByTeacher(tenantId: string, userId: string, query: TimetableByTeacherQueryDto) {
    let teacherId = query.staffId;

    if (!teacherId) {
      const staff = await this.prisma.saasStaff.findFirst({
        where: { tenantId, userId },
      });
      teacherId = staff ? staff.id : '';
    }

    const periodsRes = await this.getPeriods(tenantId);

    if (!teacherId) {
      return {
        periods: periodsRes.items,
        entries: [],
      };
    }

    const entries = await this.prisma.saasTimetableEntry.findMany({
      where: { tenantId, teacherId },
      orderBy: [{ dayOfWeek: 'asc' }, { periodId: 'asc' }],
    });

    return {
      periods: periodsRes.items,
      entries: entries.map((e) => this.formatEntry(e)),
    };
  }

  // ----------------------------------------------------
  // ENTRY UPSERT / DELETE
  // ----------------------------------------------------

  async upsertEntry(tenantId: string, dto: TimetableEntryUpsertDto) {
    const { classId, sectionId, dayOfWeek, periodId, subjectId, teacherId, room } = dto;

    // Check teacher conflict: Is this teacher already assigned to another class/section on the same day and period?
    const conflict = await this.prisma.saasTimetableEntry.findFirst({
      where: {
        tenantId,
        teacherId,
        dayOfWeek,
        periodId,
        NOT: {
          AND: [{ classId }, { sectionId }],
        },
      },
    });

    if (conflict) {
      throw new DomainError('TIMETABLE_CONFLICT', `Teacher is already assigned in period ${periodId} on day ${dayOfWeek}`);
    }

    // Resolve subject name
    let subjectName = 'Subject';
    const subject = await this.prisma.schoolSubject.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (subject) subjectName = subject.name;

    // Resolve teacher name
    let teacherName = 'Teacher';
    const teacher = await this.prisma.saasStaff.findFirst({
      where: { id: teacherId, tenantId },
    });
    if (teacher) teacherName = teacher.fullName;

    const existing = await this.prisma.saasTimetableEntry.findFirst({
      where: { tenantId, classId, sectionId, dayOfWeek, periodId },
    });

    let entry;
    if (existing) {
      entry = await this.prisma.saasTimetableEntry.update({
        where: { id: existing.id },
        data: {
          subjectId,
          subjectName,
          teacherId,
          teacherName,
          room: room || null,
        },
      });
    } else {
      entry = await this.prisma.saasTimetableEntry.create({
        data: {
          id: this.idGen.generate('ttb'),
          tenantId,
          classId,
          sectionId,
          dayOfWeek,
          periodId,
          subjectId,
          subjectName,
          teacherId,
          teacherName,
          room: room || null,
        },
      });
    }

    return this.formatEntry(entry);
  }

  async deleteEntry(tenantId: string, entryId: string) {
    const existing = await this.prisma.saasTimetableEntry.findFirst({
      where: { id: entryId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Timetable entry not found');
    }

    await this.prisma.saasTimetableEntry.delete({
      where: { id: entryId },
    });
  }

  // ----------------------------------------------------
  // SUBSTITUTIONS
  // ----------------------------------------------------

  async assignSubstitute(tenantId: string, dto: TimetableSubstituteDto) {
    const { date, entryId, substituteTeacherId, reason } = dto;

    const entry = await this.prisma.saasTimetableEntry.findFirst({
      where: { id: entryId, tenantId },
    });
    if (!entry) {
      throw new DomainError('NOT_FOUND', 'Timetable entry not found');
    }

    // Determine day of week from date (1 = Monday, ..., 7 = Sunday)
    const targetDate = new Date(date);
    let jsDay = targetDate.getDay(); // 0 is Sunday, 1 is Monday
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    // Check if substitute teacher is already busy at this day and period
    const teacherRegularBusy = await this.prisma.saasTimetableEntry.findFirst({
      where: {
        tenantId,
        teacherId: substituteTeacherId,
        dayOfWeek,
        periodId: entry.periodId,
      },
    });

    const teacherSubBusy = await this.prisma.saasTimetableSubstitution.findFirst({
      where: {
        tenantId,
        substituteTeacherId,
        date,
      },
    });

    if (teacherRegularBusy || teacherSubBusy) {
      throw new DomainError('TIMETABLE_CONFLICT', 'Substitute teacher is already scheduled for this period');
    }

    const sub = await this.prisma.saasTimetableSubstitution.create({
      data: {
        id: this.idGen.generate('sbs'),
        tenantId,
        date,
        entryId,
        substituteTeacherId,
        reason: reason || null,
      },
    });

    return {
      id: sub.id,
      date: sub.date,
      entryId: sub.entryId,
      substituteTeacherId: sub.substituteTeacherId,
    };
  }

  // ----------------------------------------------------
  // FREE TEACHERS
  // ----------------------------------------------------

  async getFreeTeachers(tenantId: string, query: TimetableFreeTeachersQueryDto) {
    const { dayOfWeek, periodId, date } = query;

    // Get all active staff
    const allStaff = await this.prisma.saasStaff.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });

    // Busy staff in this period
    const busyEntries = await this.prisma.saasTimetableEntry.findMany({
      where: { tenantId, dayOfWeek, periodId },
      select: { teacherId: true },
    });
    const busyIds = new Set(busyEntries.map((e) => e.teacherId));

    if (date) {
      const busySubs = await this.prisma.saasTimetableSubstitution.findMany({
        where: { tenantId, date },
        select: { substituteTeacherId: true },
      });
      for (const s of busySubs) {
        busyIds.add(s.substituteTeacherId);
      }
    }

    const freeTeachers = allStaff
      .filter((s) => !busyIds.has(s.id))
      .map((s) => ({
        staffId: s.id,
        name: s.fullName,
      }));

    return {
      items: freeTeachers,
    };
  }
}

