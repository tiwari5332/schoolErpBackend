import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { ReportsService } from '../src/modules/reports/reports.service';
import { BulkService } from '../src/modules/bulk/bulk.service';
import { SettingsService } from '../src/modules/settings/settings.service';
import { PortalService } from '../src/modules/portal/portal.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';

describe('Phase B8: Dashboard, Reports, Bulk, Settings & Portal Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b8_test';
  const userId = 'usr_b8_admin';

  let mockStudents: any[] = [];
  let mockStaff: any[] = [];
  let mockStudentAttendance: any[] = [];
  let mockStaffAttendance: any[] = [];
  let mockFeePayments: any[] = [];
  let mockFeeLines: any[] = [];
  let mockLeaves: any[] = [];
  let mockApprovals: any[] = [];
  let mockNotifications: any[] = [];
  let mockBulkImports: any[] = [];
  let mockTenants: any[] = [];
  let mockAuditLogs: any[] = [];
  let mockExams: any[] = [];
  let mockExamMarks: any[] = [];
  let mockNotices: any[] = [];
  let mockStudentLeaves: any[] = [];

  const createMockPrisma = () => {
    return {
      saasStudent: {
        findMany: vi.fn(async ({ where, take }: any) => {
          return mockStudents
            .filter((s) => {
              if (s.tenantId !== where.tenantId) return false;
              if (where.status && s.status !== where.status) return false;
              if (where.OR) {
                const q = where.OR[0]?.fullName?.contains?.toLowerCase() || '';
                const match = s.fullName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q);
                if (!match) return false;
              }
              return true;
            })
            .slice(0, take || mockStudents.length);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStudents.find((s) => s.id === where.id && s.tenantId === where.tenantId);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockStudents.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.status && s.status !== where.status) return false;
            return true;
          }).length;
        }),
      },
      saasStaff: {
        findMany: vi.fn(async ({ where, take }: any) => {
          return mockStaff
            .filter((s) => {
              if (s.tenantId !== where.tenantId) return false;
              if (where.status && s.status !== where.status) return false;
              if (where.OR) {
                const q = where.OR[0]?.fullName?.contains?.toLowerCase() || '';
                const match = s.fullName.toLowerCase().includes(q) || s.employeeCode.toLowerCase().includes(q);
                if (!match) return false;
              }
              return true;
            })
            .slice(0, take || mockStaff.length);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockStaff.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.status && s.status !== where.status) return false;
            return true;
          }).length;
        }),
      },
      saasStudentAttendance: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockStudentAttendance.filter((a) => {
            if (a.tenantId !== where.tenantId) return false;
            if (where.studentId && a.studentId !== where.studentId) return false;
            if (where.date && typeof where.date === 'string' && a.date !== where.date) return false;
            if (where.date && typeof where.date === 'object' && where.date.startsWith && !a.date.startsWith(where.date.startsWith)) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStudentAttendance.find((a) => a.tenantId === where.tenantId && a.studentId === where.studentId && a.date === where.date);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockStudentAttendance.filter((a) => {
            if (a.tenantId !== where.tenantId) return false;
            if (where.status && a.status !== where.status) return false;
            if (where.date && typeof where.date === 'string' && a.date !== where.date) return false;
            return true;
          }).length;
        }),
      },
      saasStaffAttendance: {
        count: vi.fn(async ({ where }: any) => {
          return mockStaffAttendance.filter((a) => {
            if (a.tenantId !== where.tenantId) return false;
            if (where.status && a.status !== where.status) return false;
            return true;
          }).length;
        }),
      },
      saasFeePayment: {
        findMany: vi.fn(async ({ where, take }: any) => {
          return mockFeePayments
            .filter((p) => {
              if (p.tenantId !== where.tenantId) return false;
              if (where.studentId && p.studentId !== where.studentId) return false;
              return true;
            })
            .slice(0, take || mockFeePayments.length);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockFeePayments.filter((p) => p.tenantId === where.tenantId).length;
        }),
        aggregate: vi.fn(async ({ where }: any) => {
          const matched = mockFeePayments.filter((p) => {
            if (p.tenantId !== where.tenantId) return false;
            if (where.status && p.status !== where.status) return false;
            return true;
          });
          const sum = matched.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          return { _sum: { amount: sum } };
        }),
      },
      saasStudentFeeLine: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockFeeLines.filter((l) => {
            if (l.tenantId !== where.tenantId) return false;
            if (where.studentId && l.studentId !== where.studentId) return false;
            if (where.status?.not && l.status === where.status.not) return false;
            return true;
          });
        }),
        aggregate: vi.fn(async ({ where }: any) => {
          const matched = mockFeeLines.filter((l) => {
            if (l.tenantId !== where.tenantId) return false;
            return true;
          });
          const sum = matched.reduce((acc, curr) => acc + (curr.balance || 0), 0);
          return { _sum: { balance: sum } };
        }),
      },
      saasLeave: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockLeaves.filter((l) => {
            if (l.tenantId !== where.tenantId) return false;
            if (where.status && l.status !== where.status) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockLeaves.find((l) => l.id === where.id && l.tenantId === where.tenantId);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockLeaves.filter((l) => {
            if (l.tenantId !== where.tenantId) return false;
            if (where.status && l.status !== where.status) return false;
            return true;
          }).length;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockLeaves.findIndex((l) => l.id === where.id);
          if (idx !== -1) {
            mockLeaves[idx] = { ...mockLeaves[idx], ...data };
            return mockLeaves[idx];
          }
          return null;
        }),
      },
      saasApproval: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockApprovals
            .filter((a) => {
              if (a.tenantId !== where.tenantId) return false;
              if (where.status && a.status !== where.status) return false;
              if (where.type && a.type !== where.type) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockApprovals.find((a) => a.id === where.id && a.tenantId === where.tenantId);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockApprovals.filter((a) => {
            if (a.tenantId !== where.tenantId) return false;
            if (where.status && a.status !== where.status) return false;
            return true;
          }).length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const app = { ...data, createdAt: new Date() };
          mockApprovals.push(app);
          return app;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockApprovals.findIndex((a) => a.id === where.id);
          if (idx !== -1) {
            mockApprovals[idx] = { ...mockApprovals[idx], ...data };
            return mockApprovals[idx];
          }
          return null;
        }),
      },
      saasNotification: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockNotifications
            .filter((n) => {
              if (n.tenantId !== where.tenantId) return false;
              if (n.userId !== where.userId) return false;
              if (where.isRead !== undefined && n.isRead !== where.isRead) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockNotifications.filter((n) => {
            if (n.tenantId !== where.tenantId) return false;
            if (n.userId !== where.userId) return false;
            if (where.isRead !== undefined && n.isRead !== where.isRead) return false;
            return true;
          }).length;
        }),
        updateMany: vi.fn(async ({ where, data }: any) => {
          mockNotifications.forEach((n) => {
            if (n.tenantId === where.tenantId && n.userId === where.userId) {
              if (!where.id || n.id === where.id) {
                Object.assign(n, data);
              }
            }
          });
          return { count: 1 };
        }),
        create: vi.fn(async ({ data }: any) => {
          const n = { ...data, createdAt: new Date() };
          mockNotifications.push(n);
          return n;
        }),
      },
      saasBulkImport: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockBulkImports.filter((b) => b.tenantId === where.tenantId).slice(skip, skip + take);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockBulkImports.find((b) => b.id === where.id && b.tenantId === where.tenantId);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockBulkImports.filter((b) => b.tenantId === where.tenantId).length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const b = { ...data, createdAt: new Date() };
          mockBulkImports.push(b);
          return b;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockBulkImports.findIndex((b) => b.id === where.id);
          if (idx !== -1) {
            mockBulkImports[idx] = { ...mockBulkImports[idx], ...data };
            return mockBulkImports[idx];
          }
          return null;
        }),
      },
      tenant: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockTenants.find((t) => t.id === where.id);
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTenants.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            mockTenants[idx] = { ...mockTenants[idx], ...data, updatedAt: new Date() };
            return mockTenants[idx];
          }
          return null;
        }),
      },
      auditLog: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockAuditLogs.filter((a) => a.tenantId === where.tenantId).slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockAuditLogs.filter((a) => a.tenantId === where.tenantId).length;
        }),
      },
      saasExam: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockExams.filter((e) => {
            if (e.tenantId !== where.tenantId) return false;
            if (where.status && e.status !== where.status) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockExams.find((e) => e.id === where.id && e.tenantId === where.tenantId);
        }),
      },
      saasExamMarks: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockExamMarks.find((m) => {
            if (m.tenantId !== where.tenantId) return false;
            if (where.studentId && m.studentId !== where.studentId) return false;
            if (where.examId && m.examId !== where.examId) return false;
            return true;
          });
        }),
      },
      saasNotice: {
        findMany: vi.fn(async ({ where, take }: any) => {
          return mockNotices.filter((n) => n.tenantId === where.tenantId).slice(0, take || mockNotices.length);
        }),
      },
      saasStudentLeave: {
        create: vi.fn(async ({ data }: any) => {
          const l = { ...data, createdAt: new Date() };
          mockStudentLeaves.push(l);
          return l;
        }),
      },
    };
  };

  let mockPrisma: any;
  let dashboardService: DashboardService;
  let reportsService: ReportsService;
  let bulkService: BulkService;
  let settingsService: SettingsService;
  let portalService: PortalService;

  beforeEach(() => {
    mockStudents = [
      {
        id: 'stu_01',
        tenantId,
        admissionNo: 'ADM-2026-0001',
        fullName: 'Aarav Sharma',
        className: 'Class 5-A',
        sectionName: 'A',
        status: 'ACTIVE',
        attendancePercent: 94.5,
        feeDue: 4500,
        photoUrl: null,
      },
    ];
    mockStaff = [
      {
        id: 'stf_01',
        tenantId,
        employeeCode: 'EMP-001',
        fullName: 'Anita Verma',
        designation: 'Senior Teacher',
        status: 'ACTIVE',
      },
    ];
    mockStudentAttendance = [];
    mockStaffAttendance = [];
    mockFeePayments = [];
    mockFeeLines = [];
    mockLeaves = [];
    mockApprovals = [];
    mockNotifications = [
      {
        id: 'ntf_01',
        tenantId,
        userId,
        title: 'New Student Enrolled',
        body: 'Aarav Sharma enrolled into Class 5-A',
        type: 'INFO',
        link: '/students/stu_01',
        isRead: false,
        createdAt: new Date(),
      },
    ];
    mockBulkImports = [];
    mockTenants = [
      {
        id: tenantId,
        name: 'Greenfield Public School',
        slug: 'greenfield',
        logoUrl: null,
        brandColor: '#4F46E5',
        board: 'CBSE',
        udiseCode: '09XXXXXXXX',
        address: { city: 'New Delhi' },
        phone: '+919876543210',
        email: 'info@greenfield.edu',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockAuditLogs = [];
    mockExams = [
      {
        id: 'exm_01',
        tenantId,
        name: 'Unit Test 1',
        status: 'PUBLISHED',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        updatedAt: new Date(),
      },
    ];
    mockExamMarks = [
      {
        id: 'mrk_01',
        tenantId,
        examId: 'exm_01',
        studentId: 'stu_01',
        marks: 88,
        percentage: 88,
        grade: 'A1',
        isAbsent: false,
        createdAt: new Date(),
      },
    ];
    mockNotices = [];
    mockStudentLeaves = [];

    mockPrisma = createMockPrisma();
    dashboardService = new DashboardService(mockPrisma as any, clock, idGen);
    reportsService = new ReportsService(mockPrisma as any, clock, idGen);
    bulkService = new BulkService(mockPrisma as any, clock, idGen);
    settingsService = new SettingsService(mockPrisma as any, clock, idGen);
    portalService = new PortalService(mockPrisma as any, clock, idGen);
  });

  // ----------------------------------------------------
  // DASHBOARD TESTS
  // ----------------------------------------------------
  describe('Dashboard Module', () => {
    it('should return KPI metrics and charts successfully', async () => {
      const studentsKpi = await dashboardService.getStudentsKpi(tenantId);
      expect(studentsKpi).toBeDefined();
      expect(studentsKpi.total).toBeGreaterThanOrEqual(1);

      const staffKpi = await dashboardService.getStaffKpi(tenantId);
      expect(staffKpi).toBeDefined();
      expect(staffKpi.active).toBeGreaterThanOrEqual(1);

      const quickActions = await dashboardService.getQuickActions(tenantId, 'ADMIN');
      expect(quickActions.actions.length).toBeGreaterThan(0);

      const feeTrend = await dashboardService.getFeeTrend(tenantId, { range: '7d' });
      expect(feeTrend.points.length).toBe(7);

      const attTrend = await dashboardService.getAttendanceTrend(tenantId, { range: '7d' });
      expect(attTrend.points.length).toBe(7);
    });

    it('should process pending approvals and decisions', async () => {
      mockLeaves.push({
        id: 'lev_01',
        tenantId,
        staffId: 'stf_01',
        staffName: 'Anita Verma',
        type: 'CASUAL',
        fromDate: '2026-11-20',
        toDate: '2026-11-21',
        status: 'PENDING',
        reason: 'Personal work',
        createdAt: new Date(),
      });

      const pending = await dashboardService.getPendingApprovals(tenantId);
      expect(pending.items.length).toBe(1);

      const decision = await dashboardService.decideApproval(tenantId, 'lev_01', userId, {
        decision: 'APPROVED',
        note: 'Approved by principal',
      });
      expect(decision.status).toBe('APPROVED');
      expect(mockLeaves[0].status).toBe('APPROVED');
    });

    it('should perform global search across students, staff, and system pages', async () => {
      const searchRes = await dashboardService.globalSearch(tenantId, { q: 'Aarav', limit: 5 });
      expect(searchRes.students.length).toBe(1);
      expect(searchRes.students[0].title).toBe('Aarav Sharma');
      expect(searchRes.students[0].link).toBe('/students/stu_01');

      const staffSearch = await dashboardService.globalSearch(tenantId, { q: 'Anita', limit: 5 });
      expect(staffSearch.staff.length).toBe(1);
      expect(staffSearch.staff[0].title).toBe('Anita Verma');

      const pageSearch = await dashboardService.globalSearch(tenantId, { q: 'Fee', limit: 5 });
      expect(pageSearch.pages.some((p) => p.title.includes('Fee'))).toBe(true);
    });

    it('should manage notification bell lifecycle (list, mark read, mark all read)', async () => {
      const notifications = await dashboardService.getNotifications(tenantId, userId, {
        unreadOnly: true,
        page: 1,
        pageSize: 10,
      });
      expect(notifications.unreadCount).toBe(1);
      expect(notifications.items.length).toBe(1);

      await dashboardService.markNotificationRead(tenantId, userId, 'ntf_01');
      expect(mockNotifications[0].isRead).toBe(true);

      mockNotifications.push({
        id: 'ntf_02',
        tenantId,
        userId,
        title: 'Fee Payment Received',
        body: 'Receipt #RCP-001 generated',
        type: 'FEE',
        link: null,
        isRead: false,
        createdAt: new Date(),
      });

      await dashboardService.markAllNotificationsRead(tenantId, userId);
      expect(mockNotifications.every((n) => n.isRead)).toBe(true);
    });
  });

  // ----------------------------------------------------
  // REPORTS TESTS
  // ----------------------------------------------------
  describe('Reports Module', () => {
    it('should return reports catalog and execute report data query', async () => {
      const catalog = await reportsService.getCatalog(tenantId);
      expect(catalog.items.length).toBeGreaterThan(0);
      expect(catalog.items.some((i) => i.key === 'students-roster')).toBe(true);

      const reportData = await reportsService.runReport(tenantId, 'students-roster', {});
      expect(reportData.columns.length).toBeGreaterThan(0);
      expect(reportData.rows.length).toBeGreaterThan(0);
    });

    it('should trigger report export job and retrieve job status', async () => {
      const job = await reportsService.createExportJob(tenantId, 'fee-collection', {
        format: 'xlsx',
        filters: {},
      });
      expect(job.jobId).toBeDefined();
      expect(job.status).toBe('QUEUED');

      const status = await reportsService.getExportStatus(tenantId, job.jobId);
      expect(status.status).toBe('COMPLETED');
      expect(status.downloadUrl).toContain(job.jobId);
    });
  });

  // ----------------------------------------------------
  // BULK OPERATIONS TESTS
  // ----------------------------------------------------
  describe('Bulk Operations Module', () => {
    it('should generate template, upload file, preview rows and commit import', async () => {
      const template = await bulkService.getTemplate('students');
      expect(template.headers.length).toBeGreaterThan(0);
      expect(template.headers).toContain('AdmissionNo');

      const upload = await bulkService.upload(tenantId, userId, {
        entity: 'STUDENTS',
        fileName: 'students.csv',
      });
      expect(upload.id).toBeDefined();
      expect(upload.totalRows).toBe(2);
      expect(upload.validRows).toBe(2);

      const preview = await bulkService.getRows(tenantId, upload.id);
      expect(preview.items.length).toBe(2);

      const commit = await bulkService.commitImport(tenantId, upload.id);
      expect(commit.status).toBe('COMMITTED');
      expect(commit.rowsCommitted).toBe(2);

      const history = await bulkService.getHistory(tenantId, { page: 1, pageSize: 10 });
      expect(history.items.length).toBe(1);
    });

    it('should cancel bulk import before commit', async () => {
      const upload = await bulkService.upload(tenantId, userId, {
        entity: 'STAFF',
        fileName: 'staff.csv',
      });

      await bulkService.cancelImport(tenantId, upload.id);
      const fetched = await bulkService.getImport(tenantId, upload.id);
      expect(fetched.status).toBe('CANCELLED');
    });
  });

  // ----------------------------------------------------
  // SETTINGS TESTS
  // ----------------------------------------------------
  describe('Settings Module', () => {
    it('should get and update school profile', async () => {
      const profile = await settingsService.getSchoolProfile(tenantId);
      expect(profile.name).toBe('Greenfield Public School');
      expect(profile.board).toBe('CBSE');

      const updated = await settingsService.updateSchoolProfile(tenantId, {
        name: 'Greenfield International School',
        board: 'ICSE',
      });
      expect(updated.name).toBe('Greenfield International School');
      expect(updated.board).toBe('ICSE');
    });

    it('should manage school preferences and audit logs', async () => {
      const prefs = await settingsService.getPreferences(tenantId);
      expect(prefs.admissionNoFormat).toBe('ADM-{YYYY}-{SEQ:4}');

      const updatedPrefs = await settingsService.updatePreferences(tenantId, {
        lateFeeEnabled: true,
        blockAdmitCardOnDues: true,
      });
      expect(updatedPrefs.lateFeeEnabled).toBe(true);
      expect(updatedPrefs.blockAdmitCardOnDues).toBe(true);

      const auditLogs = await settingsService.getAuditLogs(tenantId, { page: 1, pageSize: 10 });
      expect(auditLogs.items.length).toBeGreaterThan(0);
      expect(auditLogs.items[0].action).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // PORTAL TESTS
  // ----------------------------------------------------
  describe('Parent & Student Portal Module', () => {
    it('should return children linked to logged-in parent', async () => {
      const children = await portalService.getChildren(tenantId, 'usr_parent_01');
      expect(children.items.length).toBe(1);
      expect(children.items[0].name).toBe('Aarav Sharma');
      expect(children.items[0].className).toBe('Class 5-A');
    });

    it('should provide single-screen overview for child', async () => {
      const overview = await portalService.getOverview(tenantId, 'stu_01');
      expect(overview.student.id).toBe('stu_01');
      expect(overview.student.name).toBe('Aarav Sharma');
      expect(overview.attendance.monthPercent).toBe(94.5);
      expect(overview.fees.totalDue).toBe(4500);
      expect(overview.latestResult.examName).toBe('Unit Test 1');
      expect(overview.timetableToday.length).toBeGreaterThan(0);
      expect(overview.notices.length).toBeGreaterThan(0);
    });

    it('should return monthly attendance calendar marks', async () => {
      const att = await portalService.getAttendance(tenantId, 'stu_01', { month: '2026-11' });
      expect(att.month).toBe('2026-11');
      expect(att.marks).toBeDefined();
      expect(att.percent).toBe(94.5);
    });

    it('should return fee ledger with dues and payments', async () => {
      mockFeeLines.push({
        id: 'sfl_01',
        tenantId,
        studentId: 'stu_01',
        categoryName: 'Tuition Fee',
        amount: 3000,
        paid: 0,
        dueDate: '2026-12-10',
        status: 'PENDING',
      });

      const fees = await portalService.getFees(tenantId, 'stu_01');
      expect(fees.totalDue).toBe(4500);
      expect(fees.lines.length).toBe(1);
      expect(fees.lines[0].title).toBe('Tuition Fee');
    });

    it('should return published exam results for parent/student', async () => {
      const results = await portalService.getResults(tenantId, 'stu_01');
      expect(results.items.length).toBe(1);
      expect(results.items[0].examName).toBe('Unit Test 1');
      expect(results.items[0].percentage).toBe(88);
    });

    it('should allow parent to apply leave for child and generate pending approval', async () => {
      const leaveRes = await portalService.applyLeave(tenantId, 'stu_01', 'usr_parent_01', {
        fromDate: '2026-11-25',
        toDate: '2026-11-26',
        reason: 'Family wedding',
      });

      expect(leaveRes.id).toBeDefined();
      expect(leaveRes.status).toBe('PENDING');
      expect(mockStudentLeaves.length).toBe(1);
      expect(mockStudentLeaves[0].reason).toBe('Family wedding');
      expect(mockApprovals.length).toBe(1);
      expect(mockApprovals[0].type).toBe('STUDENT_LEAVE');
    });
  });
});
