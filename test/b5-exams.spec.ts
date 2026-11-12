import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExamsService } from '../src/modules/exams/exams.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { DomainError } from '../src/common/domain.error';

describe('Phase B5: Examinations & Report Cards Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b5_test';

  let mockExams: any[] = [];
  let mockPapers: any[] = [];
  let mockMarks: any[] = [];
  let mockStudents: any[] = [];
  let mockSubjects: any[] = [];

  const createMockPrisma = () => {
    return {
      saasExam: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockExams
            .filter((e) => {
              if (e.tenantId !== where.tenantId) return false;
              if (where.status && e.status !== where.status) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockExams.filter((e) => {
            if (e.tenantId !== where.tenantId) return false;
            if (where.status && e.status !== where.status) return false;
            return true;
          }).length;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockExams.find((e) => {
            if (where.id && e.id !== where.id) return false;
            if (where.tenantId && e.tenantId !== where.tenantId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const e = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockExams.push(e);
          return e;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockExams.findIndex((e) => e.id === where.id);
          if (idx !== -1) {
            mockExams[idx] = { ...mockExams[idx], ...data, updatedAt: new Date() };
            return mockExams[idx];
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          const idx = mockExams.findIndex((e) => e.id === where.id);
          if (idx !== -1) {
            mockExams.splice(idx, 1);
          }
        }),
      },
      saasExamPaper: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockPapers.filter((p) => {
            if (p.tenantId !== where.tenantId) return false;
            if (where.examId && p.examId !== where.examId) return false;
            if (where.classId && p.classId !== where.classId) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockPapers.find((p) => {
            if (where.id && p.id !== where.id) return false;
            if (where.tenantId && p.tenantId !== where.tenantId) return false;
            if (where.examId && p.examId !== where.examId) return false;
            if (where.classId && p.classId !== where.classId) return false;
            if (where.subjectId && p.subjectId !== where.subjectId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const p = { ...data, createdAt: new Date(), updatedAt: new Date(), isLocked: false };
          mockPapers.push(p);
          return p;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockPapers.findIndex((p) => p.id === where.id);
          if (idx !== -1) {
            mockPapers[idx] = { ...mockPapers[idx], ...data, updatedAt: new Date() };
            return mockPapers[idx];
          }
          return null;
        }),
        deleteMany: vi.fn(async ({ where }: any) => {
          mockPapers = mockPapers.filter((p) => p.examId !== where.examId);
        }),
      },
      saasExamMarks: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockMarks.filter((m) => {
            if (m.tenantId !== where.tenantId) return false;
            if (where.examId && m.examId !== where.examId) return false;
            if (where.classId && m.classId !== where.classId) return false;
            if (where.sectionId && m.sectionId !== where.sectionId) return false;
            if (where.subjectId && m.subjectId !== where.subjectId) return false;
            if (where.studentId && m.studentId !== where.studentId) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockMarks.find((m) => {
            if (where.tenantId && m.tenantId !== where.tenantId) return false;
            if (where.examId && m.examId !== where.examId) return false;
            if (where.paperId && m.paperId !== where.paperId) return false;
            if (where.studentId && m.studentId !== where.studentId) return false;
            return true;
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const m = { ...data, createdAt: new Date(), updatedAt: new Date(), markedAt: new Date() };
          mockMarks.push(m);
          return m;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockMarks.findIndex((m) => m.id === where.id);
          if (idx !== -1) {
            mockMarks[idx] = { ...mockMarks[idx], ...data, updatedAt: new Date(), markedAt: new Date() };
            return mockMarks[idx];
          }
          return null;
        }),
        deleteMany: vi.fn(async ({ where }: any) => {
          mockMarks = mockMarks.filter((m) => m.examId !== where.examId);
        }),
      },
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
      },
      schoolSubject: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSubjects.find((s) => s.id === where.id && s.tenantId === where.tenantId);
        }),
      },
    };
  };

  let mockPrisma: any;
  let examsService: ExamsService;

  beforeEach(() => {
    mockExams = [];
    mockPapers = [];
    mockMarks = [];
    mockStudents = [
      { id: 'stu_01', tenantId, admissionNo: 'ADM-001', fullName: 'Aarav Sharma', classId: 'cls_1', className: 'Grade 10', sectionId: 'sec_1', sectionName: 'A', rollNo: '101', status: 'ACTIVE', attendancePercent: 95 },
      { id: 'stu_02', tenantId, admissionNo: 'ADM-002', fullName: 'Priya Patel', classId: 'cls_1', className: 'Grade 10', sectionId: 'sec_1', sectionName: 'A', rollNo: '102', status: 'ACTIVE', attendancePercent: 92 },
    ];
    mockSubjects = [
      { id: 'sbj_math', tenantId, name: 'Mathematics' },
      { id: 'sbj_sci', tenantId, name: 'Science' },
    ];

    mockPrisma = createMockPrisma();
    examsService = new ExamsService(mockPrisma as any, clock, idGen);
  });

  describe('Exam Lifecycle', () => {
    it('creates an exam with papers and retrieves exam details with progress', async () => {
      const created = await examsService.createExam(tenantId, {
        name: 'Half Yearly 2026',
        type: 'TERM',
        startDate: '2026-12-01',
        endDate: '2026-12-10',
        classIds: ['cls_1'],
        papers: [
          {
            classId: 'cls_1',
            subjectId: 'sbj_math',
            date: '2026-12-02',
            startTime: '10:00',
            endTime: '13:00',
            maxMarks: 100,
            passMarks: 33,
            room: 'Hall-A',
          },
        ],
      });

      expect(created.exam.id).toBeDefined();
      expect(created.exam.name).toBe('Half Yearly 2026');
      expect(created.papers.length).toBe(1);
      expect(created.papers[0].subjectName).toBe('Mathematics');

      const detail = await examsService.getExamById(tenantId, created.exam.id);
      expect(detail.progress.totalPapers).toBe(1);
      expect(detail.progress.lockedPapers).toBe(0);
      expect(detail.progress.percentComplete).toBe(0);
    });

    it('blocks exam update and delete once published', async () => {
      const created = await examsService.createExam(tenantId, {
        name: 'Final Term 2026',
        startDate: '2026-12-15',
        endDate: '2026-12-25',
        classIds: ['cls_1'],
      });

      // Publish the exam
      await examsService.publishExam(tenantId, created.exam.id, 'usr_admin');

      // Attempt update -> should throw EXAM_PUBLISHED_LOCKED
      await expect(
        examsService.updateExam(tenantId, created.exam.id, {
          name: 'Final Term Modified',
        }),
      ).rejects.toThrow(DomainError);

      // Attempt delete -> should throw EXAM_PUBLISHED_LOCKED
      await expect(
        examsService.deleteExam(tenantId, created.exam.id),
      ).rejects.toThrow(DomainError);

      // Unpublish then delete should succeed
      await examsService.unpublishExam(tenantId, created.exam.id, 'usr_admin');
      await examsService.deleteExam(tenantId, created.exam.id);
      expect(mockExams.length).toBe(0);
    });
  });

  describe('Marks Entry & Locking', () => {
    it('saves marks, computes grade, and enforces marks locking', async () => {
      const created = await examsService.createExam(tenantId, {
        name: 'Unit Test 1',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        classIds: ['cls_1'],
        papers: [
          {
            classId: 'cls_1',
            subjectId: 'sbj_math',
            date: '2026-08-02',
            startTime: '09:00',
            endTime: '10:30',
            maxMarks: 50,
            passMarks: 17,
          },
        ],
      });

      // Save marks
      const saveRes = await examsService.saveExamMarks(tenantId, created.exam.id, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        subjectId: 'sbj_math',
        rows: [
          { studentId: 'stu_01', marks: 46, isAbsent: false, remark: 'Great job' },
          { studentId: 'stu_02', marks: null, isAbsent: true, remark: 'Medical leave' },
        ],
      });

      expect(saveRes.saved).toBe(2);

      // Get marks sheet
      const sheet = await examsService.getExamMarks(tenantId, created.exam.id, {
        classId: 'cls_1',
        sectionId: 'sec_1',
        subjectId: 'sbj_math',
      });
      const s1 = sheet.students.find((s) => s.studentId === 'stu_01');
      expect(s1?.marks).toBe(46);
      expect(s1?.grade).toBe('A1'); // 46/50 = 92% -> A1

      // Lock paper
      await examsService.lockExamMarks(tenantId, created.exam.id, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        subjectId: 'sbj_math',
      });

      // Trying to edit locked paper marks should fail with MARKS_LOCKED
      await expect(
        examsService.saveExamMarks(tenantId, created.exam.id, 'usr_teacher', {
          classId: 'cls_1',
          sectionId: 'sec_1',
          subjectId: 'sbj_math',
          rows: [{ studentId: 'stu_01', marks: 48, isAbsent: false }],
        }),
      ).rejects.toThrow(DomainError);

      // Unlock and edit should work
      await examsService.unlockExamMarks(tenantId, created.exam.id, 'usr_admin', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        subjectId: 'sbj_math',
      });

      const updatedRes = await examsService.saveExamMarks(tenantId, created.exam.id, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        subjectId: 'sbj_math',
        rows: [{ studentId: 'stu_01', marks: 48, isAbsent: false }],
      });
      expect(updatedRes.saved).toBe(1);
    });
  });

  describe('Results & Report Cards', () => {
    it('computes class results with ranking and generates complete report card', async () => {
      const created = await examsService.createExam(tenantId, {
        name: 'Half Yearly',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        classIds: ['cls_1'],
        papers: [
          {
            classId: 'cls_1',
            subjectId: 'sbj_math',
            date: '2026-10-02',
            startTime: '10:00',
            endTime: '12:00',
            maxMarks: 100,
            passMarks: 33,
          },
        ],
      });

      // Save marks: Aarav = 95, Priya = 85
      await examsService.saveExamMarks(tenantId, created.exam.id, 'usr_teacher', {
        classId: 'cls_1',
        sectionId: 'sec_1',
        subjectId: 'sbj_math',
        rows: [
          { studentId: 'stu_01', marks: 95, isAbsent: false },
          { studentId: 'stu_02', marks: 85, isAbsent: false },
        ],
      });

      // Results
      const results = await examsService.getExamResults(tenantId, created.exam.id, {
        classId: 'cls_1',
        sectionId: 'sec_1',
      });
      expect(results.rows.length).toBe(2);
      expect(results.rows[0].studentId).toBe('stu_01');
      expect(results.rows[0].rank).toBe(1);
      expect(results.rows[1].studentId).toBe('stu_02');
      expect(results.rows[1].rank).toBe(2);

      // Student Report Card
      const reportCard = await examsService.getStudentReportCard(tenantId, 'stu_01', {
        examId: created.exam.id,
      });

      expect(reportCard.student.name).toBe('Aarav Sharma');
      expect(reportCard.exam.name).toBe('Half Yearly');
      expect(reportCard.percentage).toBe(95);
      expect(reportCard.grade).toBe('A1');
      expect(reportCard.result).toBe('PASS');
    });

    it('generates bulk report cards and admit cards PDF links', async () => {
      const created = await examsService.createExam(tenantId, {
        name: 'Annual Exam',
        startDate: '2027-03-01',
        endDate: '2027-03-15',
        classIds: ['cls_1'],
      });

      const reportCardsPdf = await examsService.generateReportCardsPdf(tenantId, created.exam.id, {
        classId: 'cls_1',
        sectionId: 'sec_1',
      });
      expect(reportCardsPdf.pdfUrl).toContain('.pdf');

      const admitCardsPdf = await examsService.generateAdmitCardsPdf(tenantId, created.exam.id, {
        classId: 'cls_1',
      });
      expect(admitCardsPdf.pdfUrl).toContain('.pdf');
    });
  });
});

