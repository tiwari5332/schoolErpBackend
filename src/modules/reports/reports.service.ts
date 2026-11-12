import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { createPaginationMeta } from '../../common/pagination.util';
import { ReportDataRunDto, ReportExportJobDto } from './dto/reports.dto';

export const REPORT_CATALOG_ITEMS = [
  {
    key: 'students-roster',
    name: 'Student Enrolment Roster',
    module: 'students',
    description: 'Comprehensive student master list by class and section',
    permission: 'reports.view',
    supportedFormats: ['xlsx', 'csv', 'pdf'],
  },
  {
    key: 'staff-directory',
    name: 'Staff & Faculty Directory',
    module: 'staff',
    description: 'Faculty list with designation, department and joining date',
    permission: 'reports.view',
    supportedFormats: ['xlsx', 'csv', 'pdf'],
  },
  {
    key: 'attendance-monthly',
    name: 'Monthly Attendance Register',
    module: 'attendance',
    description: 'Monthly student/staff attendance rates and percentage',
    permission: 'reports.view',
    supportedFormats: ['xlsx', 'csv', 'pdf'],
  },
  {
    key: 'fee-collection',
    name: 'Fee Collection & Defaulters Register',
    module: 'fees',
    description: 'Collection register and outstanding dues report',
    permission: 'reports.view',
    supportedFormats: ['xlsx', 'csv', 'pdf'],
  },
  {
    key: 'exam-tabulation',
    name: 'Examination Tabulation Register',
    module: 'exams',
    description: 'Consolidated marks, grades and ranks by exam',
    permission: 'reports.view',
    supportedFormats: ['xlsx', 'csv', 'pdf'],
  },
];

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  async getCatalog(tenantId: string) {
    return {
      items: REPORT_CATALOG_ITEMS,
    };
  }

  async runReport(tenantId: string, reportKey: string, dto: ReportDataRunDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 50;
    const skip = (page - 1) * pageSize;

    if (reportKey === 'fee-collection') {
      const payments = await this.prisma.saasFeePayment.findMany({
        where: { tenantId },
        orderBy: { paidAt: 'desc' },
        skip,
        take: pageSize,
      });
      const total = await this.prisma.saasFeePayment.count({ where: { tenantId } });

      return {
        title: 'Fee Collection Register',
        generatedAt: this.clock.now().toISOString(),
        filtersApplied: Object.entries(dto.filters || {}).map(([key, value]) => ({ key, value })),
        columns: [
          { key: 'receiptNo', label: 'Receipt No', type: 'string' },
          { key: 'studentName', label: 'Student Name', type: 'string' },
          { key: 'className', label: 'Class', type: 'string' },
          { key: 'amount', label: 'Amount', type: 'currency' },
          { key: 'mode', label: 'Mode', type: 'string' },
          { key: 'paidAt', label: 'Date', type: 'date' },
        ],
        rows: payments.map((p) => ({
          receiptNo: p.receiptNo,
          studentName: p.studentName,
          className: p.className,
          amount: p.amount,
          mode: p.mode,
          paidAt: p.paidAt.toISOString().split('T')[0],
        })),
        totals: {
          amount: payments.reduce((sum, p) => sum + p.amount, 0),
        },
        meta: createPaginationMeta(page, pageSize, total),
      };
    }

    // Default: Students roster
    const students = await this.prisma.saasStudent.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { rollNo: 'asc' },
      skip,
      take: pageSize,
    });
    const total = await this.prisma.saasStudent.count({ where: { tenantId, status: 'ACTIVE' } });

    return {
      title: 'Student Enrolment Roster',
      generatedAt: this.clock.now().toISOString(),
      filtersApplied: Object.entries(dto.filters || {}).map(([key, value]) => ({ key, value })),
      columns: [
        { key: 'admissionNo', label: 'Admission No', type: 'string' },
        { key: 'name', label: 'Full Name', type: 'string' },
        { key: 'className', label: 'Class', type: 'string' },
        { key: 'sectionName', label: 'Section', type: 'string' },
        { key: 'gender', label: 'Gender', type: 'string' },
        { key: 'feeDue', label: 'Fee Due', type: 'currency' },
      ],
      rows: students.map((s) => ({
        admissionNo: s.admissionNo,
        name: s.fullName,
        className: s.className,
        sectionName: s.sectionName,
        gender: s.gender,
        feeDue: Number(s.feeDue),
      })),
      totals: {
        totalStudents: students.length,
      },
      meta: createPaginationMeta(page, pageSize, total),
    };
  }

  async createExportJob(tenantId: string, reportKey: string, dto: ReportExportJobDto) {
    const jobId = this.idGen.generate('job');
    return {
      jobId,
      status: 'QUEUED',
    };
  }

  async getExportStatus(tenantId: string, jobId: string) {
    const expiry = new Date(this.clock.now().getTime() + 24 * 60 * 60 * 1000);
    return {
      jobId,
      status: 'COMPLETED',
      progress: 100,
      downloadUrl: `https://storage.edutrio.internal/${tenantId}/exports/${jobId}.xlsx`,
      expiresAt: expiry.toISOString(),
    };
  }
}

