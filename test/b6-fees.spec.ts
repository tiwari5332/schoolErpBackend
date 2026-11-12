import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeesService, DEFAULT_FEE_CATEGORIES } from '../src/modules/fees/fees.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { DomainError } from '../src/common/domain.error';

describe('Phase B6: Fees & Finance Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b6_test';

  let mockCategories: any[] = [];
  let mockStructures: any[] = [];
  let mockLines: any[] = [];
  let mockPayments: any[] = [];
  let mockConcessions: any[] = [];
  let mockStudents: any[] = [];
  let mockClasses: any[] = [];

  const createMockPrisma = () => {
    return {
      saasFeeCategory: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockCategories.filter((c) => c.tenantId === where.tenantId);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockCategories.find((c) => {
            if (where.id && c.id !== where.id) return false;
            if (where.tenantId && c.tenantId !== where.tenantId) return false;
            if (where.code && c.code !== where.code) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const c = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockCategories.push(c);
          return c;
        }),
      },
      saasFeeStructure: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockStructures.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.classId && s.classId !== where.classId) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStructures.find((s) => s.id === where.id && s.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const s = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockStructures.push(s);
          return s;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockStructures.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockStructures[idx] = { ...mockStructures[idx], ...data, updatedAt: new Date() };
            return mockStructures[idx];
          }
          return null;
        }),
      },
      saasStudentFeeLine: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockLines.filter((l) => {
            if (l.tenantId !== where.tenantId) return false;
            if (where.studentId && l.studentId !== where.studentId) return false;
            if (where.balance && where.balance.gt !== undefined && l.balance <= where.balance.gt) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockLines.find((l) => {
            if (where.id && l.id !== where.id) return false;
            if (where.tenantId && l.tenantId !== where.tenantId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const l = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockLines.push(l);
          return l;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockLines.findIndex((l) => l.id === where.id);
          if (idx !== -1) {
            mockLines[idx] = { ...mockLines[idx], ...data, updatedAt: new Date() };
            return mockLines[idx];
          }
          return null;
        }),
      },
      saasFeePayment: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockPayments
            .filter((p) => {
              if (p.tenantId !== where.tenantId) return false;
              if (where.studentId && p.studentId !== where.studentId) return false;
              if (where.status && p.status !== where.status) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockPayments.filter((p) => {
            if (p.tenantId !== where.tenantId) return false;
            if (where.studentId && p.studentId !== where.studentId) return false;
            if (where.status && p.status !== where.status) return false;
            return true;
          }).length;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockPayments.find((p) => p.id === where.id && p.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const p = { ...data, createdAt: new Date(), updatedAt: new Date(), paidAt: new Date() };
          mockPayments.push(p);
          return p;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockPayments.findIndex((p) => p.id === where.id);
          if (idx !== -1) {
            mockPayments[idx] = { ...mockPayments[idx], ...data, updatedAt: new Date() };
            return mockPayments[idx];
          }
          return null;
        }),
      },
      saasFeeConcession: {
        create: vi.fn(async ({ data }: any) => {
          const c = { ...data, createdAt: new Date() };
          mockConcessions.push(c);
          return c;
        }),
      },
      saasStudent: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockStudents
            .filter((s) => {
              if (s.tenantId !== where.tenantId) return false;
              if (where.classId && s.classId !== where.classId) return false;
              if (where.status && s.status !== where.status) return false;
              if (where.feeDue && where.feeDue.gt !== undefined && Number(s.feeDue) <= where.feeDue.gt) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockStudents.filter((s) => {
            if (s.tenantId !== where.tenantId) return false;
            if (where.classId && s.classId !== where.classId) return false;
            if (where.status && s.status !== where.status) return false;
            if (where.feeDue && where.feeDue.gt !== undefined && Number(s.feeDue) <= where.feeDue.gt) return false;
            return true;
          }).length;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockStudents.find((s) => {
            if (where.id && s.id !== where.id) return false;
            if (where.tenantId && s.tenantId !== where.tenantId) return false;
            return true;
          });
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockStudents.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockStudents[idx] = { ...mockStudents[idx], ...data, updatedAt: new Date() };
            return mockStudents[idx];
          }
          return null;
        }),
      },
      schoolClass: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockClasses.filter((c) => c.tenantId === where.tenantId);
        }),
      },
    };
  };

  let mockPrisma: any;
  let feesService: FeesService;

  beforeEach(() => {
    mockCategories = [];
    mockStructures = [];
    mockLines = [];
    mockPayments = [];
    mockConcessions = [];
    mockStudents = [
      { id: 'stu_01', tenantId, admissionNo: 'ADM-001', fullName: 'Aarav Sharma', classId: 'cls_1', className: 'Grade 10', sectionName: 'A', status: 'ACTIVE', feeDue: 0, guardians: [{ phone: '9876543210' }] },
      { id: 'stu_02', tenantId, admissionNo: 'ADM-002', fullName: 'Priya Patel', classId: 'cls_1', className: 'Grade 10', sectionName: 'A', status: 'ACTIVE', feeDue: 0, guardians: [{ phone: '9876543211' }] },
    ];
    mockClasses = [{ id: 'cls_1', tenantId, name: 'Grade 10' }];

    mockPrisma = createMockPrisma();
    feesService = new FeesService(mockPrisma as any, clock, idGen);
  });

  describe('Categories & Structures', () => {
    it('returns default categories and creates custom category', async () => {
      const cats = await feesService.getCategories(tenantId);
      expect(cats.items.length).toBe(DEFAULT_FEE_CATEGORIES.length);

      const created = await feesService.createCategory(tenantId, {
        name: 'Robotics Club',
        code: 'ROB',
        description: 'Stem and robotics lab fee',
      });
      expect(created.code).toBe('ROB');
      expect(mockCategories.length).toBe(1);

      // Duplicate code check
      await expect(
        feesService.createCategory(tenantId, {
          name: 'Robotics Second',
          code: 'ROB',
        }),
      ).rejects.toThrow(DomainError);
    });

    it('creates fee structure and auto-generates fee lines for enrolled students', async () => {
      const structure = await feesService.createStructure(tenantId, {
        name: 'Grade 10 General Fee',
        classId: 'cls_1',
        frequency: 'MONTHLY',
        heads: [
          { categoryId: 'fcat_tuition', amount: 3000 },
          { categoryId: 'fcat_exam', amount: 500 },
        ],
        dueDate: '2026-11-10',
      });

      expect(structure.id).toBeDefined();
      expect(structure.totalAmount).toBe(3500);

      // Two students enrolled in cls_1 -> each gets 2 lines = 4 lines generated
      expect(mockLines.length).toBe(4);

      // Students feeDue updated to 3500
      expect(mockStudents[0].feeDue).toBe(3500);
      expect(mockStudents[1].feeDue).toBe(3500);
    });

    it('updates structure details', async () => {
      const structure = await feesService.createStructure(tenantId, {
        name: 'Old Structure',
        classId: 'cls_1',
        heads: [{ categoryId: 'fcat_tuition', amount: 2000 }],
      });

      const updated = await feesService.updateStructure(tenantId, structure.id, {
        name: 'New Structure Name',
      });
      expect(updated.name).toBe('New Structure Name');
    });
  });

  describe('Student Ledger, Fee Collection & Receipts', () => {
    it('assigns custom fee, retrieves ledger, collects fee and generates receipt', async () => {
      // Assign custom transport fee to Aarav
      await feesService.assignStudentFee(tenantId, 'stu_01', {
        categoryId: 'fcat_transport',
        amount: 1200,
        period: '2026-11',
        dueDate: '2026-11-15',
      });

      expect(mockStudents[0].feeDue).toBe(1200);

      // Ledger check
      const ledger = await feesService.getStudentLedger(tenantId, 'stu_01');
      expect(ledger.summary.totalBilled).toBe(1200);
      expect(ledger.summary.outstanding).toBe(1200);
      expect(ledger.lines.length).toBe(1);

      // Collect payment
      const lineId = ledger.lines[0].id;
      const collectRes = await feesService.collectFee(tenantId, 'usr_accountant', {
        studentId: 'stu_01',
        amount: 1200,
        mode: 'UPI',
        reference: 'UPI12345678',
        lineAllocations: [{ lineId, amount: 1200 }],
      });

      expect(collectRes.receipt.receiptNo).toBeDefined();
      expect(collectRes.receipt.amount).toBe(1200);
      expect(collectRes.receipt.lines.length).toBe(1);

      // Line status is now PAID and student feeDue is 0
      expect(mockLines[0].status).toBe('PAID');
      expect(mockStudents[0].feeDue).toBe(0);

      // Verify payment is in register and receipt can be fetched
      const payments = await feesService.getPayments(tenantId, { page: 1, pageSize: 10 });
      expect(payments.items.length).toBe(1);

      const receipt = await feesService.getReceipt(tenantId, collectRes.payment.id);
      expect(receipt.receiptNo).toBe(collectRes.receipt.receiptNo);
    });

    it('handles refund and adjusts student fee balance', async () => {
      await feesService.assignStudentFee(tenantId, 'stu_01', {
        categoryId: 'fcat_tuition',
        amount: 2500,
        period: '2026-11',
        dueDate: '2026-11-10',
      });

      const collectRes = await feesService.collectFee(tenantId, 'usr_accountant', {
        studentId: 'stu_01',
        amount: 2500,
        mode: 'CASH',
      });
      expect(mockStudents[0].feeDue).toBe(0);

      // Process refund
      const refund = await feesService.refundPayment(tenantId, collectRes.payment.id, {
        reason: 'Duplicate payment',
      });

      expect(refund.status).toBe('REFUNDED');
      // Student feeDue should be restored to 2500
      expect(mockStudents[0].feeDue).toBe(2500);
    });

    it('applies fee concession/waiver', async () => {
      await feesService.assignStudentFee(tenantId, 'stu_01', {
        categoryId: 'fcat_tuition',
        amount: 3000,
        period: '2026-11',
        dueDate: '2026-11-10',
      });

      const lineId = mockLines[0].id;
      const concession = await feesService.applyConcession(tenantId, 'usr_principal', {
        studentId: 'stu_01',
        lineId,
        amount: 1000,
        reason: 'Merit scholarship waiver',
      });

      expect(concession.amount).toBe(1000);
      expect(mockLines[0].balance).toBe(2000);
      expect(mockStudents[0].feeDue).toBe(2000);
    });
  });

  describe('Dues, Reminders, Summary & Online Payments', () => {
    it('retrieves dues list and triggers reminders', async () => {
      mockStudents[0].feeDue = 4500;
      mockStudents[1].feeDue = 1500;

      const dues = await feesService.getDues(tenantId, { page: 1, pageSize: 10 });
      expect(dues.items.length).toBe(2);
      expect(dues.totalDues).toBe(6000);

      const reminders = await feesService.sendReminders(tenantId, {
        studentIds: ['stu_01', 'stu_02'],
        channel: 'WHATSAPP',
      });
      expect(reminders.sent).toBe(2);
      expect(reminders.channel).toBe('WHATSAPP');
    });

    it('computes executive fee landing summary', async () => {
      mockStudents[0].feeDue = 3000;

      const summary = await feesService.getFeeSummary(tenantId);
      expect(summary.totalPending).toBe(3000);
      expect(summary.defaultersCount).toBe(1);
      expect(summary.collectionRate).toBeDefined();
    });

    it('initiates and confirms online fee payments', async () => {
      await feesService.assignStudentFee(tenantId, 'stu_01', {
        categoryId: 'fcat_tuition',
        amount: 2000,
        period: '2026-11',
        dueDate: '2026-11-10',
      });

      const init = await feesService.initiateOnlinePayment(tenantId, {
        studentId: 'stu_01',
        lineIds: [mockLines[0].id],
        amount: 2000,
      });

      expect(init.orderId).toBeDefined();
      expect(init.amount).toBe(2000);

      const confirm = await feesService.confirmOnlinePayment(tenantId, 'usr_parent', {
        orderId: init.orderId,
        paymentId: 'pay_rzp_mock_123',
        studentId: 'stu_01',
        amount: 2000,
      });

      expect(confirm.success).toBe(true);
      expect(confirm.receiptNo).toBeDefined();
      expect(mockStudents[0].feeDue).toBe(0);
    });
  });
});

