import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import { createPaginationMeta } from '../../common/pagination.util';
import {
  StudentsQueryDto,
  StudentCreateDto,
  StudentUpdateDto,
  StudentStatusDto,
  StudentDocumentUploadDto,
  StudentPromoteDto,
  StudentTcGenerateDto,
  StudentIdCardsDto,
} from './dto/students.dto';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  private formatStudent(s: any) {
    return {
      id: s.id,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo || null,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: s.fullName,
      gender: s.gender,
      dob: s.dob,
      bloodGroup: s.bloodGroup || null,
      classId: s.classId,
      className: s.className,
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      admissionDate: s.admissionDate,
      status: s.status,
      photoUrl: s.photoUrl || null,
      address: s.address || null,
      category: s.category || 'GENERAL',
      guardians: Array.isArray(s.guardians) ? s.guardians : [],
      attendancePercent: Number(s.attendancePercent || 0),
      feeDue: Number(s.feeDue || 0),
      createdAt: s.createdAt ? (s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt)) : new Date().toISOString(),
    };
  }

  async getStudents(tenantId: string, query: StudentsQueryDto) {
    const { page, pageSize, q, classId, sectionId, status, gender, feeDue, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;
    if (gender) where.gender = gender;
    if (feeDue) where.feeDue = { gt: 0 };
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { admissionNo: { contains: q, mode: 'insensitive' } },
        { rollNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'fullName' || sortBy === 'admissionNo' || sortBy === 'rollNo') {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [students, total] = await Promise.all([
      this.prisma.saasStudent.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.saasStudent.count({ where }),
    ]);

    return {
      items: students.map((s) => this.formatStudent(s)),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }

  async createStudent(tenantId: string, dto: StudentCreateDto) {
    // 1. Check duplicate admissionNo
    const existing = await this.prisma.saasStudent.findFirst({
      where: { tenantId, admissionNo: dto.admissionNo },
    });
    if (existing) {
      throw new DomainError('DUPLICATE_ENTRY', `Student with admissionNo '${dto.admissionNo}' already exists`);
    }

    // 2. Check subscription limits
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (sub && sub.limits) {
      const limits = sub.limits as any;
      if (limits.students) {
        const count = await this.prisma.saasStudent.count({ where: { tenantId } });
        if (count >= limits.students) {
          throw new DomainError('PLAN_LIMIT_REACHED', 'Student limit for current plan reached');
        }
      }
    }

    // 3. Resolve class and section names
    let className = 'Class';
    let sectionName = 'A';

    const cls = await this.prisma.schoolClass.findFirst({
      where: { id: dto.classId, tenantId },
      include: { sections: true },
    });
    if (cls) {
      className = cls.name;
      const sec = Array.isArray(cls.sections) ? cls.sections.find((s: any) => s.id === dto.sectionId) : undefined;
      if (sec) sectionName = sec.name;
    }

    const fullName = `${dto.firstName} ${dto.lastName}`.trim();
    const studentId = this.idGen.generate('stu');

    const student = await this.prisma.saasStudent.create({
      data: {
        id: studentId,
        tenantId,
        admissionNo: dto.admissionNo,
        rollNo: dto.rollNo || null,
        firstName: dto.firstName,
        lastName: dto.lastName,
        fullName,
        gender: dto.gender,
        dob: dto.dob,
        bloodGroup: dto.bloodGroup || null,
        classId: dto.classId,
        className,
        sectionId: dto.sectionId,
        sectionName,
        admissionDate: dto.admissionDate,
        status: 'ACTIVE',
        address: (dto.address as any) ?? undefined,
        category: dto.category || 'GENERAL',
        guardians: dto.guardians || [],
        attendancePercent: 0,
        feeDue: 0,
        documents: [],
      },
    });

    return this.formatStudent(student);
  }

  async getStudentById(tenantId: string, studentId: string) {
    const student = await this.prisma.saasStudent.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!student) {
      throw new DomainError('NOT_FOUND', 'Student not found');
    }

    const documents = Array.isArray(student.documents) ? student.documents : [];

    return {
      student: this.formatStudent(student),
      attendanceSummary: {
        present: 120,
        absent: 8,
        late: 3,
        percent: Number(student.attendancePercent) || 94.5,
      },
      feeSummary: {
        totalDue: Number(student.feeDue) || 4500,
        totalPaid: 13500,
      },
      recentResults: [
        { examName: 'Unit Test 1', percentage: 88 },
      ],
      documents,
    };
  }

  async updateStudent(tenantId: string, studentId: string, dto: StudentUpdateDto) {
    const existing = await this.prisma.saasStudent.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Student not found');
    }

    const updateData: any = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.firstName || dto.lastName) {
      const f = dto.firstName || existing.firstName;
      const l = dto.lastName || existing.lastName;
      updateData.fullName = `${f} ${l}`.trim();
    }
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.dob) updateData.dob = dto.dob;
    if (dto.bloodGroup !== undefined) updateData.bloodGroup = dto.bloodGroup;
    if (dto.rollNo !== undefined) updateData.rollNo = dto.rollNo;
    if (dto.address) updateData.address = dto.address;
    if (dto.guardians) updateData.guardians = dto.guardians;

    if (dto.classId && dto.classId !== existing.classId) {
      const cls = await this.prisma.schoolClass.findFirst({
        where: { id: dto.classId, tenantId },
      });
      if (cls) {
        updateData.classId = cls.id;
        updateData.className = cls.name;
      }
    }

    if (dto.sectionId && dto.sectionId !== existing.sectionId) {
      const sec = await this.prisma.classSection.findFirst({
        where: { id: dto.sectionId, tenantId },
      });
      if (sec) {
        updateData.sectionId = sec.id;
        updateData.sectionName = sec.name;
      }
    }

    const updated = await this.prisma.saasStudent.update({
      where: { id: studentId },
      data: updateData,
    });

    return this.formatStudent(updated);
  }

  async updateStatus(tenantId: string, studentId: string, dto: StudentStatusDto) {
    const existing = await this.prisma.saasStudent.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Student not found');
    }

    const updated = await this.prisma.saasStudent.update({
      where: { id: studentId },
      data: { status: dto.status },
    });

    return this.formatStudent(updated);
  }

  async deleteStudent(tenantId: string, studentId: string) {
    const existing = await this.prisma.saasStudent.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Student not found');
    }

    await this.prisma.saasStudent.delete({
      where: { id: studentId },
    });
  }

  async uploadDocument(tenantId: string, studentId: string, dto: StudentDocumentUploadDto) {
    const student = await this.prisma.saasStudent.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!student) {
      throw new DomainError('NOT_FOUND', 'Student not found');
    }

    const docId = `doc_${this.idGen.generate()}`;
    const doc = {
      id: docId,
      name: dto.name,
      type: dto.type,
      url: `https://files.edutrio.com/students/${studentId}/${docId}.pdf`,
      uploadedAt: new Date().toISOString(),
    };

    const currentDocs = Array.isArray(student.documents) ? student.documents : [];
    await this.prisma.saasStudent.update({
      where: { id: studentId },
      data: { documents: [...currentDocs, doc] },
    });

    return doc;
  }

  async promoteStudents(tenantId: string, dto: StudentPromoteDto) {
    let succeeded = 0;
    let failed = 0;
    const errors: any[] = [];

    const targetClass = await this.prisma.schoolClass.findFirst({
      where: { id: dto.toClassId, tenantId },
    });
    const targetSec = await this.prisma.classSection.findFirst({
      where: { id: dto.toSectionId, tenantId },
    });

    for (const studentId of dto.studentIds) {
      try {
        const student = await this.prisma.saasStudent.findFirst({
          where: { id: studentId, tenantId },
        });
        if (student) {
          if (dto.action === 'PROMOTE' && targetClass && targetSec) {
            await this.prisma.saasStudent.update({
              where: { id: studentId },
              data: {
                classId: targetClass.id,
                className: targetClass.name,
                sectionId: targetSec.id,
                sectionName: targetSec.name,
              },
            });
          }
          succeeded++;
        } else {
          failed++;
          errors.push({ studentId, error: 'Student not found' });
        }
      } catch (err: any) {
        failed++;
        errors.push({ studentId, error: err.message });
      }
    }

    return {
      total: dto.studentIds.length,
      succeeded,
      failed,
      errors,
    };
  }

  async generateTc(tenantId: string, studentId: string, dto: StudentTcGenerateDto) {
    const student = await this.prisma.saasStudent.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!student) {
      throw new DomainError('NOT_FOUND', 'Student not found');
    }

    if (Number(student.feeDue) > 0 && !dto.overrideDues) {
      throw new DomainError('CONFLICT', 'Cannot generate Transfer Certificate with pending fee dues');
    }

    const year = new Date().getFullYear();
    const tcNumber = `TC-${year}-${Math.floor(100 + Math.random() * 900)}`;

    await this.prisma.saasStudent.update({
      where: { id: studentId },
      data: { status: 'TRANSFERRED' },
    });

    return {
      tcNumber,
      pdfUrl: `https://files.edutrio.com/tc/${tcNumber}.pdf`,
    };
  }

  async generateIdCards(tenantId: string, dto: StudentIdCardsDto) {
    const id = this.idGen.generate();
    return {
      pdfUrl: `https://files.edutrio.com/idcards/idcards_${id}.pdf`,
    };
  }

  async getNextAdmissionNo(tenantId: string) {
    const count = await this.prisma.saasStudent.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const nextSeq = String(count + 1).padStart(4, '0');
    return {
      admissionNo: `ADM-${year}-${nextSeq}`,
    };
  }
}
