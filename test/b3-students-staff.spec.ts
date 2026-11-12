import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentsService } from '../src/modules/students/students.service';
import { StaffService } from '../src/modules/staff/staff.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { DomainError } from '../src/common/domain.error';

describe('Phase B3: Students & Staff Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b3_test';

  let mockStudents: any[] = [];
  let mockStaff: any[] = [];
  let mockLeaves: any[] = [];
  let mockUsers: any[] = [];
  let mockSubscriptions: any[] = [];
  let mockClasses: any[] = [];
  let mockSections: any[] = [];

  const createMockPrisma = () => {
    return {
      saasStudent: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockStudents
            .filter((s) => {
              if (s.tenantId !== where.tenantId) return false;
              if (where.classId && s.classId !== where.classId) return false;
              if (where.sectionId && s.sectionId !== where.sectionId) return false;
              if (where.status && s.status !== where.status) return false;
              return true;
            })
            .slice(skip, skip + take);
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
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStudents.find((s) => {
            if (where.id && s.id !== where.id) return false;
            if (where.tenantId && s.tenantId !== where.tenantId) return false;
            if (where.admissionNo && s.admissionNo !== where.admissionNo) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const s = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockStudents.push(s);
          return s;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockStudents.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockStudents[idx] = { ...mockStudents[idx], ...data, updatedAt: new Date() };
            return mockStudents[idx];
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          const idx = mockStudents.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockStudents.splice(idx, 1);
          }
        }),
      },
      saasStaff: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockStaff
            .filter((st) => {
              if (st.tenantId !== where.tenantId) return false;
              if (where.department && st.department !== where.department) return false;
              if (where.status && st.status !== where.status) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockStaff.filter((st) => {
            if (st.tenantId !== where.tenantId) return false;
            if (where.department && st.department !== where.department) return false;
            if (where.status && st.status !== where.status) return false;
            return true;
          }).length;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStaff.find((st) => {
            if (where.id && st.id !== where.id) return false;
            if (where.tenantId && st.tenantId !== where.tenantId) return false;
            if (where.employeeCode && st.employeeCode !== where.employeeCode) return false;
            if (where.userId && st.userId !== where.userId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const st = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockStaff.push(st);
          return st;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockStaff.findIndex((st) => st.id === where.id);
          if (idx !== -1) {
            mockStaff[idx] = { ...mockStaff[idx], ...data, updatedAt: new Date() };
            return mockStaff[idx];
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          const idx = mockStaff.findIndex((st) => st.id === where.id);
          if (idx !== -1) {
            mockStaff.splice(idx, 1);
          }
        }),
      },
      saasLeave: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockLeaves
            .filter((l) => {
              if (l.tenantId !== where.tenantId) return false;
              if (where.status && l.status !== where.status) return false;
              if (where.staffId && l.staffId !== where.staffId) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockLeaves.filter((l) => {
            if (l.tenantId !== where.tenantId) return false;
            if (where.status && l.status !== where.status) return false;
            if (where.staffId && l.staffId !== where.staffId) return false;
            return true;
          }).length;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockLeaves.find((l) => {
            if (where.id && l.id !== where.id) return false;
            if (where.tenantId && l.tenantId !== where.tenantId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const l = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockLeaves.push(l);
          return l;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockLeaves.findIndex((l) => l.id === where.id);
          if (idx !== -1) {
            mockLeaves[idx] = { ...mockLeaves[idx], ...data, updatedAt: new Date() };
            return mockLeaves[idx];
          }
          return null;
        }),
      },
      subscription: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSubscriptions.find((sub) => sub.tenantId === where.tenantId);
        }),
      },
      schoolClass: {
        findFirst: vi.fn(async ({ where }: any) => {
          const c = mockClasses.find((cls) => cls.id === where.id && cls.tenantId === where.tenantId);
          if (!c) return null;
          return {
            ...c,
            sections: mockSections.filter((s) => s.classId === c.id),
          };
        }),
      },
      classSection: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSections.find((s) => s.id === where.id && s.tenantId === where.tenantId);
        }),
      },
      user: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockUsers.find((u) => u.email === where.email && u.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const u = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockUsers.push(u);
          return u;
        }),
      },
    };
  };

  let mockPrisma: any;
  let studentsService: StudentsService;
  let staffService: StaffService;

  beforeEach(() => {
    mockStudents = [];
    mockStaff = [];
    mockLeaves = [];
    mockUsers = [];
    mockSubscriptions = [];
    mockClasses = [
      { id: 'cls_1', tenantId, name: 'Grade 10', numericOrder: 10 },
      { id: 'cls_2', tenantId, name: 'Grade 11', numericOrder: 11 },
    ];
    mockSections = [
      { id: 'sec_1', tenantId, classId: 'cls_1', name: 'A', capacity: 40 },
      { id: 'sec_2', tenantId, classId: 'cls_2', name: 'A', capacity: 40 },
    ];

    mockPrisma = createMockPrisma();
    studentsService = new StudentsService(mockPrisma as any, clock, idGen);
    staffService = new StaffService(mockPrisma as any, clock, idGen);
  });

  describe('StudentsService', () => {
    it('creates a new student and verifies admission uniqueness', async () => {
      const student = await studentsService.createStudent(tenantId, {
        admissionNo: 'ADM-2026-001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: '2012-05-15',
        classId: 'cls_1',
        sectionId: 'sec_1',
        admissionDate: '2026-04-01',
        rollNo: '101',
        guardians: [
          {
            name: 'Rajesh Sharma',
            relation: 'FATHER',
            phone: '9876543210',
            isPrimary: true,
          },
        ],
      });

      expect(student).toBeDefined();
      expect(student.admissionNo).toBe('ADM-2026-001');
      expect(student.fullName).toBe('Aarav Sharma');
      expect(student.status).toBe('ACTIVE');

      // Attempt duplicate admission number
      await expect(
        studentsService.createStudent(tenantId, {
          admissionNo: 'ADM-2026-001',
          firstName: 'Another',
          lastName: 'Student',
          gender: 'FEMALE',
          dob: '2012-06-15',
          classId: 'cls_1',
          sectionId: 'sec_1',
          admissionDate: '2026-04-01',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('enforces plan student limits', async () => {
      mockSubscriptions.push({
        tenantId,
        limits: { students: 1, staff: 10 },
      });

      await studentsService.createStudent(tenantId, {
        admissionNo: 'ADM-001',
        firstName: 'First',
        lastName: 'Student',
        gender: 'MALE',
        dob: '2012-01-01',
        classId: 'cls_1',
        sectionId: 'sec_1',
        admissionDate: '2026-04-01',
      });

      // Next student should exceed limit
      await expect(
        studentsService.createStudent(tenantId, {
          admissionNo: 'ADM-002',
          firstName: 'Second',
          lastName: 'Student',
          gender: 'FEMALE',
          dob: '2012-02-02',
          classId: 'cls_1',
          sectionId: 'sec_1',
          admissionDate: '2026-04-01',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('retrieves paginated student list and student by ID', async () => {
      const created = await studentsService.createStudent(tenantId, {
        admissionNo: 'ADM-010',
        firstName: 'Priya',
        lastName: 'Patel',
        gender: 'FEMALE',
        dob: '2011-08-20',
        classId: 'cls_1',
        sectionId: 'sec_1',
        admissionDate: '2026-04-01',
      });

      const list = await studentsService.getStudents(tenantId, { page: 1, pageSize: 10 });
      expect(list.items.length).toBe(1);
      expect(list.meta.total).toBe(1);

      const profile = await studentsService.getStudentById(tenantId, created.id);
      expect(profile.student.fullName).toBe('Priya Patel');
      expect(profile.attendanceSummary).toBeDefined();
    });

    it('updates student details and status', async () => {
      const created = await studentsService.createStudent(tenantId, {
        admissionNo: 'ADM-020',
        firstName: 'Rohan',
        lastName: 'Gupta',
        gender: 'MALE',
        dob: '2011-10-10',
        classId: 'cls_1',
        sectionId: 'sec_1',
        admissionDate: '2026-04-01',
      });

      const updated = await studentsService.updateStudent(tenantId, created.id, {
        firstName: 'Rohan',
        lastName: 'Verma',
        rollNo: '105',
      });
      expect(updated.fullName).toBe('Rohan Verma');
      expect(updated.rollNo).toBe('105');

      const statusUpdated = await studentsService.updateStatus(tenantId, created.id, {
        status: 'INACTIVE',
      });
      expect(statusUpdated.status).toBe('INACTIVE');
    });

    it('prevents TC generation when pending fee dues exist', async () => {
      const student = await studentsService.createStudent(tenantId, {
        admissionNo: 'ADM-030',
        firstName: 'Dev',
        lastName: 'Kumar',
        gender: 'MALE',
        dob: '2010-03-12',
        classId: 'cls_1',
        sectionId: 'sec_1',
        admissionDate: '2026-04-01',
      });

      // Simulate outstanding fee dues
      const idx = mockStudents.findIndex((s) => s.id === student.id);
      mockStudents[idx].feeDue = 2500;

      await expect(
        studentsService.generateTc(tenantId, student.id, {
          reason: 'Family relocated',
          leavingDate: '2026-05-01',
        }),
      ).rejects.toThrow(DomainError);

      // Clear fee dues and generate TC
      mockStudents[idx].feeDue = 0;
      const tc = await studentsService.generateTc(tenantId, student.id, {
        reason: 'Family relocated',
        leavingDate: '2026-05-01',
      });
      expect(tc.tcNumber).toBeDefined();
      expect(mockStudents[idx].status).toBe('TRANSFERRED');
    });

    it('supports batch promotion and generates next admission number', async () => {
      const s1 = await studentsService.createStudent(tenantId, {
        admissionNo: 'ADM-001',
        firstName: 'Student',
        lastName: 'One',
        gender: 'MALE',
        dob: '2012-01-01',
        classId: 'cls_1',
        sectionId: 'sec_1',
        admissionDate: '2026-04-01',
      });

      const promotionResult = await studentsService.promoteStudents(tenantId, {
        fromSessionId: 'ses_2025',
        toSessionId: 'ses_2026',
        fromClassId: 'cls_1',
        fromSectionId: 'sec_1',
        toClassId: 'cls_2',
        toSectionId: 'sec_2',
        studentIds: [s1.id],
        action: 'PROMOTE',
      });
      expect(promotionResult.succeeded).toBe(1);

      const nextAdm = await studentsService.getNextAdmissionNo(tenantId);
      expect(nextAdm.admissionNo).toBeDefined();
      expect(typeof nextAdm.admissionNo).toBe('string');
    });
  });

  describe('StaffService', () => {
    it('creates staff member and optionally provisions login user', async () => {
      const staff = await staffService.createStaff(tenantId, {
        employeeCode: 'EMP-101',
        firstName: 'Amit',
        lastName: 'Saxena',
        gender: 'MALE',
        dob: '1985-07-22',
        email: 'amit.saxena@school.edu',
        phone: '9811223344',
        designation: 'Senior Teacher',
        department: 'Science',
        joiningDate: '2020-06-01',
        roleId: 'rol_teacher',
        createLogin: true,
      });

      expect(staff).toBeDefined();
      expect(staff.employeeCode).toBe('EMP-101');
      expect(staff.fullName).toBe('Amit Saxena');
      expect(staff.userId).toBeDefined();
      expect(mockUsers.length).toBe(1);
      expect(mockUsers[0].email).toBe('amit.saxena@school.edu');

      // Duplicate employeeCode rejection
      await expect(
        staffService.createStaff(tenantId, {
          employeeCode: 'EMP-101',
          firstName: 'Another',
          lastName: 'Staff',
          gender: 'FEMALE',
          dob: '1990-01-01',
          phone: '9811223399',
          designation: 'Lab Assistant',
          department: 'Science',
          joiningDate: '2022-01-01',
          roleId: 'rol_teacher',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('enforces plan staff limits', async () => {
      mockSubscriptions.push({
        tenantId,
        limits: { staff: 1 },
      });

      await staffService.createStaff(tenantId, {
        employeeCode: 'EMP-001',
        firstName: 'Staff',
        lastName: 'One',
        gender: 'MALE',
        dob: '1988-02-14',
        phone: '9876500001',
        designation: 'Math Teacher',
        department: 'Mathematics',
        joiningDate: '2021-04-01',
        roleId: 'rol_teacher',
      });

      // Second staff creation should fail
      await expect(
        staffService.createStaff(tenantId, {
          employeeCode: 'EMP-002',
          firstName: 'Staff',
          lastName: 'Two',
          gender: 'FEMALE',
          dob: '1989-05-15',
          phone: '9876500002',
          designation: 'English Teacher',
          department: 'Languages',
          joiningDate: '2021-04-01',
          roleId: 'rol_teacher',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('retrieves staff list and staff profile with attendance and leave balances', async () => {
      const created = await staffService.createStaff(tenantId, {
        employeeCode: 'EMP-005',
        firstName: 'Kavita',
        lastName: 'Nair',
        gender: 'FEMALE',
        dob: '1992-09-18',
        phone: '9876500005',
        designation: 'Music Teacher',
        department: 'Arts',
        joiningDate: '2022-07-01',
        roleId: 'rol_teacher',
      });

      const list = await staffService.getStaff(tenantId, { page: 1, pageSize: 10 });
      expect(list.items.length).toBe(1);

      const profile = await staffService.getStaffById(tenantId, created.id);
      expect(profile.staff.fullName).toBe('Kavita Nair');
      expect(profile.attendanceSummary.present).toBe(20);
      expect(profile.leaveBalance.length).toBeGreaterThan(0);
    });

    it('handles leave workflow: apply, list, decide, and cancel', async () => {
      const staff = await staffService.createStaff(tenantId, {
        employeeCode: 'EMP-010',
        firstName: 'Sunil',
        lastName: 'Yadav',
        gender: 'MALE',
        dob: '1986-11-25',
        phone: '9876500010',
        designation: 'Sports Teacher',
        department: 'Physical Education',
        joiningDate: '2019-01-15',
        roleId: 'rol_teacher',
      });

      // Apply leave
      const leave = await staffService.applyLeave(tenantId, staff.userId || 'usr_test', {
        type: 'CASUAL',
        fromDate: '2026-06-10',
        toDate: '2026-06-12',
        reason: 'Personal function',
        halfDay: false,
      });

      expect(leave).toBeDefined();
      expect(leave.status).toBe('PENDING');
      expect(leave.days).toBe(3);

      // Invalid dates rejection (fromDate > toDate)
      await expect(
        staffService.applyLeave(tenantId, staff.userId || 'usr_test', {
          type: 'CASUAL',
          fromDate: '2026-06-15',
          toDate: '2026-06-10',
          reason: 'Invalid dates',
        }),
      ).rejects.toThrow(DomainError);

      // List leaves
      const leavesList = await staffService.getLeaves(tenantId, { page: 1, pageSize: 10 });
      expect(leavesList.items.length).toBe(1);

      // Decide leave (Approve)
      const approved = await staffService.decideLeave(tenantId, leave.id, 'usr_admin', {
        decision: 'APPROVED',
        note: 'Approved by Principal',
      });
      expect(approved.status).toBe('APPROVED');
      expect(approved.decisionNote).toBe('Approved by Principal');

      // Cancel a second leave
      const leave2 = await staffService.applyLeave(tenantId, staff.userId || 'usr_test', {
        type: 'SICK',
        fromDate: '2026-07-01',
        toDate: '2026-07-01',
        reason: 'Flu',
        halfDay: false,
      });

      await staffService.cancelLeave(tenantId, leave2.id);
      const cancelled = mockLeaves.find((l) => l.id === leave2.id);
      expect(cancelled.status).toBe('CANCELLED');
    });
  });
});
