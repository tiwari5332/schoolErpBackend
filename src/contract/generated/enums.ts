// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
export const ContractEnums = {
  "roleKey": [
    "PLATFORM_OWNER",
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "RECEPTIONIST",
    "PARENT",
    "STUDENT",
    "CUSTOM"
  ],
  "gender": [
    "MALE",
    "FEMALE",
    "OTHER"
  ],
  "studentStatus": [
    "ACTIVE",
    "INACTIVE",
    "TRANSFERRED",
    "ALUMNI",
    "SUSPENDED"
  ],
  "staffStatus": [
    "ACTIVE",
    "ON_LEAVE",
    "RESIGNED",
    "TERMINATED"
  ],
  "attendanceStatus": [
    "PRESENT",
    "ABSENT",
    "LATE",
    "HALF_DAY",
    "LEAVE",
    "HOLIDAY"
  ],
  "leaveStatus": [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "CANCELLED"
  ],
  "leaveType": [
    "CASUAL",
    "SICK",
    "EARNED",
    "UNPAID",
    "MATERNITY",
    "OTHER"
  ],
  "examStatus": [
    "DRAFT",
    "SCHEDULED",
    "MARKS_ENTRY",
    "MARKS_LOCKED",
    "PUBLISHED"
  ],
  "paymentMode": [
    "CASH",
    "UPI",
    "CARD",
    "CHEQUE",
    "BANK_TRANSFER",
    "ONLINE"
  ],
  "feeFrequency": [
    "ONE_TIME",
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY"
  ],
  "feeLineStatus": [
    "PENDING",
    "PARTIAL",
    "PAID",
    "WAIVED",
    "OVERDUE"
  ],
  "noticeAudience": [
    "ALL",
    "STAFF",
    "PARENTS",
    "STUDENTS",
    "CLASS",
    "SECTION",
    "INDIVIDUAL"
  ],
  "channel": [
    "IN_APP",
    "EMAIL",
    "SMS",
    "WHATSAPP",
    "PUSH"
  ],
  "tenantStatus": [
    "TRIAL",
    "ACTIVE",
    "PAST_DUE",
    "SUSPENDED",
    "CANCELLED"
  ],
  "billingCycle": [
    "MONTHLY",
    "YEARLY"
  ],
  "importStatus": [
    "UPLOADED",
    "VALIDATING",
    "VALIDATED",
    "VALIDATED_WITH_ERRORS",
    "COMMITTING",
    "COMPLETED",
    "FAILED",
    "CANCELLED"
  ],
  "importEntity": [
    "STUDENTS",
    "STAFF",
    "FEE_ASSIGNMENTS",
    "MARKS",
    "GUARDIANS"
  ],
  "approvalType": [
    "LEAVE",
    "FEE_CONCESSION",
    "FEE_REFUND",
    "FEE_WAIVER",
    "STUDENT_TC",
    "EXAM_PUBLISH",
    "ROLE_CHANGE"
  ],
  "approvalStatus": [
    "PENDING",
    "APPROVED",
    "REJECTED"
  ],
  "calendarEventType": [
    "EVENT",
    "HOLIDAY",
    "EXAM",
    "PTM",
    "ACTIVITY"
  ],
  "exportFormat": [
    "xlsx",
    "pdf",
    "csv"
  ]
} as const;

export const ErrorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "TOKEN_EXPIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "DUPLICATE_ENTRY",
  "SUBSCRIPTION_EXPIRED",
  "PLAN_LIMIT_REACHED",
  "SESSION_LOCKED",
  "EXAM_PUBLISHED_LOCKED",
  "MARKS_LOCKED",
  "TIMETABLE_CONFLICT",
  "PAYMENT_FAILED",
  "IMPORT_VALIDATION_FAILED",
  "RATE_LIMITED",
  "NETWORK_ERROR",
  "INTERNAL_ERROR"
] as const;
export type ErrorCode = typeof ErrorCodes[number];

export const PermissionKeys = [
  "dashboard.view",
  "students.view",
  "students.create",
  "students.update",
  "students.delete",
  "students.import",
  "students.promote",
  "staff.view",
  "staff.create",
  "staff.update",
  "staff.delete",
  "staff.import",
  "attendance.student.view",
  "attendance.student.mark",
  "attendance.staff.view",
  "attendance.staff.mark",
  "leave.apply",
  "leave.approve",
  "academic.view",
  "academic.manage",
  "timetable.view",
  "timetable.manage",
  "exams.view",
  "exams.create",
  "exams.marks.enter",
  "exams.marks.lock",
  "exams.publish",
  "fees.view",
  "fees.manage",
  "fees.collect",
  "fees.concession",
  "fees.refund",
  "communication.view",
  "communication.send",
  "roles.manage",
  "users.manage",
  "reports.view",
  "reports.export",
  "settings.manage",
  "subscription.manage",
  "audit.view",
  "approvals.decide"
] as const;
export type PermissionKey = typeof PermissionKeys[number];

export type RoleKey = typeof ContractEnums["roleKey"][number];
export type Gender = typeof ContractEnums["gender"][number];
export type StudentStatus = typeof ContractEnums["studentStatus"][number];
export type StaffStatus = typeof ContractEnums["staffStatus"][number];
export type AttendanceStatus = typeof ContractEnums["attendanceStatus"][number];
export type LeaveStatus = typeof ContractEnums["leaveStatus"][number];
export type LeaveType = typeof ContractEnums["leaveType"][number];
export type ExamStatus = typeof ContractEnums["examStatus"][number];
export type PaymentMode = typeof ContractEnums["paymentMode"][number];
export type FeeFrequency = typeof ContractEnums["feeFrequency"][number];
export type FeeLineStatus = typeof ContractEnums["feeLineStatus"][number];
export type NoticeAudience = typeof ContractEnums["noticeAudience"][number];
export type Channel = typeof ContractEnums["channel"][number];
export type TenantStatus = typeof ContractEnums["tenantStatus"][number];
export type BillingCycle = typeof ContractEnums["billingCycle"][number];
export type ImportStatus = typeof ContractEnums["importStatus"][number];
export type ImportEntity = typeof ContractEnums["importEntity"][number];
export type ApprovalType = typeof ContractEnums["approvalType"][number];
export type ApprovalStatus = typeof ContractEnums["approvalStatus"][number];
export type CalendarEventType = typeof ContractEnums["calendarEventType"][number];
export type ExportFormat = typeof ContractEnums["exportFormat"][number];
