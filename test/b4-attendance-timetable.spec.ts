import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import { TimetableService, DEFAULT_PERIODS } from '../src/modules/timetable/timetable.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { DomainError } from '../src/common/domain.error';

describe('Phase B4: Attendance & Timetable Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b4_test';

  let mockStudents: any[] = [];
  let mockStaff: any[] = [];
  let mockClasses: any[] = [];
  let mockSections: any[] = [];
  let mockSubjects: any[] = [];
  let mockStudentAttendance: any[] = [];
  let mockStaffAttendance: any[] = [];
  let mockPeriods: any[] = [];
  let mockTimetableEntries: any[] = [];
  let mockSubstitutions: any[] = [];
  let mockCalendarEvents: any[] = [];

  const createMockPrisma = () => {
    return {
      saasStudent: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockStudents.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.classId && s.classId !== where.classId) return false;
            if (where.sectionId && s.sectionId !== where.sectionId) return false;
            if (where.status && s.status !== where.status) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStudents.find((s) => {
            if (where.id && s.id !== where.id) return false;
            if (where.tenantId && s.tenantId !== where.tenantId) return false;
            return true;
          });
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockStudents.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.classId && s.classId !== where.classId) return false;
            if (where.sectionId && s.sectionId !== where.sectionId) return false;
            if (where.status && s.status !== where.status) return false;
            return true;
          }).length;
        }),
      },
      saasStaff: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockStaff.filter((st) => {
            if (st.tenantId !== where.tenantId) return false;
            if (where.status && st.status !== where.status) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStaff.find((st) => {
            if (where.id && st.id !== where.id) return false;
            if (where.tenantId && st.tenantId !== where.tenantId) return false;
            if (where.userId && st.userId !== where.userId) return false;
            return true;
          });
        }),
      },
      schoolClass: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockClasses.filter((c) => c.tenantId === where.tenantId);
        }),
      },
      classSection: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockSections.filter((sec) => {
            if (sec.tenantId !== where.tenantId) return false;
            if (where.classId && sec.classId !== where.classId) return false;
            return true;
          });
        }),
      },
      schoolSubject: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSubjects.find((sub) => sub.id === where.id && sub.tenantId === where.tenantId);
        }),
      },
      calendarEvent: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockCalendarEvents.find((evt) => evt.tenantId === where.tenantId && evt.type === where.type);
        }),
      },
      saasStudentAttendance: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockStudentAttendance.filter((att) => {
            if (att.tenantId !== where.tenantId) return false;
            if (where.classId && att.classId !== where.classId) return false;
            if (where.sectionId && att.sectionId !== where.sectionId) return false;
            if (typeof where.date === 'string' && att.date !== where.date) return false;
            if (where.date && typeof where.date === 'object' && where.date.startsWith) {
              if (!att.date.startsWith(where.date.startsWith)) return false;
            }
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStudentAttendance.find((att) => {
            if (att.tenantId !== where.tenantId) return false;
            if (where.studentId && att.studentId !== where.studentId) return false;
            if (where.date && att.date !== where.date) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const rec = { ...data, createdAt: new Date(), updatedAt: new Date(), markedAt: new Date() };
          mockStudentAttendance.push(rec);
          return rec;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockStudentAttendance.findIndex((a) => a.id === where.id);
          if (idx !== -1) {
            mockStudentAttendance[idx] = { ...mockStudentAttendance[idx], ...data, updatedAt: new Date() };
            return mockStudentAttendance[idx];
          }
          return null;
        }),
      },
      saasStaffAttendance: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockStaffAttendance.filter((att) => {
            if (att.tenantId !== where.tenantId) return false;
            if (typeof where.date === 'string' && att.date !== where.date) return false;
            if (where.date && typeof where.date === 'object' && where.date.startsWith) {
              if (!att.date.startsWith(where.date.startsWith)) return false;
            }
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStaffAttendance.find((att) => {
            if (att.tenantId !== where.tenantId) return false;
            if (where.staffId && att.staffId !== where.staffId) return false;
            if (where.date && att.date !== where.date) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const rec = { ...data, createdAt: new Date(), updatedAt: new Date(), markedAt: new Date() };
          mockStaffAttendance.push(rec);
          return rec;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockStaffAttendance.findIndex((a) => a.id === where.id);
          if (idx !== -1) {
            mockStaffAttendance[idx] = { ...mockStaffAttendance[idx], ...data, updatedAt: new Date() };
            return mockStaffAttendance[idx];
          }
          return null;
        }),
      },
      saasPeriod: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockPeriods.filter((p) => p.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const rec = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockPeriods.push(rec);
          return rec;
        }),
        deleteMany: vi.fn(async ({ where }: any) => {
          mockPeriods = mockPeriods.filter((p) => p.tenantId !== where.tenantId);
        }),
      },
      saasTimetableEntry: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockTimetableEntries.filter((e) => {
            if (e.tenantId !== where.tenantId) return false;
            if (where.classId && e.classId !== where.classId) return false;
            if (where.sectionId && e.sectionId !== where.sectionId) return false;
            if (where.teacherId && e.teacherId !== where.teacherId) return false;
            if (where.dayOfWeek && e.dayOfWeek !== where.dayOfWeek) return false;
            if (where.periodId && e.periodId !== where.periodId) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockTimetableEntries.find((e) => {
            if (where.id && e.id !== where.id) return false;
            if (where.tenantId && e.tenantId !== where.tenantId) return false;
            if (where.teacherId && e.teacherId !== where.teacherId) return false;
            if (where.dayOfWeek && e.dayOfWeek !== where.dayOfWeek) return false;
            if (where.periodId && e.periodId !== where.periodId) return false;
            if (where.NOT) {
              const notMatch = where.NOT.AND.every((cond: any) => {
                if (cond.classId && e.classId !== cond.classId) return false;
                if (cond.sectionId && e.sectionId !== cond.sectionId) return false;
                return true;
              });
              if (notMatch) return false;
            }
            if (where.classId && e.classId !== where.classId) return false;
            if (where.sectionId && e.sectionId !== where.sectionId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const rec = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockTimetableEntries.push(rec);
          return rec;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTimetableEntries.findIndex((e) => e.id === where.id);
          if (idx !== -1) {
            mockTimetableEntries[idx] = { ...mockTimetableEntries[idx], ...data, updatedAt: new Date() };
            return mockTimetableEntries[idx];
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          const idx = mockTimetableEntries.findIndex((e) => e.id === where.id);
          if (idx !== -1) {
            mockTimetableEntries.splice(idx, 1);
          }
        }),
      },
      saasTimetableSubstitution: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockSubstitutions.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.date && s.date !== where.date) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSubstitutions.find((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.substituteTeacherId && s.substituteTeacherId !== where.substituteTeacherId) return false;
            if (where.date && s.date !== where.date) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const rec = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockSubstitutions.push(rec);
          return rec;
        }),
      },
    };
  };

  let mockPrisma: any;
  let attendanceService: AttendanceService;
  let timetableService: TimetableService;

  beforeEach(() => {
    mockStudents = [
      { id: 'stu_01', tenantId, classId: 'cls_1', sectionId: 'sec_1', fullName: 'Aarav Sharma', rollNo: '101', status: 'ACTIVE' },
      { id: 'stu_02', tenantId, classId: 'cls_1', sectionId: 'sec_1', fullName: 'Priya Patel', rollNo: '102', status: 'ACTIVE' },
    ];
    mockStaff = [
      { id: 'stf_01', tenantId, userId: 'usr_t1', fullName: 'Anita Verma', status: 'ACTIVE' },
      { id: 'stf_02', tenantId, userId: 'usr_t2', fullName: 'Ravi Kumar', status: 'ACTIVE' },
    ];
    mockClasses = [{ id: 'cls_1', tenantId, name: 'Grade 10', displayOrder: 1 }];
    mockSections = [{ id: 'sec_1', tenantId, classId: 'cls_1', name: 'A', capacity: 40 }];
    mockSubjects = [{ id: 'sbj_math', tenantId, name: 'Mathematics', code: 'MATH' }];
    mockStudentAttendance = [];
    mockStaffAttendance = [];
    mockPeriods = [];
    mockTimetableEntries = [];
    mockSubstitutions = [];
    mockCalendarEvents = [];

    mockPrisma = createMockPrisma();
    attendanceService = new AttendanceService(mockPrisma as any, clock, idGen);
    timetableService = new TimetableService(mockPrisma as any, clock, idGen);
  });

  describe('AttendanceService', () => {
    it('returns default roster when attendance is not yet marked', async () => {
      const roster = await attendanceService.getStudentAttendance(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        date: '2026-11-12',
      });

      expect(roster.isMarked).toBe(false);
      expect(roster.records.length).toBe(2);
      expect(roster.records[0].status).toBe('PRESENT');
    });

    it('marks class attendance and reports counts', async () => {
      const result = await attendanceService.markStudentAttendance(tenantId, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        date: '2026-11-12',
        records: [
          { studentId: 'stu_01', status: 'PRESENT', remark: null },
          { studentId: 'stu_02', status: 'ABSENT', remark: 'Fever' },
        ],
        notifyParentsOfAbsent: true,
      });

      expect(result.present).toBe(1);
      expect(result.absent).toBe(1);
      expect(result.notified).toBe(1);

      // Verify that getStudentAttendance now reports isMarked = true
      const roster = await attendanceService.getStudentAttendance(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        date: '2026-11-12',
      });
      expect(roster.isMarked).toBe(true);
      expect(roster.records.find((r) => r.studentId === 'stu_02')?.status).toBe('ABSENT');
    });

    it('generates attendance summary across classes', async () => {
      await attendanceService.markStudentAttendance(tenantId, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        date: '2026-11-12',
        records: [
          { studentId: 'stu_01', status: 'PRESENT', remark: null },
          { studentId: 'stu_02', status: 'PRESENT', remark: null },
        ],
      });

      const summary = await attendanceService.getStudentAttendanceSummary(tenantId, { date: '2026-11-12' });
      expect(summary.classes.length).toBe(1);
      expect(summary.classes[0].total).toBe(2);
      expect(summary.classes[0].present).toBe(2);
      expect(summary.classes[0].percent).toBe(100);
      expect(summary.classes[0].isMarked).toBe(true);
    });

    it('provides monthly student attendance grid', async () => {
      await attendanceService.markStudentAttendance(tenantId, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        date: '2026-11-02',
        records: [{ studentId: 'stu_01', status: 'PRESENT', remark: null }],
      });

      const monthly = await attendanceService.getStudentMonthlyAttendance(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        month: '2026-11',
      });

      expect(monthly.month).toBe('2026-11');
      expect(monthly.days.length).toBe(30);
      expect(monthly.students.length).toBe(2);
      const s1 = monthly.students.find((s) => s.studentId === 'stu_01');
      expect(s1?.marks['2026-11-02']).toBe('PRESENT');
      expect(s1?.presentCount).toBe(1);
    });

    it('handles staff attendance marking and self check-in / check-out', async () => {
      const markResult = await attendanceService.markStaffAttendance(tenantId, 'usr_admin', {
        date: '2026-11-12',
        records: [
          { staffId: 'stf_01', status: 'PRESENT', checkIn: '08:30', checkOut: null, remark: null },
          { staffId: 'stf_02', status: 'ON_LEAVE', checkIn: null, checkOut: null, remark: 'Sick' },
        ],
      });

      expect(markResult.present).toBe(1);
      expect(markResult.leave).toBe(1);

      // Staff self check-in
      const checkInResult = await attendanceService.staffSelfCheckIn(tenantId, 'usr_t1', {
        action: 'CHECK_IN',
      });
      expect(checkInResult.status).toBe('PRESENT');
      expect(checkInResult.checkIn).toBeDefined();

      // Staff self check-out
      const checkOutResult = await attendanceService.staffSelfCheckIn(tenantId, 'usr_t1', {
        action: 'CHECK_OUT',
      });
      expect(checkOutResult.checkOut).toBeDefined();
    });
  });

  describe('TimetableService', () => {
    it('returns default periods if none configured and replaces bell schedule', async () => {
      const periods = await timetableService.getPeriods(tenantId);
      expect(periods.items.length).toBe(DEFAULT_PERIODS.length);
      expect(periods.workingDays).toEqual([1, 2, 3, 4, 5, 6]);

      const replaced = await timetableService.replacePeriods(tenantId, {
        workingDays: [1, 2, 3, 4, 5],
        periods: [
          { id: 'per_01', name: 'Period 1', startTime: '09:00', endTime: '10:00', isBreak: false, order: 1 },
          { id: 'per_02', name: 'Period 2', startTime: '10:00', endTime: '11:00', isBreak: false, order: 2 },
        ],
      });

      expect(replaced.items.length).toBe(2);
      expect(mockPeriods.length).toBe(2);
    });

    it('upserts timetable entry and prevents teacher double-booking', async () => {
      const entry = await timetableService.upsertEntry(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        dayOfWeek: 1,
        periodId: 'per_01',
        subjectId: 'sbj_math',
        teacherId: 'stf_01',
        room: 'Room-101',
      });

      expect(entry).toBeDefined();
      expect(entry.subjectName).toBe('Mathematics');
      expect(entry.teacherName).toBe('Anita Verma');

      // Attempt assigning same teacher to a different class/section at the same day & period
      await expect(
        timetableService.upsertEntry(tenantId, {
          classId: 'cls_2',
          sectionId: 'sec_2',
          dayOfWeek: 1,
          periodId: 'per_01',
          subjectId: 'sbj_math',
          teacherId: 'stf_01',
          room: 'Room-202',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('retrieves class timetable and teacher timetable', async () => {
      await timetableService.upsertEntry(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        dayOfWeek: 1,
        periodId: 'per_01',
        subjectId: 'sbj_math',
        teacherId: 'stf_01',
        room: 'Room-101',
      });

      const classTt = await timetableService.getTimetableByClass(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
      });
      expect(classTt.entries.length).toBe(1);

      const teacherTt = await timetableService.getTimetableByTeacher(tenantId, 'usr_t1', {
        staffId: 'stf_01',
      });
      expect(teacherTt.entries.length).toBe(1);
    });

    it('assigns substitute teacher and identifies free teachers', async () => {
      const entry = await timetableService.upsertEntry(tenantId, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        dayOfWeek: 5, // Friday
        periodId: 'per_01',
        subjectId: 'sbj_math',
        teacherId: 'stf_01',
      });

      // Find free teachers on Friday period 1
      const free = await timetableService.getFreeTeachers(tenantId, {
        dayOfWeek: 5,
        periodId: 'per_01',
      });
      // stf_01 is busy; stf_02 should be free
      expect(free.items.find((t) => t.staffId === 'stf_02')).toBeDefined();
      expect(free.items.find((t) => t.staffId === 'stf_01')).toBeUndefined();

      // Assign substitute (2026-11-13 is Friday)
      const sub = await timetableService.assignSubstitute(tenantId, {
        date: '2026-11-13',
        entryId: entry.id,
        substituteTeacherId: 'stf_02',
        reason: 'Regular teacher on casual leave',
      });

      expect(sub.id).toBeDefined();
      expect(sub.substituteTeacherId).toBe('stf_02');
    });
  });
});
