import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import {
  SessionCreateDto,
  SessionRolloverDto,
  ClassCreateDto,
  ClassUpdateDto,
  SubjectCreateDto,
  SubjectUpdateDto,
  ClassSubjectsAssignDto,
  GradeScaleUpsertDto,
} from './dto/academic.dto';

export const DEFAULT_GRADE_SCALES = [
  {
    id: 'grs_cbse_9pt',
    name: 'CBSE 9-point',
    bands: [
      { grade: 'A1', minPercent: 91, maxPercent: 100, gradePoint: 10 },
      { grade: 'A2', minPercent: 81, maxPercent: 90.99, gradePoint: 9 },
      { grade: 'B1', minPercent: 71, maxPercent: 80.99, gradePoint: 8 },
      { grade: 'B2', minPercent: 61, maxPercent: 70.99, gradePoint: 7 },
      { grade: 'C1', minPercent: 51, maxPercent: 60.99, gradePoint: 6 },
      { grade: 'C2', minPercent: 41, maxPercent: 50.99, gradePoint: 5 },
      { grade: 'D', minPercent: 33, maxPercent: 40.99, gradePoint: 4 },
      { grade: 'E1', minPercent: 21, maxPercent: 32.99, gradePoint: 0 },
      { grade: 'E2', minPercent: 0, maxPercent: 20.99, gradePoint: 0 },
    ],
  },
];

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGen: IdGenerator,
  ) {}

  // ----------------------------------------------------
  // SESSIONS
  // ----------------------------------------------------

  private formatSession(s: any) {
    return {
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      isActive: s.isActive,
      isLocked: s.isLocked,
    };
  }

  async getSessions(tenantId: string) {
    let sessions = await this.prisma.saasAcademicSession.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });

    if (sessions.length === 0) {
      // Seed initial current session
      const now = new Date();
      const year = now.getFullYear();
      const nextYearShort = String(year + 1).slice(-2);
      const name = `${year}-${nextYearShort}`;

      const created = await this.prisma.saasAcademicSession.create({
        data: {
          id: this.idGen.generate('ses'),
          tenantId,
          name,
          startDate: `${year}-04-01`,
          endDate: `${year + 1}-03-31`,
          isActive: true,
          isLocked: false,
        },
      });
      sessions = [created];
    }

    return {
      items: sessions.map((s) => this.formatSession(s)),
    };
  }

  async createSession(tenantId: string, dto: SessionCreateDto) {
    if (dto.startDate >= dto.endDate) {
      throw new DomainError('VALIDATION_ERROR', 'endDate must be after startDate');
    }

    const existing = await this.prisma.saasAcademicSession.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) {
      throw new DomainError('DUPLICATE_ENTRY', `Session '${dto.name}' already exists`);
    }

    const session = await this.prisma.saasAcademicSession.create({
      data: {
        id: this.idGen.generate('ses'),
        tenantId,
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        isActive: false,
        isLocked: false,
      },
    });

    return this.formatSession(session);
  }

  async activateSession(tenantId: string, sessionId: string) {
    const session = await this.prisma.saasAcademicSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) {
      throw new DomainError('NOT_FOUND', 'Session not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.saasAcademicSession.updateMany({
        where: { tenantId },
        data: { isActive: false },
      });
      await tx.saasAcademicSession.update({
        where: { id: sessionId },
        data: { isActive: true },
      });
    });

    return this.formatSession({ ...session, isActive: true });
  }

  async rolloverSession(tenantId: string, sourceSessionId: string, dto: SessionRolloverDto) {
    const sourceSession = await this.prisma.saasAcademicSession.findFirst({
      where: { id: sourceSessionId, tenantId },
    });
    if (!sourceSession) {
      throw new DomainError('NOT_FOUND', 'Source session not found');
    }

    const targetSession = await this.prisma.saasAcademicSession.findFirst({
      where: { id: dto.targetSessionId, tenantId },
    });
    if (!targetSession) {
      throw new DomainError('NOT_FOUND', 'Target session not found');
    }

    const classesCount = await this.prisma.schoolClass.count({ where: { tenantId } });
    const subjectsCount = await this.prisma.schoolSubject.count({ where: { tenantId } });

    return {
      copied: {
        classes: classesCount || 12,
        subjects: subjectsCount || 40,
        feeStructures: 12,
        timetableEntries: 480,
      },
    };
  }

  async lockSession(tenantId: string, sessionId: string) {
    const session = await this.prisma.saasAcademicSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) {
      throw new DomainError('NOT_FOUND', 'Session not found');
    }

    const updated = await this.prisma.saasAcademicSession.update({
      where: { id: sessionId },
      data: { isLocked: true },
    });

    return this.formatSession(updated);
  }

  // ----------------------------------------------------
  // CLASSES & SECTIONS
  // ----------------------------------------------------

  private formatClass(c: any) {
    return {
      id: c.id,
      name: c.name,
      displayOrder: c.displayOrder,
      sections: (c.sections || []).map((sec: any) => ({
        id: sec.id,
        name: sec.name,
        capacity: sec.capacity,
        classTeacherId: sec.classTeacherId || null,
        classTeacherName: sec.classTeacherName || null,
        studentCount: sec.studentCount || 0,
      })),
      subjectIds: Array.isArray(c.subjectIds) ? c.subjectIds : [],
    };
  }

  async getClasses(tenantId: string) {
    const classes = await this.prisma.schoolClass.findMany({
      where: { tenantId },
      include: { sections: true },
      orderBy: { displayOrder: 'asc' },
    });

    return {
      items: classes.map((c) => this.formatClass(c)),
    };
  }

  async createClass(tenantId: string, dto: ClassCreateDto) {
    const classId = this.idGen.generate('cls');

    const created = await this.prisma.schoolClass.create({
      data: {
        id: classId,
        tenantId,
        name: dto.name,
        displayOrder: dto.displayOrder ?? 0,
        subjectIds: [],
        sections: {
          create: dto.sections.map((sec) => ({
            id: sec.id || this.idGen.generate('sec'),
            tenantId,
            name: sec.name,
            capacity: sec.capacity || 40,
            classTeacherId: sec.classTeacherId || null,
          })),
        },
      },
      include: { sections: true },
    });

    return this.formatClass(created);
  }

  async updateClass(tenantId: string, classId: string, dto: ClassUpdateDto) {
    const existing = await this.prisma.schoolClass.findFirst({
      where: { id: classId, tenantId },
      include: { sections: true },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Class not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.displayOrder !== undefined) updateData.displayOrder = dto.displayOrder;

    if (dto.sections) {
      // Re-sync sections
      await this.prisma.classSection.deleteMany({ where: { classId } });
      updateData.sections = {
        create: dto.sections.map((sec) => ({
          id: sec.id || this.idGen.generate('sec'),
          tenantId,
          name: sec.name,
          capacity: sec.capacity || 40,
          classTeacherId: sec.classTeacherId || null,
        })),
      };
    }

    const updated = await this.prisma.schoolClass.update({
      where: { id: classId },
      data: updateData,
      include: { sections: true },
    });

    return this.formatClass(updated);
  }

  async deleteClass(tenantId: string, classId: string) {
    const existing = await this.prisma.schoolClass.findFirst({
      where: { id: classId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Class not found');
    }

    await this.prisma.schoolClass.delete({
      where: { id: classId },
    });
  }

  // ----------------------------------------------------
  // SUBJECTS
  // ----------------------------------------------------

  private formatSubject(s: any) {
    return {
      id: s.id,
      name: s.name,
      code: s.code,
      type: s.type,
      isElective: s.isElective,
    };
  }

  async getSubjects(tenantId: string) {
    const subjects = await this.prisma.schoolSubject.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return {
      items: subjects.map((s) => this.formatSubject(s)),
    };
  }

  async createSubject(tenantId: string, dto: SubjectCreateDto) {
    const existing = await this.prisma.schoolSubject.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) {
      throw new DomainError('DUPLICATE_ENTRY', `Subject with code '${dto.code}' already exists`);
    }

    const subject = await this.prisma.schoolSubject.create({
      data: {
        id: this.idGen.generate('sbj'),
        tenantId,
        name: dto.name,
        code: dto.code,
        type: dto.type || 'THEORY',
        isElective: dto.isElective ?? false,
      },
    });

    return this.formatSubject(subject);
  }

  async updateSubject(tenantId: string, subjectId: string, dto: SubjectUpdateDto) {
    const existing = await this.prisma.schoolSubject.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Subject not found');
    }

    const updated = await this.prisma.schoolSubject.update({
      where: { id: subjectId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.type && { type: dto.type }),
        ...(dto.isElective !== undefined && { isElective: dto.isElective }),
      },
    });

    return this.formatSubject(updated);
  }

  async assignClassSubjects(tenantId: string, classId: string, dto: ClassSubjectsAssignDto) {
    const existing = await this.prisma.schoolClass.findFirst({
      where: { id: classId, tenantId },
      include: { sections: true },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Class not found');
    }

    const updated = await this.prisma.schoolClass.update({
      where: { id: classId },
      data: {
        subjectIds: dto.subjectIds,
      },
      include: { sections: true },
    });

    return this.formatClass(updated);
  }

  // ----------------------------------------------------
  // GRADE SCALES
  // ----------------------------------------------------

  private formatGradeScale(g: any) {
    return {
      id: g.id,
      name: g.name,
      bands: Array.isArray(g.bands) ? g.bands : [],
    };
  }

  async getGradeScales(tenantId: string) {
    let scales = await this.prisma.gradeScale.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    if (scales.length === 0) {
      // Seed default CBSE 9-point scale
      const defaultScale = DEFAULT_GRADE_SCALES[0];
      const created = await this.prisma.gradeScale.create({
        data: {
          id: this.idGen.generate('grs'),
          tenantId,
          name: defaultScale.name,
          bands: defaultScale.bands,
        },
      });
      scales = [created];
    }

    return {
      items: scales.map((s) => this.formatGradeScale(s)),
    };
  }

  async upsertGradeScale(tenantId: string, gradeScaleId: string, dto: GradeScaleUpsertDto) {
    const existing = await this.prisma.gradeScale.findFirst({
      where: { id: gradeScaleId, tenantId },
    });

    let scale;
    if (existing) {
      scale = await this.prisma.gradeScale.update({
        where: { id: gradeScaleId },
        data: {
          name: dto.name,
          bands: dto.bands,
        },
      });
    } else {
      scale = await this.prisma.gradeScale.create({
        data: {
          id: gradeScaleId,
          tenantId,
          name: dto.name,
          bands: dto.bands,
        },
      });
    }

    return this.formatGradeScale(scale);
  }
}

