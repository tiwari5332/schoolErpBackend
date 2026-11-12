import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AcademicService, DEFAULT_GRADE_SCALES } from '../src/modules/academic/academic.service';
import { CalendarService } from '../src/modules/calendar/calendar.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { DomainError } from '../src/common/domain.error';

describe('Phase B2: Academic Setup & Calendar Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b2_test';

  let mockSessions: any[] = [];
  let mockClasses: any[] = [];
  let mockSections: any[] = [];
  let mockSubjects: any[] = [];
  let mockGradeScales: any[] = [];
  let mockCalendarEvents: any[] = [];

  const createMockPrisma = () => {
    return {
      saasAcademicSession: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockSessions.filter((s) => s.tenantId === where.tenantId);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSessions.find((s) => {
            if (where.id && s.id !== where.id) return false;
            if (where.tenantId && s.tenantId !== where.tenantId) return false;
            if (where.name && s.name !== where.name) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const s = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockSessions.push(s);
          return s;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockSessions.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockSessions[idx] = { ...mockSessions[idx], ...data, updatedAt: new Date() };
            return mockSessions[idx];
          }
          return null;
        }),
        updateMany: vi.fn(async ({ where, data }: any) => {
          for (const s of mockSessions) {
            if (s.tenantId === where.tenantId) {
              Object.assign(s, data);
            }
          }
        }),
      },
      schoolClass: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockClasses.filter((c) => c.tenantId === where.tenantId).map((c) => ({
            ...c,
            sections: mockSections.filter((sec) => sec.classId === c.id),
          }));
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          const c = mockClasses.find((cls) => cls.id === where.id && cls.tenantId === where.tenantId);
          if (c) {
            return {
              ...c,
              sections: mockSections.filter((sec) => sec.classId === c.id),
            };
          }
          return null;
        }),
        count: vi.fn(async () => mockClasses.length),
        create: vi.fn(async ({ data }: any) => {
          const { sections, ...classData } = data;
          const cls = { ...classData, createdAt: new Date(), updatedAt: new Date() };
          mockClasses.push(cls);
          if (sections?.create) {
            for (const sec of sections.create) {
              mockSections.push({ ...sec, classId: cls.id });
            }
          }
          return {
            ...cls,
            sections: mockSections.filter((s) => s.classId === cls.id),
          };
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockClasses.findIndex((c) => c.id === where.id);
          if (idx !== -1) {
            const { sections, ...classData } = data;
            mockClasses[idx] = { ...mockClasses[idx], ...classData, updatedAt: new Date() };
            if (sections?.create) {
              for (const sec of sections.create) {
                mockSections.push({ ...sec, classId: where.id });
              }
            }
            return {
              ...mockClasses[idx],
              sections: mockSections.filter((s) => s.classId === where.id),
            };
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          mockClasses = mockClasses.filter((c) => c.id !== where.id);
          mockSections = mockSections.filter((s) => s.classId !== where.id);
        }),
      },
      classSection: {
        deleteMany: vi.fn(async ({ where }: any) => {
          mockSections = mockSections.filter((s) => s.classId !== where.classId);
        }),
      },
      schoolSubject: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockSubjects.filter((s) => s.tenantId === where.tenantId);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSubjects.find((s) => {
            if (where.id && s.id !== where.id) return false;
            if (where.tenantId && s.tenantId !== where.tenantId) return false;
            if (where.code && s.code !== where.code) return false;
            return true;
          });
        }),
        count: vi.fn(async () => mockSubjects.length),
        create: vi.fn(async ({ data }: any) => {
          const sbj = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockSubjects.push(sbj);
          return sbj;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockSubjects.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockSubjects[idx] = { ...mockSubjects[idx], ...data, updatedAt: new Date() };
            return mockSubjects[idx];
          }
          return null;
        }),
      },
      gradeScale: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockGradeScales.filter((g) => g.tenantId === where.tenantId);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockGradeScales.find((g) => g.id === where.id && g.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const gs = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockGradeScales.push(gs);
          return gs;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockGradeScales.findIndex((g) => g.id === where.id);
          if (idx !== -1) {
            mockGradeScales[idx] = { ...mockGradeScales[idx], ...data, updatedAt: new Date() };
            return mockGradeScales[idx];
          }
          return null;
        }),
      },
      calendarEvent: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockCalendarEvents.filter((e) => {
            if (e.tenantId !== where.tenantId) return false;
            if (where.endDate?.gte && e.endDate < where.endDate.gte) return false;
            if (where.startDate?.lte && e.startDate > where.startDate.lte) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockCalendarEvents.find((e) => e.id === where.id && e.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const evt = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockCalendarEvents.push(evt);
          return evt;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockCalendarEvents.findIndex((e) => e.id === where.id);
          if (idx !== -1) {
            mockCalendarEvents[idx] = { ...mockCalendarEvents[idx], ...data, updatedAt: new Date() };
            return mockCalendarEvents[idx];
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          mockCalendarEvents = mockCalendarEvents.filter((e) => e.id !== where.id);
        }),
      },
      $transaction: vi.fn(async (cb: any) => cb(createMockPrisma())),
    } as any;
  };

  beforeEach(() => {
    mockSessions = [];
    mockClasses = [];
    mockSections = [];
    mockSubjects = [];
    mockGradeScales = [];
    mockCalendarEvents = [];
  });

  describe('Academic Sessions Management', () => {
    it('should list sessions or seed initial active session', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const res = await academicService.getSessions(tenantId);
      expect(res.items.length).toBe(1);
      expect(res.items[0].isActive).toBe(true);
      expect(res.items[0].isLocked).toBe(false);
    });

    it('should create new upcoming session and validate date ranges', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      // Invalid date range (endDate < startDate)
      await expect(
        academicService.createSession(tenantId, {
          name: '2027-28',
          startDate: '2028-03-31',
          endDate: '2027-04-01',
        }),
      ).rejects.toThrow('endDate must be after startDate');

      const created = await academicService.createSession(tenantId, {
        name: '2027-28',
        startDate: '2027-04-01',
        endDate: '2028-03-31',
      });

      expect(created.name).toBe('2027-28');
      expect(created.isActive).toBe(false);

      // Duplicate name check
      await expect(
        academicService.createSession(tenantId, {
          name: '2027-28',
          startDate: '2027-04-01',
          endDate: '2028-03-31',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('should activate target session and deactivate previous sessions atomically', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const s1 = await academicService.createSession(tenantId, { name: '2026-27', startDate: '2026-04-01', endDate: '2027-03-31' });
      const s2 = await academicService.createSession(tenantId, { name: '2027-28', startDate: '2027-04-01', endDate: '2028-03-31' });

      // Initially both false
      await academicService.activateSession(tenantId, s1.id);
      expect(mockSessions.find((s) => s.id === s1.id).isActive).toBe(true);

      // Now activate s2
      await academicService.activateSession(tenantId, s2.id);
      expect(mockSessions.find((s) => s.id === s1.id).isActive).toBe(false);
      expect(mockSessions.find((s) => s.id === s2.id).isActive).toBe(true);
    });

    it('should lock academic session', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const s = await academicService.createSession(tenantId, { name: '2025-26', startDate: '2025-04-01', endDate: '2026-03-31' });
      const locked = await academicService.lockSession(tenantId, s.id);
      expect(locked.isLocked).toBe(true);
    });
  });

  describe('Classes & Sections Administration', () => {
    it('should create class with sections and list them in display order', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const cls = await academicService.createClass(tenantId, {
        name: 'Class 5',
        displayOrder: 5,
        sections: [
          { name: 'A', capacity: 40, classTeacherId: null },
          { name: 'B', capacity: 40, classTeacherId: null },
        ],
      });

      expect(cls.name).toBe('Class 5');
      expect(cls.sections.length).toBe(2);
      expect(cls.sections[0].name).toBe('A');
      expect(cls.sections[1].name).toBe('B');

      const list = await academicService.getClasses(tenantId);
      expect(list.items.length).toBe(1);
    });

    it('should update class details and assign subject mappings', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const cls = await academicService.createClass(tenantId, {
        name: 'Class 6',
        displayOrder: 6,
        sections: [{ name: 'A', capacity: 40 }],
      });

      // Assign subjects
      const assigned = await academicService.assignClassSubjects(tenantId, cls.id, {
        subjectIds: ['sbj_math', 'sbj_sci', 'sbj_eng'],
      });

      expect(assigned.subjectIds).toEqual(['sbj_math', 'sbj_sci', 'sbj_eng']);

      // Update class
      const updated = await academicService.updateClass(tenantId, cls.id, {
        name: 'Class 6 - Middle School',
      });

      expect(updated.name).toBe('Class 6 - Middle School');
    });

    it('should delete class', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const cls = await academicService.createClass(tenantId, {
        name: 'Class 10',
        displayOrder: 10,
        sections: [{ name: 'A', capacity: 45 }],
      });

      await academicService.deleteClass(tenantId, cls.id);
      const list = await academicService.getClasses(tenantId);
      expect(list.items.length).toBe(0);
    });
  });

  describe('Subjects Management', () => {
    it('should create and update theory / practical subjects', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const sbj = await academicService.createSubject(tenantId, {
        name: 'Computer Science',
        code: 'CS',
        type: 'BOTH',
        isElective: false,
      });

      expect(sbj.name).toBe('Computer Science');
      expect(sbj.code).toBe('CS');
      expect(sbj.type).toBe('BOTH');

      // Duplicate code error
      await expect(
        academicService.createSubject(tenantId, {
          name: 'Computer Systems',
          code: 'CS',
        }),
      ).rejects.toThrow('already exists');

      // Update
      const updated = await academicService.updateSubject(tenantId, sbj.id, {
        name: 'Computer Science & AI',
        isElective: true,
      });

      expect(updated.name).toBe('Computer Science & AI');
      expect(updated.isElective).toBe(true);
    });
  });

  describe('Grade Scales Management', () => {
    it('should return default CBSE 9-point scale or upsert custom scale bands', async () => {
      const mockPrisma = createMockPrisma();
      const academicService = new AcademicService(mockPrisma, idGen);

      const scales = await academicService.getGradeScales(tenantId);
      expect(scales.items.length).toBe(1);
      expect(scales.items[0].name).toBe('CBSE 9-point');

      // Upsert
      const custom = await academicService.upsertGradeScale(tenantId, 'grs_custom_01', {
        name: 'ICSE 5-point',
        bands: [
          { grade: 'A', minPercent: 90, maxPercent: 100, gradePoint: 5 },
          { grade: 'B', minPercent: 75, maxPercent: 89.99, gradePoint: 4 },
        ],
      });

      expect(custom.id).toBe('grs_custom_01');
      expect(custom.name).toBe('ICSE 5-point');
      expect(custom.bands.length).toBe(2);
    });
  });

  describe('Calendar & Events Engine', () => {
    it('should create calendar events with validation and query upcoming events', async () => {
      const mockPrisma = createMockPrisma();
      const calendarService = new CalendarService(mockPrisma, clock, idGen);

      // Invalid date range
      await expect(
        calendarService.createEvent(tenantId, {
          title: 'Sports Day',
          startDate: '2026-11-20',
          endDate: '2026-11-19',
        }),
      ).rejects.toThrow('endDate cannot be before startDate');

      // Valid Event
      const evt = await calendarService.createEvent(tenantId, {
        title: 'Sports Day',
        type: 'EVENT',
        startDate: '2026-11-20',
        endDate: '2026-11-20',
        allDay: true,
        audience: 'ALL',
        isHoliday: false,
      });

      expect(evt.title).toBe('Sports Day');
      expect(evt.isHoliday).toBe(false);

      // Create Holiday
      await calendarService.createEvent(tenantId, {
        title: 'Guru Nanak Jayanti',
        type: 'HOLIDAY',
        startDate: '2026-11-25',
        endDate: '2026-11-25',
        allDay: true,
        isHoliday: true,
      });

      // Query upcoming
      const upcoming = await calendarService.getUpcoming(tenantId, { days: 30 });
      expect(upcoming.items.length).toBe(2);

      // Update event
      const updated = await calendarService.updateEvent(tenantId, evt.id, {
        title: 'Annual Sports Meet 2026',
        color: '#10B981',
      });
      expect(updated.title).toBe('Annual Sports Meet 2026');
      expect(updated.color).toBe('#10B981');

      // Delete event
      await calendarService.deleteEvent(tenantId, evt.id);
      expect(mockCalendarEvents.length).toBe(1);
    });
  });
});

