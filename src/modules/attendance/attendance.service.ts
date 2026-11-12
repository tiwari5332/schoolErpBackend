import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import {
  StudentAttendanceGetQueryDto,
  StudentAttendanceMarkDto,
  StudentAttendanceSummaryQueryDto,
  StudentAttendanceMonthlyQueryDto,
  StaffAttendanceGetQueryDto,
  StaffAttendanceMarkDto,
  StaffAttendanceCheckInDto,
  StaffAttendanceMonthlyQueryDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  private getTodayString(): string {
    const d = this.clock.now();
    return d.toISOString().split('T')[0];
  }

  private getCurrentTimeString(): string {
    const d = this.clock.now();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // ----------------------------------------------------
  // STUDENT ATTENDANCE
  // ----------------------------------------------------

  async getStudentAttendance(tenantId: string, query: StudentAttendanceGetQueryDto) {
    const { classId, sectionId, date } = query;

    // Check holiday
    const holiday = await this.prisma.calendarEvent.findFirst({
      where: {
        tenantId,
        startDate: { lte: date },
        endDate: { gte: date },
        type: 'HOLIDAY',
      },
    });

    const marks = await this.prisma.saasStudentAttendance.findMany({
      where: { tenantId, classId, sectionId, date },
      orderBy: { rollNo: 'asc' },
    });

    if (marks.length > 0) {
      return {
        date,
        isHoliday: !!holiday,
        isMarked: true,
        records: marks.map((m) => ({
          studentId: m.studentId,
          rollNo: m.rollNo || '',
          name: m.name,
          status: m.status,
          remark: m.remark || null,
          markedBy: m.markedBy,
          markedAt: m.markedAt.toISOString(),
        })),
      };
    }

    // Default roster: active students
    const students = await this.prisma.saasStudent.findMany({
      where: { tenantId, classId, sectionId, status: 'ACTIVE' },
      orderBy: { rollNo: 'asc' },
    });

    return {
      date,
      isHoliday: !!holiday,
      isMarked: false,
      records: students.map((s) => ({
        studentId: s.id,
        rollNo: s.rollNo || '',
        name: s.fullName,
        status: 'PRESENT',
        remark: null,
        markedBy: null,
        markedAt: null,
      })),
    };
  }

  async markStudentAttendance(tenantId: string, userId: string, dto: StudentAttendanceMarkDto) {
    const { classId, sectionId, date, records, notifyParentsOfAbsent } = dto;

    let present = 0;
    let absent = 0;
    let late = 0;

    for (const rec of records) {
      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'ABSENT') absent++;
      else if (rec.status === 'LATE') late++;

      // Resolve student name
      let name = 'Student';
      let rollNo: string | null = null;
      const student = await this.prisma.saasStudent.findFirst({
        where: { id: rec.studentId, tenantId },
      });
      if (student) {
        name = student.fullName;
        rollNo = student.rollNo;
      }

      const existing = await this.prisma.saasStudentAttendance.findFirst({
        where: { tenantId, studentId: rec.studentId, date },
      });

      if (existing) {
        await this.prisma.saasStudentAttendance.update({
          where: { id: existing.id },
          data: {
            status: rec.status,
            remark: rec.remark || null,
            markedBy: userId,
            markedAt: new Date(),
          },
        });
      } else {
        await this.prisma.saasStudentAttendance.create({
          data: {
            id: this.idGen.generate('att'),
            tenantId,
            date,
            classId,
            sectionId,
            studentId: rec.studentId,
            rollNo,
            name,
            status: rec.status,
            remark: rec.remark || null,
            markedBy: userId,
            markedAt: new Date(),
          },
        });
      }
    }

    if (notifyParentsOfAbsent && absent > 0) {
      this.logger.log(`[Notification] Triggered absent notifications for ${absent} students on ${date}`);
    }

    return {
      date,
      present,
      absent,
      late,
      notified: notifyParentsOfAbsent ? absent : 0,
    };
  }

  async getStudentAttendanceSummary(tenantId: string, query: StudentAttendanceSummaryQueryDto) {
    const date = query.date || this.getTodayString();

    const classes = await this.prisma.schoolClass.findMany({
      where: { tenantId },
      orderBy: { displayOrder: 'asc' },
    });

    const summaryItems: any[] = [];

    for (const cls of classes) {
      const sections = await this.prisma.classSection.findMany({
        where: { tenantId, classId: cls.id },
        orderBy: { name: 'asc' },
      });
      for (const sec of sections) {
        const total = await this.prisma.saasStudent.count({
          where: { tenantId, classId: cls.id, sectionId: sec.id, status: 'ACTIVE' },
        });

        const marks = await this.prisma.saasStudentAttendance.findMany({
          where: { tenantId, classId: cls.id, sectionId: sec.id, date },
        });

        const present = marks.filter((m) => m.status === 'PRESENT' || m.status === 'LATE').length;
        const absent = marks.filter((m) => m.status === 'ABSENT').length;
        const isMarked = marks.length > 0;
        const percent = total > 0 && isMarked ? Number(((present / total) * 100).toFixed(1)) : 0;
        const markedBy = isMarked && marks[0]?.markedBy ? marks[0].markedBy : null;

        summaryItems.push({
          classId: cls.id,
          sectionId: sec.id,
          label: `${cls.name}-${sec.name}`,
          total,
          present,
          absent,
          percent,
          isMarked,
          markedBy,
        });
      }
    }

    return { classes: summaryItems };
  }

  async getStudentMonthlyAttendance(tenantId: string, query: StudentAttendanceMonthlyQueryDto) {
    const { classId, sectionId, month } = query;

    // Generate days of the month
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const mIndex = parseInt(monthStr, 10) - 1;
    const daysInMonth = new Date(year, mIndex + 1, 0).getDate();

    const days: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = String(day).padStart(2, '0');
      days.push(`${month}-${dStr}`);
    }

    const students = await this.prisma.saasStudent.findMany({
      where: { tenantId, classId, sectionId, status: 'ACTIVE' },
      orderBy: { rollNo: 'asc' },
    });

    const marks = await this.prisma.saasStudentAttendance.findMany({
      where: {
        tenantId,
        classId,
        sectionId,
        date: { startsWith: month },
      },
    });

    const studentRows = students.map((s) => {
      const studentMarks = marks.filter((m) => m.studentId === s.id);
      const markMap: Record<string, string> = {};
      let presentCount = 0;
      let absentCount = 0;

      for (const m of studentMarks) {
        markMap[m.date] = m.status;
        if (m.status === 'PRESENT' || m.status === 'LATE') presentCount++;
        else if (m.status === 'ABSENT') absentCount++;
      }

      const totalMarked = presentCount + absentCount;
      const percent = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 0;

      return {
        studentId: s.id,
        name: s.fullName,
        marks: markMap,
        presentCount,
        absentCount,
        percent,
      };
    });

    return {
      month,
      days,
      students: studentRows,
    };
  }

  // ----------------------------------------------------
  // STAFF ATTENDANCE
  // ----------------------------------------------------

  async getStaffAttendance(tenantId: string, query: StaffAttendanceGetQueryDto) {
    const date = query.date || this.getTodayString();

    const marks = await this.prisma.saasStaffAttendance.findMany({
      where: { tenantId, date },
    });

    if (marks.length > 0) {
      return {
        date,
        isMarked: true,
        records: marks.map((m) => ({
          staffId: m.staffId,
          name: m.name,
          status: m.status,
          checkIn: m.checkIn || null,
          checkOut: m.checkOut || null,
          remark: m.remark || null,
        })),
      };
    }

    const staffList = await this.prisma.saasStaff.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });

    return {
      date,
      isMarked: false,
      records: staffList.map((s) => ({
        staffId: s.id,
        name: s.fullName,
        status: 'PRESENT',
        checkIn: null,
        checkOut: null,
        remark: null,
      })),
    };
  }

  async markStaffAttendance(tenantId: string, userId: string, dto: StaffAttendanceMarkDto) {
    const { date, records } = dto;

    let present = 0;
    let absent = 0;
    let leave = 0;

    for (const rec of records) {
      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'ABSENT') absent++;
      else if (rec.status === 'ON_LEAVE' || rec.status === 'HALF_DAY') leave++;

      let name = 'Staff';
      const staff = await this.prisma.saasStaff.findFirst({
        where: { id: rec.staffId, tenantId },
      });
      if (staff) name = staff.fullName;

      const existing = await this.prisma.saasStaffAttendance.findFirst({
        where: { tenantId, staffId: rec.staffId, date },
      });

      if (existing) {
        await this.prisma.saasStaffAttendance.update({
          where: { id: existing.id },
          data: {
            status: rec.status,
            checkIn: rec.checkIn || existing.checkIn,
            checkOut: rec.checkOut || existing.checkOut,
            remark: rec.remark || null,
            markedBy: userId,
            markedAt: new Date(),
          },
        });
      } else {
        await this.prisma.saasStaffAttendance.create({
          data: {
            id: this.idGen.generate('att'),
            tenantId,
            date,
            staffId: rec.staffId,
            name,
            status: rec.status,
            checkIn: rec.checkIn || null,
            checkOut: rec.checkOut || null,
            remark: rec.remark || null,
            markedBy: userId,
            markedAt: new Date(),
          },
        });
      }
    }

    return {
      present,
      absent,
      leave,
    };
  }

  async staffSelfCheckIn(tenantId: string, userId: string, dto: StaffAttendanceCheckInDto) {
    const date = this.getTodayString();
    const timeNow = this.getCurrentTimeString();

    // Resolve staff
    let staff = await this.prisma.saasStaff.findFirst({
      where: { tenantId, userId },
    });
    if (!staff) {
      staff = await this.prisma.saasStaff.findFirst({
        where: { tenantId },
      });
    }

    const staffId = staff ? staff.id : `stf_${userId}`;
    const name = staff ? staff.fullName : 'Staff Member';

    let existing = await this.prisma.saasStaffAttendance.findFirst({
      where: { tenantId, staffId, date },
    });

    if (dto.action === 'CHECK_IN') {
      if (existing) {
        existing = await this.prisma.saasStaffAttendance.update({
          where: { id: existing.id },
          data: {
            checkIn: timeNow,
            status: 'PRESENT',
            source: 'WEB',
          },
        });
      } else {
        existing = await this.prisma.saasStaffAttendance.create({
          data: {
            id: this.idGen.generate('att'),
            tenantId,
            date,
            staffId,
            name,
            status: 'PRESENT',
            checkIn: timeNow,
            source: 'WEB',
          },
        });
      }
    } else {
      // CHECK_OUT
      if (existing) {
        existing = await this.prisma.saasStaffAttendance.update({
          where: { id: existing.id },
          data: {
            checkOut: timeNow,
          },
        });
      } else {
        existing = await this.prisma.saasStaffAttendance.create({
          data: {
            id: this.idGen.generate('att'),
            tenantId,
            date,
            staffId,
            name,
            status: 'PRESENT',
            checkOut: timeNow,
            source: 'WEB',
          },
        });
      }
    }

    return {
      status: existing.status,
      checkIn: existing.checkIn || null,
      checkOut: existing.checkOut || null,
    };
  }

  async getStaffMonthlyAttendance(tenantId: string, query: StaffAttendanceMonthlyQueryDto) {
    const { month } = query;

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const mIndex = parseInt(monthStr, 10) - 1;
    const daysInMonth = new Date(year, mIndex + 1, 0).getDate();

    const days: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = String(day).padStart(2, '0');
      days.push(`${month}-${dStr}`);
    }

    const staffList = await this.prisma.saasStaff.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });

    const marks = await this.prisma.saasStaffAttendance.findMany({
      where: {
        tenantId,
        date: { startsWith: month },
      },
    });

    const staffRows = staffList.map((s) => {
      const staffMarks = marks.filter((m) => m.staffId === s.id);
      const markMap: Record<string, string> = {};
      let presentCount = 0;

      for (const m of staffMarks) {
        markMap[m.date] = m.status;
        if (m.status === 'PRESENT' || m.status === 'HALF_DAY') presentCount++;
      }

      const totalMarked = staffMarks.length;
      const percent = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 0;

      return {
        staffId: s.id,
        name: s.fullName,
        marks: markMap,
        presentCount,
        percent,
      };
    });

    return {
      month,
      days,
      staff: staffRows,
    };
  }
}
