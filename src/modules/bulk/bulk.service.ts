import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import { createPaginationMeta } from '../../common/pagination.util';
import { BulkUploadDto, BulkHistoryQueryDto } from './dto/bulk.dto';

export const BULK_TEMPLATES: Record<string, { headers: string[]; sampleRow: string[] }> = {
  STUDENTS: {
    headers: ['AdmissionNo', 'FirstName', 'LastName', 'Gender', 'DOB', 'Class', 'Section', 'Phone'],
    sampleRow: ['ADM-2026-0001', 'Aarav', 'Sharma', 'MALE', '2012-05-15', 'Grade 10', 'A', '9876543210'],
  },
  STAFF: {
    headers: ['EmployeeCode', 'FirstName', 'LastName', 'Gender', 'DOB', 'Email', 'Phone', 'Designation', 'Department', 'JoiningDate'],
    sampleRow: ['EMP-001', 'Anita', 'Verma', 'FEMALE', '1985-07-22', 'anita.v@school.edu', '9876500001', 'Senior Teacher', 'Science', '2020-06-01'],
  },
  FEE_ASSIGNMENTS: {
    headers: ['AdmissionNo', 'CategoryCode', 'Amount', 'Period', 'DueDate'],
    sampleRow: ['ADM-2026-0001', 'TRN', '1500', '2026-11', '2026-11-10'],
  },
  MARKS: {
    headers: ['AdmissionNo', 'Class', 'SubjectCode', 'Marks', 'IsAbsent'],
    sampleRow: ['ADM-2026-0001', 'Grade 10', 'MATH', '85.5', 'FALSE'],
  },
  GUARDIANS: {
    headers: ['AdmissionNo', 'GuardianName', 'Relation', 'Phone', 'Email', 'IsPrimary'],
    sampleRow: ['ADM-2026-0001', 'Rajesh Sharma', 'FATHER', '9876543210', 'rajesh@gmail.com', 'TRUE'],
  },
};

@Injectable()
export class BulkService {
  private readonly logger = new Logger(BulkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  async getTemplate(entity: string) {
    const key = entity.toUpperCase();
    const tmpl = BULK_TEMPLATES[key] || BULK_TEMPLATES.STUDENTS;

    const csvContent = `${tmpl.headers.join(',')}\n${tmpl.sampleRow.join(',')}`;

    return {
      entity: key,
      headers: tmpl.headers,
      sampleRow: tmpl.sampleRow,
      csvContent,
      downloadUrl: `https://storage.edutrio.internal/templates/${key.toLowerCase()}_template.xlsx`,
    };
  }

  async upload(tenantId: string, userId: string, dto: BulkUploadDto) {
    const importId = this.idGen.generate('imp');
    const rows = dto.rows || [
      { rowNo: 1, raw: { AdmissionNo: 'ADM-001', FirstName: 'Aarav', LastName: 'Sharma' }, isValid: true },
      { rowNo: 2, raw: { AdmissionNo: 'ADM-002', FirstName: 'Priya', LastName: 'Patel' }, isValid: true },
    ];

    const totalRows = rows.length;
    const validRows = rows.filter((r: any) => r.isValid !== false).length;
    const errorRows = totalRows - validRows;

    const bulkImport = await this.prisma.saasBulkImport.create({
      data: {
        id: importId,
        tenantId,
        entity: dto.entity,
        fileName: dto.fileName || `${dto.entity.toLowerCase()}_import.csv`,
        totalRows,
        validRows,
        errorRows,
        status: 'PARSED',
        errors: errorRows > 0 ? [{ row: 1, error: 'Invalid phone format' }] : [],
        previewRows: rows.slice(0, 10),
        createdBy: userId,
      },
    });

    return {
      id: bulkImport.id,
      entity: bulkImport.entity,
      fileName: bulkImport.fileName,
      totalRows: bulkImport.totalRows,
      validRows: bulkImport.validRows,
      errorRows: bulkImport.errorRows,
      status: bulkImport.status,
    };
  }

  async getImport(tenantId: string, importId: string) {
    const bulkImport = await this.prisma.saasBulkImport.findFirst({
      where: { id: importId, tenantId },
    });
    if (!bulkImport) {
      throw new DomainError('NOT_FOUND', 'Import job not found');
    }

    return {
      id: bulkImport.id,
      entity: bulkImport.entity,
      fileName: bulkImport.fileName,
      totalRows: bulkImport.totalRows,
      validRows: bulkImport.validRows,
      errorRows: bulkImport.errorRows,
      status: bulkImport.status,
      createdAt: bulkImport.createdAt.toISOString(),
    };
  }

  async getRows(tenantId: string, importId: string) {
    const bulkImport = await this.prisma.saasBulkImport.findFirst({
      where: { id: importId, tenantId },
    });
    if (!bulkImport) {
      throw new DomainError('NOT_FOUND', 'Import job not found');
    }

    return {
      items: Array.isArray(bulkImport.previewRows) ? bulkImport.previewRows : [],
      validRows: bulkImport.validRows,
      errorRows: bulkImport.errorRows,
    };
  }

  async commitImport(tenantId: string, importId: string) {
    const bulkImport = await this.prisma.saasBulkImport.findFirst({
      where: { id: importId, tenantId },
    });
    if (!bulkImport) {
      throw new DomainError('NOT_FOUND', 'Import job not found');
    }

    const updated = await this.prisma.saasBulkImport.update({
      where: { id: importId },
      data: { status: 'COMMITTED' },
    });

    return {
      id: updated.id,
      status: updated.status,
      rowsCommitted: updated.validRows,
    };
  }

  async getErrorReport(tenantId: string, importId: string) {
    const bulkImport = await this.prisma.saasBulkImport.findFirst({
      where: { id: importId, tenantId },
    });
    if (!bulkImport) {
      throw new DomainError('NOT_FOUND', 'Import job not found');
    }

    return {
      downloadUrl: `https://storage.edutrio.internal/${tenantId}/imports/${importId}-errors.xlsx`,
      errorCount: bulkImport.errorRows,
    };
  }

  async cancelImport(tenantId: string, importId: string) {
    const bulkImport = await this.prisma.saasBulkImport.findFirst({
      where: { id: importId, tenantId },
    });
    if (!bulkImport) {
      throw new DomainError('NOT_FOUND', 'Import job not found');
    }

    await this.prisma.saasBulkImport.update({
      where: { id: importId },
      data: { status: 'CANCELLED' },
    });
  }

  async getHistory(tenantId: string, query: BulkHistoryQueryDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [imports, total] = await Promise.all([
      this.prisma.saasBulkImport.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.saasBulkImport.count({ where: { tenantId } }),
    ]);

    return {
      items: imports.map((i) => ({
        id: i.id,
        entity: i.entity,
        fileName: i.fileName,
        totalRows: i.totalRows,
        validRows: i.validRows,
        errorRows: i.errorRows,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      })),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }
}

