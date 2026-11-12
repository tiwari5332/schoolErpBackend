// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
export type EndpointId =
  | "AUTH_LOGIN"
  | "AUTH_REFRESH"
  | "AUTH_LOGOUT"
  | "AUTH_ME"
  | "AUTH_FORGOT_PASSWORD"
  | "AUTH_RESET_PASSWORD"
  | "AUTH_CHANGE_PASSWORD"
  | "AUTH_UPDATE_PROFILE"
  | "PLANS_LIST"
  | "TENANT_REGISTER"
  | "ONBOARDING_STATUS"
  | "ONBOARDING_DISMISS"
  | "SUBSCRIPTION_GET"
  | "SUBSCRIPTION_CHECKOUT"
  | "SUBSCRIPTION_CONFIRM"
  | "SUBSCRIPTION_CHANGE_PLAN"
  | "SUBSCRIPTION_CANCEL"
  | "SUBSCRIPTION_INVOICES"
  | "PLATFORM_METRICS"
  | "PLATFORM_TENANTS_LIST"
  | "PLATFORM_TENANT_STATUS"
  | "PLATFORM_PLAN_CREATE"
  | "PLATFORM_PLAN_UPDATE"
  | "DASH_KPI_STUDENTS"
  | "DASH_KPI_STAFF"
  | "DASH_KPI_FEES_TODAY"
  | "DASH_KPI_ATTENDANCE"
  | "DASH_QUICK_ACTIONS"
  | "DASH_FEE_TREND"
  | "DASH_ATTENDANCE_TREND"
  | "DASH_PENDING_APPROVALS"
  | "APPROVAL_DECIDE"
  | "APPROVALS_LIST"
  | "CALENDAR_EVENTS"
  | "CALENDAR_UPCOMING"
  | "CALENDAR_EVENT_CREATE"
  | "CALENDAR_EVENT_UPDATE"
  | "CALENDAR_EVENT_DELETE"
  | "GLOBAL_SEARCH"
  | "NOTIFICATIONS_LIST"
  | "NOTIFICATION_READ"
  | "NOTIFICATIONS_READ_ALL"
  | "SESSIONS_LIST"
  | "SESSION_CREATE"
  | "SESSION_ACTIVATE"
  | "SESSION_ROLLOVER"
  | "SESSION_LOCK"
  | "CLASSES_LIST"
  | "CLASS_CREATE"
  | "CLASS_UPDATE"
  | "CLASS_DELETE"
  | "SUBJECTS_LIST"
  | "SUBJECT_CREATE"
  | "SUBJECT_UPDATE"
  | "CLASS_SUBJECTS_ASSIGN"
  | "GRADE_SCALES_LIST"
  | "GRADE_SCALE_UPSERT"
  | "STUDENTS_LIST"
  | "STUDENT_CREATE"
  | "STUDENT_GET"
  | "STUDENT_UPDATE"
  | "STUDENT_STATUS"
  | "STUDENT_DELETE"
  | "STUDENT_DOCUMENT_UPLOAD"
  | "STUDENT_PROMOTE"
  | "STUDENT_TC_GENERATE"
  | "STUDENT_ID_CARDS"
  | "STUDENT_NEXT_ADMISSION_NO"
  | "STAFF_LIST"
  | "STAFF_CREATE"
  | "STAFF_GET"
  | "STAFF_UPDATE"
  | "STAFF_STATUS"
  | "STAFF_DELETE"
  | "LEAVE_APPLY"
  | "LEAVES_LIST"
  | "LEAVE_DECIDE"
  | "LEAVE_CANCEL"
  | "ATT_STUDENT_GET"
  | "ATT_STUDENT_MARK"
  | "ATT_STUDENT_SUMMARY"
  | "ATT_STUDENT_MONTHLY"
  | "ATT_STAFF_GET"
  | "ATT_STAFF_MARK"
  | "ATT_STAFF_SELF_CHECKIN"
  | "ATT_STAFF_MONTHLY"
  | "PERIODS_GET"
  | "PERIODS_PUT"
  | "TIMETABLE_BY_CLASS"
  | "TIMETABLE_BY_TEACHER"
  | "TIMETABLE_ENTRY_UPSERT"
  | "TIMETABLE_ENTRY_DELETE"
  | "TIMETABLE_SUBSTITUTE"
  | "TIMETABLE_FREE_TEACHERS"
  | "EXAMS_LIST"
  | "EXAM_CREATE"
  | "EXAM_GET"
  | "EXAM_UPDATE"
  | "EXAM_DELETE"
  | "EXAM_MARKS_GET"
  | "EXAM_MARKS_SAVE"
  | "EXAM_MARKS_LOCK"
  | "EXAM_MARKS_UNLOCK"
  | "EXAM_MARKS_IMPORT"
  | "EXAM_PUBLISH"
  | "EXAM_UNPUBLISH"
  | "EXAM_RESULTS"
  | "REPORT_CARD_GET"
  | "REPORT_CARD_PDF_BULK"
  | "ADMIT_CARDS_PDF"
  | "PORTAL_RESULTS"
  | "FEE_CATEGORIES_LIST"
  | "FEE_CATEGORY_CREATE"
  | "FEE_STRUCTURES_LIST"
  | "FEE_STRUCTURE_CREATE"
  | "FEE_STRUCTURE_UPDATE"
  | "FEE_ASSIGN_STUDENT"
  | "FEE_STUDENT_LEDGER"
  | "FEE_COLLECT"
  | "FEE_PAYMENTS_LIST"
  | "FEE_RECEIPT"
  | "FEE_PAYMENT_REFUND"
  | "FEE_CONCESSION"
  | "FEE_DUES"
  | "FEE_REMINDERS_SEND"
  | "FEE_SUMMARY"
  | "FEE_ONLINE_INITIATE"
  | "FEE_ONLINE_CONFIRM"
  | "NOTICES_LIST"
  | "NOTICE_CREATE"
  | "NOTICE_GET"
  | "NOTICE_DELETE"
  | "NOTICE_RECIPIENT_COUNT"
  | "TEMPLATES_LIST"
  | "TEMPLATE_UPSERT"
  | "THREADS_LIST"
  | "THREAD_CREATE"
  | "THREAD_MESSAGES"
  | "THREAD_SEND"
  | "THREAD_READ"
  | "PORTAL_NOTICES"
  | "ROLES_LIST"
  | "ROLE_CREATE"
  | "ROLE_UPDATE"
  | "ROLE_DELETE"
  | "PERMISSIONS_CATALOG"
  | "USERS_LIST"
  | "USER_INVITE"
  | "USER_UPDATE"
  | "USER_STATUS"
  | "USER_RESET_PASSWORD"
  | "INVITE_ACCEPT"
  | "REPORTS_CATALOG"
  | "REPORT_DATA"
  | "REPORT_EXPORT_JOB"
  | "REPORT_EXPORT_STATUS"
  | "BULK_TEMPLATE"
  | "BULK_UPLOAD"
  | "BULK_GET"
  | "BULK_ROWS"
  | "BULK_COMMIT"
  | "BULK_ERROR_REPORT"
  | "BULK_CANCEL"
  | "BULK_HISTORY"
  | "SCHOOL_PROFILE_GET"
  | "SCHOOL_PROFILE_UPDATE"
  | "PREFERENCES_GET"
  | "PREFERENCES_UPDATE"
  | "FILE_UPLOAD"
  | "AUDIT_LOGS"
  | "PORTAL_CHILDREN"
  | "PORTAL_OVERVIEW"
  | "PORTAL_ATTENDANCE"
  | "PORTAL_FEES"
  | "PORTAL_LEAVE_APPLY";

export interface RouteMeta {
  id: EndpointId;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  auth: boolean;
  permission: string | null;
  summary: string;
  errors: string[];
}

export const CONTRACT_ROUTES: Record<EndpointId, RouteMeta> = {
  "AUTH_LOGIN": {
    id: "AUTH_LOGIN",
    method: "POST",
    path: "/auth/login",
    auth: false,
    permission: null,
    summary: "Login with email/phone + password",
    errors: ["VALIDATION_ERROR","UNAUTHENTICATED","SUBSCRIPTION_EXPIRED","RATE_LIMITED"],
  },
  "AUTH_REFRESH": {
    id: "AUTH_REFRESH",
    method: "POST",
    path: "/auth/refresh",
    auth: false,
    permission: null,
    summary: "Rotate tokens",
    errors: ["TOKEN_EXPIRED","UNAUTHENTICATED"],
  },
  "AUTH_LOGOUT": {
    id: "AUTH_LOGOUT",
    method: "POST",
    path: "/auth/logout",
    auth: true,
    permission: null,
    summary: "Invalidate refresh token",
    errors: [],
  },
  "AUTH_ME": {
    id: "AUTH_ME",
    method: "GET",
    path: "/auth/me",
    auth: true,
    permission: null,
    summary: "Current user, tenant, permissions, active session",
    errors: [],
  },
  "AUTH_FORGOT_PASSWORD": {
    id: "AUTH_FORGOT_PASSWORD",
    method: "POST",
    path: "/auth/forgot-password",
    auth: false,
    permission: null,
    summary: "Send reset link/OTP",
    errors: [],
  },
  "AUTH_RESET_PASSWORD": {
    id: "AUTH_RESET_PASSWORD",
    method: "POST",
    path: "/auth/reset-password",
    auth: false,
    permission: null,
    summary: "Reset password with token",
    errors: ["VALIDATION_ERROR","TOKEN_EXPIRED"],
  },
  "AUTH_CHANGE_PASSWORD": {
    id: "AUTH_CHANGE_PASSWORD",
    method: "POST",
    path: "/auth/change-password",
    auth: true,
    permission: null,
    summary: "Change own password",
    errors: [],
  },
  "AUTH_UPDATE_PROFILE": {
    id: "AUTH_UPDATE_PROFILE",
    method: "PUT",
    path: "/auth/profile",
    auth: true,
    permission: null,
    summary: "Update own profile",
    errors: [],
  },
  "PLANS_LIST": {
    id: "PLANS_LIST",
    method: "GET",
    path: "/public/plans",
    auth: false,
    permission: null,
    summary: "Public pricing plans",
    errors: [],
  },
  "TENANT_REGISTER": {
    id: "TENANT_REGISTER",
    method: "POST",
    path: "/public/schools/register",
    auth: false,
    permission: null,
    summary: "School self-signup, creates tenant + super admin + trial",
    errors: ["VALIDATION_ERROR","DUPLICATE_ENTRY"],
  },
  "ONBOARDING_STATUS": {
    id: "ONBOARDING_STATUS",
    method: "GET",
    path: "/onboarding/status",
    auth: true,
    permission: "settings.manage",
    summary: "Getting-started checklist for new admin",
    errors: [],
  },
  "ONBOARDING_DISMISS": {
    id: "ONBOARDING_DISMISS",
    method: "POST",
    path: "/onboarding/dismiss",
    auth: true,
    permission: "settings.manage",
    summary: "Hide checklist",
    errors: [],
  },
  "SUBSCRIPTION_GET": {
    id: "SUBSCRIPTION_GET",
    method: "GET",
    path: "/subscription",
    auth: true,
    permission: "subscription.manage",
    summary: "Current subscription + usage",
    errors: [],
  },
  "SUBSCRIPTION_CHECKOUT": {
    id: "SUBSCRIPTION_CHECKOUT",
    method: "POST",
    path: "/subscription/checkout",
    auth: true,
    permission: "subscription.manage",
    summary: "Start payment for plan (gateway order)",
    errors: ["VALIDATION_ERROR","PAYMENT_FAILED"],
  },
  "SUBSCRIPTION_CONFIRM": {
    id: "SUBSCRIPTION_CONFIRM",
    method: "POST",
    path: "/subscription/confirm",
    auth: true,
    permission: "subscription.manage",
    summary: "Confirm payment after gateway callback",
    errors: ["PAYMENT_FAILED"],
  },
  "SUBSCRIPTION_CHANGE_PLAN": {
    id: "SUBSCRIPTION_CHANGE_PLAN",
    method: "POST",
    path: "/subscription/change-plan",
    auth: true,
    permission: "subscription.manage",
    summary: "Upgrade/downgrade",
    errors: ["PLAN_LIMIT_REACHED"],
  },
  "SUBSCRIPTION_CANCEL": {
    id: "SUBSCRIPTION_CANCEL",
    method: "POST",
    path: "/subscription/cancel",
    auth: true,
    permission: "subscription.manage",
    summary: "Cancel at period end",
    errors: [],
  },
  "SUBSCRIPTION_INVOICES": {
    id: "SUBSCRIPTION_INVOICES",
    method: "GET",
    path: "/subscription/invoices",
    auth: true,
    permission: "subscription.manage",
    summary: "Billing history",
    errors: [],
  },
  "PLATFORM_METRICS": {
    id: "PLATFORM_METRICS",
    method: "GET",
    path: "/platform/metrics",
    auth: true,
    permission: "PLATFORM_OWNER",
    summary: "Platform owner KPIs",
    errors: [],
  },
  "PLATFORM_TENANTS_LIST": {
    id: "PLATFORM_TENANTS_LIST",
    method: "GET",
    path: "/platform/tenants",
    auth: true,
    permission: "PLATFORM_OWNER",
    summary: "All schools",
    errors: [],
  },
  "PLATFORM_TENANT_STATUS": {
    id: "PLATFORM_TENANT_STATUS",
    method: "PATCH",
    path: "/platform/tenants/{tenantId}/status",
    auth: true,
    permission: "PLATFORM_OWNER",
    summary: "Suspend/activate school",
    errors: [],
  },
  "PLATFORM_PLAN_CREATE": {
    id: "PLATFORM_PLAN_CREATE",
    method: "POST",
    path: "/platform/plans",
    auth: true,
    permission: "PLATFORM_OWNER",
    summary: "Create plan",
    errors: [],
  },
  "PLATFORM_PLAN_UPDATE": {
    id: "PLATFORM_PLAN_UPDATE",
    method: "PUT",
    path: "/platform/plans/{planId}",
    auth: true,
    permission: "PLATFORM_OWNER",
    summary: "Update plan",
    errors: [],
  },
  "DASH_KPI_STUDENTS": {
    id: "DASH_KPI_STUDENTS",
    method: "GET",
    path: "/dashboard/kpi/students",
    auth: true,
    permission: "dashboard.view",
    summary: "Students card (independent so each card can fail/retry alone)",
    errors: [],
  },
  "DASH_KPI_STAFF": {
    id: "DASH_KPI_STAFF",
    method: "GET",
    path: "/dashboard/kpi/staff",
    auth: true,
    permission: "dashboard.view",
    summary: "Staff card",
    errors: [],
  },
  "DASH_KPI_FEES_TODAY": {
    id: "DASH_KPI_FEES_TODAY",
    method: "GET",
    path: "/dashboard/kpi/fees-today",
    auth: true,
    permission: "dashboard.view",
    summary: "Fees collected today card",
    errors: [],
  },
  "DASH_KPI_ATTENDANCE": {
    id: "DASH_KPI_ATTENDANCE",
    method: "GET",
    path: "/dashboard/kpi/attendance",
    auth: true,
    permission: "dashboard.view",
    summary: "Student attendance today card",
    errors: [],
  },
  "DASH_QUICK_ACTIONS": {
    id: "DASH_QUICK_ACTIONS",
    method: "GET",
    path: "/dashboard/quick-actions",
    auth: true,
    permission: "dashboard.view",
    summary: "Role-aware shortcuts",
    errors: [],
  },
  "DASH_FEE_TREND": {
    id: "DASH_FEE_TREND",
    method: "GET",
    path: "/dashboard/fee-trend",
    auth: true,
    permission: "dashboard.view",
    summary: "Fee collection trend",
    errors: [],
  },
  "DASH_ATTENDANCE_TREND": {
    id: "DASH_ATTENDANCE_TREND",
    method: "GET",
    path: "/dashboard/attendance-trend",
    auth: true,
    permission: "dashboard.view",
    summary: "Attendance trend",
    errors: [],
  },
  "DASH_PENDING_APPROVALS": {
    id: "DASH_PENDING_APPROVALS",
    method: "GET",
    path: "/dashboard/pending-approvals",
    auth: true,
    permission: "approvals.decide",
    summary: "Pending approvals widget",
    errors: [],
  },
  "APPROVAL_DECIDE": {
    id: "APPROVAL_DECIDE",
    method: "POST",
    path: "/approvals/{approvalId}/decision",
    auth: true,
    permission: "approvals.decide",
    summary: "Approve or reject",
    errors: ["NOT_FOUND","CONFLICT"],
  },
  "APPROVALS_LIST": {
    id: "APPROVALS_LIST",
    method: "GET",
    path: "/approvals",
    auth: true,
    permission: "approvals.decide",
    summary: "All approvals",
    errors: [],
  },
  "CALENDAR_EVENTS": {
    id: "CALENDAR_EVENTS",
    method: "GET",
    path: "/calendar/events",
    auth: true,
    permission: "dashboard.view",
    summary: "Events + holidays for a month",
    errors: [],
  },
  "CALENDAR_UPCOMING": {
    id: "CALENDAR_UPCOMING",
    method: "GET",
    path: "/calendar/upcoming",
    auth: true,
    permission: "dashboard.view",
    summary: "Upcoming events in N days",
    errors: [],
  },
  "CALENDAR_EVENT_CREATE": {
    id: "CALENDAR_EVENT_CREATE",
    method: "POST",
    path: "/calendar/events",
    auth: true,
    permission: "academic.manage",
    summary: "Add event/holiday",
    errors: [],
  },
  "CALENDAR_EVENT_UPDATE": {
    id: "CALENDAR_EVENT_UPDATE",
    method: "PUT",
    path: "/calendar/events/{eventId}",
    auth: true,
    permission: "academic.manage",
    summary: "Update event",
    errors: [],
  },
  "CALENDAR_EVENT_DELETE": {
    id: "CALENDAR_EVENT_DELETE",
    method: "DELETE",
    path: "/calendar/events/{eventId}",
    auth: true,
    permission: "academic.manage",
    summary: "Delete event",
    errors: [],
  },
  "GLOBAL_SEARCH": {
    id: "GLOBAL_SEARCH",
    method: "GET",
    path: "/search",
    auth: true,
    permission: null,
    summary: "Header search across students, staff, pages",
    errors: [],
  },
  "NOTIFICATIONS_LIST": {
    id: "NOTIFICATIONS_LIST",
    method: "GET",
    path: "/notifications",
    auth: true,
    permission: null,
    summary: "Bell dropdown",
    errors: [],
  },
  "NOTIFICATION_READ": {
    id: "NOTIFICATION_READ",
    method: "PATCH",
    path: "/notifications/{notificationId}/read",
    auth: true,
    permission: null,
    summary: "Mark one as read",
    errors: [],
  },
  "NOTIFICATIONS_READ_ALL": {
    id: "NOTIFICATIONS_READ_ALL",
    method: "POST",
    path: "/notifications/read-all",
    auth: true,
    permission: null,
    summary: "Mark all read",
    errors: [],
  },
  "SESSIONS_LIST": {
    id: "SESSIONS_LIST",
    method: "GET",
    path: "/academic/sessions",
    auth: true,
    permission: "academic.view",
    summary: "Header session dropdown",
    errors: [],
  },
  "SESSION_CREATE": {
    id: "SESSION_CREATE",
    method: "POST",
    path: "/academic/sessions",
    auth: true,
    permission: "academic.manage",
    summary: "Create session",
    errors: ["VALIDATION_ERROR","CONFLICT"],
  },
  "SESSION_ACTIVATE": {
    id: "SESSION_ACTIVATE",
    method: "POST",
    path: "/academic/sessions/{sessionId}/activate",
    auth: true,
    permission: "academic.manage",
    summary: "Make active",
    errors: [],
  },
  "SESSION_ROLLOVER": {
    id: "SESSION_ROLLOVER",
    method: "POST",
    path: "/academic/sessions/{sessionId}/rollover",
    auth: true,
    permission: "academic.manage",
    summary: "Copy classes, fee structures, subjects into new session",
    errors: [],
  },
  "SESSION_LOCK": {
    id: "SESSION_LOCK",
    method: "POST",
    path: "/academic/sessions/{sessionId}/lock",
    auth: true,
    permission: "academic.manage",
    summary: "Lock a past session (read only)",
    errors: [],
  },
  "CLASSES_LIST": {
    id: "CLASSES_LIST",
    method: "GET",
    path: "/academic/classes",
    auth: true,
    permission: "academic.view",
    summary: "Classes with sections",
    errors: [],
  },
  "CLASS_CREATE": {
    id: "CLASS_CREATE",
    method: "POST",
    path: "/academic/classes",
    auth: true,
    permission: "academic.manage",
    summary: "Create class with sections",
    errors: [],
  },
  "CLASS_UPDATE": {
    id: "CLASS_UPDATE",
    method: "PUT",
    path: "/academic/classes/{classId}",
    auth: true,
    permission: "academic.manage",
    summary: "Update class and sections",
    errors: [],
  },
  "CLASS_DELETE": {
    id: "CLASS_DELETE",
    method: "DELETE",
    path: "/academic/classes/{classId}",
    auth: true,
    permission: "academic.manage",
    summary: "Delete (blocked if students exist)",
    errors: ["CONFLICT"],
  },
  "SUBJECTS_LIST": {
    id: "SUBJECTS_LIST",
    method: "GET",
    path: "/academic/subjects",
    auth: true,
    permission: "academic.view",
    summary: "Subjects",
    errors: [],
  },
  "SUBJECT_CREATE": {
    id: "SUBJECT_CREATE",
    method: "POST",
    path: "/academic/subjects",
    auth: true,
    permission: "academic.manage",
    summary: "Create subject",
    errors: [],
  },
  "SUBJECT_UPDATE": {
    id: "SUBJECT_UPDATE",
    method: "PUT",
    path: "/academic/subjects/{subjectId}",
    auth: true,
    permission: "academic.manage",
    summary: "Update subject",
    errors: [],
  },
  "CLASS_SUBJECTS_ASSIGN": {
    id: "CLASS_SUBJECTS_ASSIGN",
    method: "PUT",
    path: "/academic/classes/{classId}/subjects",
    auth: true,
    permission: "academic.manage",
    summary: "Map subjects to class",
    errors: [],
  },
  "GRADE_SCALES_LIST": {
    id: "GRADE_SCALES_LIST",
    method: "GET",
    path: "/academic/grade-scales",
    auth: true,
    permission: "academic.view",
    summary: "Grading schemes",
    errors: [],
  },
  "GRADE_SCALE_UPSERT": {
    id: "GRADE_SCALE_UPSERT",
    method: "PUT",
    path: "/academic/grade-scales/{gradeScaleId}",
    auth: true,
    permission: "academic.manage",
    summary: "Edit grading scheme",
    errors: [],
  },
  "STUDENTS_LIST": {
    id: "STUDENTS_LIST",
    method: "GET",
    path: "/students",
    auth: true,
    permission: "students.view",
    summary: "Paginated list",
    errors: [],
  },
  "STUDENT_CREATE": {
    id: "STUDENT_CREATE",
    method: "POST",
    path: "/students",
    auth: true,
    permission: "students.create",
    summary: "Add student with guardians (auto fee assignment from class structure)",
    errors: ["VALIDATION_ERROR","DUPLICATE_ENTRY","PLAN_LIMIT_REACHED"],
  },
  "STUDENT_GET": {
    id: "STUDENT_GET",
    method: "GET",
    path: "/students/{studentId}",
    auth: true,
    permission: "students.view",
    summary: "Student 360 profile",
    errors: ["NOT_FOUND"],
  },
  "STUDENT_UPDATE": {
    id: "STUDENT_UPDATE",
    method: "PUT",
    path: "/students/{studentId}",
    auth: true,
    permission: "students.update",
    summary: "Update student",
    errors: [],
  },
  "STUDENT_STATUS": {
    id: "STUDENT_STATUS",
    method: "PATCH",
    path: "/students/{studentId}/status",
    auth: true,
    permission: "students.update",
    summary: "Change status",
    errors: [],
  },
  "STUDENT_DELETE": {
    id: "STUDENT_DELETE",
    method: "DELETE",
    path: "/students/{studentId}",
    auth: true,
    permission: "students.delete",
    summary: "Soft delete",
    errors: [],
  },
  "STUDENT_DOCUMENT_UPLOAD": {
    id: "STUDENT_DOCUMENT_UPLOAD",
    method: "POST",
    path: "/students/{studentId}/documents",
    auth: true,
    permission: "students.update",
    summary: "Upload document (multipart)",
    errors: [],
  },
  "STUDENT_PROMOTE": {
    id: "STUDENT_PROMOTE",
    method: "POST",
    path: "/students/promotions",
    auth: true,
    permission: "students.promote",
    summary: "Bulk promote / detain / alumni at year end",
    errors: [],
  },
  "STUDENT_TC_GENERATE": {
    id: "STUDENT_TC_GENERATE",
    method: "POST",
    path: "/students/{studentId}/transfer-certificate",
    auth: true,
    permission: "students.update",
    summary: "Generate TC (blocked if dues pending unless override)",
    errors: ["CONFLICT"],
  },
  "STUDENT_ID_CARDS": {
    id: "STUDENT_ID_CARDS",
    method: "POST",
    path: "/students/id-cards",
    auth: true,
    permission: "students.view",
    summary: "Generate ID cards PDF for selected students",
    errors: [],
  },
  "STUDENT_NEXT_ADMISSION_NO": {
    id: "STUDENT_NEXT_ADMISSION_NO",
    method: "GET",
    path: "/students/next-admission-no",
    auth: true,
    permission: "students.create",
    summary: "Suggested admission number",
    errors: [],
  },
  "STAFF_LIST": {
    id: "STAFF_LIST",
    method: "GET",
    path: "/staff",
    auth: true,
    permission: "staff.view",
    summary: "Paginated list",
    errors: [],
  },
  "STAFF_CREATE": {
    id: "STAFF_CREATE",
    method: "POST",
    path: "/staff",
    auth: true,
    permission: "staff.create",
    summary: "Add staff and optionally create login",
    errors: ["DUPLICATE_ENTRY","PLAN_LIMIT_REACHED"],
  },
  "STAFF_GET": {
    id: "STAFF_GET",
    method: "GET",
    path: "/staff/{staffId}",
    auth: true,
    permission: "staff.view",
    summary: "Staff profile",
    errors: [],
  },
  "STAFF_UPDATE": {
    id: "STAFF_UPDATE",
    method: "PUT",
    path: "/staff/{staffId}",
    auth: true,
    permission: "staff.update",
    summary: "Update staff",
    errors: [],
  },
  "STAFF_STATUS": {
    id: "STAFF_STATUS",
    method: "PATCH",
    path: "/staff/{staffId}/status",
    auth: true,
    permission: "staff.update",
    summary: "Change status",
    errors: [],
  },
  "STAFF_DELETE": {
    id: "STAFF_DELETE",
    method: "DELETE",
    path: "/staff/{staffId}",
    auth: true,
    permission: "staff.delete",
    summary: "Soft delete",
    errors: [],
  },
  "LEAVE_APPLY": {
    id: "LEAVE_APPLY",
    method: "POST",
    path: "/leaves",
    auth: true,
    permission: "leave.apply",
    summary: "Apply leave (creates approval)",
    errors: ["VALIDATION_ERROR","CONFLICT"],
  },
  "LEAVES_LIST": {
    id: "LEAVES_LIST",
    method: "GET",
    path: "/leaves",
    auth: true,
    permission: "leave.apply",
    summary: "My leaves or all (if leave.approve)",
    errors: [],
  },
  "LEAVE_DECIDE": {
    id: "LEAVE_DECIDE",
    method: "POST",
    path: "/leaves/{leaveId}/decision",
    auth: true,
    permission: "leave.approve",
    summary: "Approve / reject leave",
    errors: [],
  },
  "LEAVE_CANCEL": {
    id: "LEAVE_CANCEL",
    method: "POST",
    path: "/leaves/{leaveId}/cancel",
    auth: true,
    permission: "leave.apply",
    summary: "Cancel own pending leave",
    errors: [],
  },
  "ATT_STUDENT_GET": {
    id: "ATT_STUDENT_GET",
    method: "GET",
    path: "/attendance/students",
    auth: true,
    permission: "attendance.student.view",
    summary: "Roster for class/section/date with existing marks",
    errors: [],
  },
  "ATT_STUDENT_MARK": {
    id: "ATT_STUDENT_MARK",
    method: "POST",
    path: "/attendance/students",
    auth: true,
    permission: "attendance.student.mark",
    summary: "Save whole class attendance (upsert, bulk). Default all PRESENT in UI.",
    errors: ["SESSION_LOCKED","VALIDATION_ERROR"],
  },
  "ATT_STUDENT_SUMMARY": {
    id: "ATT_STUDENT_SUMMARY",
    method: "GET",
    path: "/attendance/students/summary",
    auth: true,
    permission: "attendance.student.view",
    summary: "Day/month summary by class",
    errors: [],
  },
  "ATT_STUDENT_MONTHLY": {
    id: "ATT_STUDENT_MONTHLY",
    method: "GET",
    path: "/attendance/students/monthly",
    auth: true,
    permission: "attendance.student.view",
    summary: "Monthly register grid",
    errors: [],
  },
  "ATT_STAFF_GET": {
    id: "ATT_STAFF_GET",
    method: "GET",
    path: "/attendance/staff",
    auth: true,
    permission: "attendance.staff.view",
    summary: "Staff roster for date",
    errors: [],
  },
  "ATT_STAFF_MARK": {
    id: "ATT_STAFF_MARK",
    method: "POST",
    path: "/attendance/staff",
    auth: true,
    permission: "attendance.staff.mark",
    summary: "Bulk mark staff attendance",
    errors: [],
  },
  "ATT_STAFF_SELF_CHECKIN": {
    id: "ATT_STAFF_SELF_CHECKIN",
    method: "POST",
    path: "/attendance/staff/check-in",
    auth: true,
    permission: "attendance.staff.mark",
    summary: "Self check-in / check-out",
    errors: [],
  },
  "ATT_STAFF_MONTHLY": {
    id: "ATT_STAFF_MONTHLY",
    method: "GET",
    path: "/attendance/staff/monthly",
    auth: true,
    permission: "attendance.staff.view",
    summary: "Staff monthly register",
    errors: [],
  },
  "PERIODS_GET": {
    id: "PERIODS_GET",
    method: "GET",
    path: "/timetable/periods",
    auth: true,
    permission: "timetable.view",
    summary: "Bell schedule",
    errors: [],
  },
  "PERIODS_PUT": {
    id: "PERIODS_PUT",
    method: "PUT",
    path: "/timetable/periods",
    auth: true,
    permission: "timetable.manage",
    summary: "Replace bell schedule",
    errors: [],
  },
  "TIMETABLE_BY_CLASS": {
    id: "TIMETABLE_BY_CLASS",
    method: "GET",
    path: "/timetable/class",
    auth: true,
    permission: "timetable.view",
    summary: "Class timetable",
    errors: [],
  },
  "TIMETABLE_BY_TEACHER": {
    id: "TIMETABLE_BY_TEACHER",
    method: "GET",
    path: "/timetable/teacher",
    auth: true,
    permission: "timetable.view",
    summary: "Teacher timetable (own by default)",
    errors: [],
  },
  "TIMETABLE_ENTRY_UPSERT": {
    id: "TIMETABLE_ENTRY_UPSERT",
    method: "PUT",
    path: "/timetable/entries",
    auth: true,
    permission: "timetable.manage",
    summary: "Set a cell. Server rejects teacher double-booking.",
    errors: ["TIMETABLE_CONFLICT"],
  },
  "TIMETABLE_ENTRY_DELETE": {
    id: "TIMETABLE_ENTRY_DELETE",
    method: "DELETE",
    path: "/timetable/entries/{entryId}",
    auth: true,
    permission: "timetable.manage",
    summary: "Clear cell",
    errors: [],
  },
  "TIMETABLE_SUBSTITUTE": {
    id: "TIMETABLE_SUBSTITUTE",
    method: "POST",
    path: "/timetable/substitutions",
    auth: true,
    permission: "timetable.manage",
    summary: "Assign substitute teacher for a date",
    errors: ["TIMETABLE_CONFLICT"],
  },
  "TIMETABLE_FREE_TEACHERS": {
    id: "TIMETABLE_FREE_TEACHERS",
    method: "GET",
    path: "/timetable/free-teachers",
    auth: true,
    permission: "timetable.view",
    summary: "Teachers free in a period",
    errors: [],
  },
  "EXAMS_LIST": {
    id: "EXAMS_LIST",
    method: "GET",
    path: "/exams",
    auth: true,
    permission: "exams.view",
    summary: "Exams list",
    errors: [],
  },
  "EXAM_CREATE": {
    id: "EXAM_CREATE",
    method: "POST",
    path: "/exams",
    auth: true,
    permission: "exams.create",
    summary: "Create exam (wizard step 1-3 saved in one call)",
    errors: ["VALIDATION_ERROR"],
  },
  "EXAM_GET": {
    id: "EXAM_GET",
    method: "GET",
    path: "/exams/{examId}",
    auth: true,
    permission: "exams.view",
    summary: "Exam detail with papers and marks-entry progress",
    errors: [],
  },
  "EXAM_UPDATE": {
    id: "EXAM_UPDATE",
    method: "PUT",
    path: "/exams/{examId}",
    auth: true,
    permission: "exams.create",
    summary: "Update exam/papers (blocked once published)",
    errors: ["EXAM_PUBLISHED_LOCKED"],
  },
  "EXAM_DELETE": {
    id: "EXAM_DELETE",
    method: "DELETE",
    path: "/exams/{examId}",
    auth: true,
    permission: "exams.create",
    summary: "Delete draft exam",
    errors: ["EXAM_PUBLISHED_LOCKED"],
  },
  "EXAM_MARKS_GET": {
    id: "EXAM_MARKS_GET",
    method: "GET",
    path: "/exams/{examId}/marks",
    auth: true,
    permission: "exams.marks.enter",
    summary: "Marks sheet for class/section/subject (teacher sees only assigned)",
    errors: [],
  },
  "EXAM_MARKS_SAVE": {
    id: "EXAM_MARKS_SAVE",
    method: "PUT",
    path: "/exams/{examId}/marks",
    auth: true,
    permission: "exams.marks.enter",
    summary: "Save marks (draft, autosave friendly)",
    errors: ["MARKS_LOCKED","VALIDATION_ERROR"],
  },
  "EXAM_MARKS_LOCK": {
    id: "EXAM_MARKS_LOCK",
    method: "POST",
    path: "/exams/{examId}/marks/lock",
    auth: true,
    permission: "exams.marks.lock",
    summary: "Lock marks for a paper (teacher submit)",
    errors: ["VALIDATION_ERROR"],
  },
  "EXAM_MARKS_UNLOCK": {
    id: "EXAM_MARKS_UNLOCK",
    method: "POST",
    path: "/exams/{examId}/marks/unlock",
    auth: true,
    permission: "exams.publish",
    summary: "Admin unlock",
    errors: [],
  },
  "EXAM_MARKS_IMPORT": {
    id: "EXAM_MARKS_IMPORT",
    method: "POST",
    path: "/exams/{examId}/marks/import",
    auth: true,
    permission: "exams.marks.enter",
    summary: "Use BULK_UPLOAD with entity MARKS (this is a shortcut that returns importId)",
    errors: [],
  },
  "EXAM_PUBLISH": {
    id: "EXAM_PUBLISH",
    method: "POST",
    path: "/exams/{examId}/publish",
    auth: true,
    permission: "exams.publish",
    summary: "Publish results; requires all papers locked; notifies parents",
    errors: ["MARKS_LOCKED","VALIDATION_ERROR"],
  },
  "EXAM_UNPUBLISH": {
    id: "EXAM_UNPUBLISH",
    method: "POST",
    path: "/exams/{examId}/unpublish",
    auth: true,
    permission: "exams.publish",
    summary: "Withdraw published results",
    errors: [],
  },
  "EXAM_RESULTS": {
    id: "EXAM_RESULTS",
    method: "GET",
    path: "/exams/{examId}/results",
    auth: true,
    permission: "exams.view",
    summary: "Class-wise consolidated results with ranks",
    errors: [],
  },
  "REPORT_CARD_GET": {
    id: "REPORT_CARD_GET",
    method: "GET",
    path: "/students/{studentId}/report-card",
    auth: true,
    permission: "exams.view",
    summary: "Report card JSON (PDF built on client or via REPORT_CARD_PDF)",
    errors: ["NOT_FOUND"],
  },
  "REPORT_CARD_PDF_BULK": {
    id: "REPORT_CARD_PDF_BULK",
    method: "POST",
    path: "/exams/{examId}/report-cards/pdf",
    auth: true,
    permission: "exams.view",
    summary: "Generate report cards PDF for class",
    errors: [],
  },
  "ADMIT_CARDS_PDF": {
    id: "ADMIT_CARDS_PDF",
    method: "POST",
    path: "/exams/{examId}/admit-cards/pdf",
    auth: true,
    permission: "exams.view",
    summary: "Generate admit cards (blocked for students with fee dues if setting enabled)",
    errors: [],
  },
  "PORTAL_RESULTS": {
    id: "PORTAL_RESULTS",
    method: "GET",
    path: "/portal/children/{studentId}/results",
    auth: true,
    permission: "PARENT",
    summary: "Published exam list for parent/student",
    errors: [],
  },
  "FEE_CATEGORIES_LIST": {
    id: "FEE_CATEGORIES_LIST",
    method: "GET",
    path: "/fees/categories",
    auth: true,
    permission: "fees.view",
    summary: "Fee heads",
    errors: [],
  },
  "FEE_CATEGORY_CREATE": {
    id: "FEE_CATEGORY_CREATE",
    method: "POST",
    path: "/fees/categories",
    auth: true,
    permission: "fees.manage",
    summary: "Create fee head",
    errors: [],
  },
  "FEE_STRUCTURES_LIST": {
    id: "FEE_STRUCTURES_LIST",
    method: "GET",
    path: "/fees/structures",
    auth: true,
    permission: "fees.view",
    summary: "Fee structures",
    errors: [],
  },
  "FEE_STRUCTURE_CREATE": {
    id: "FEE_STRUCTURE_CREATE",
    method: "POST",
    path: "/fees/structures",
    auth: true,
    permission: "fees.manage",
    summary: "Create structure and generate fee lines for enrolled students",
    errors: [],
  },
  "FEE_STRUCTURE_UPDATE": {
    id: "FEE_STRUCTURE_UPDATE",
    method: "PUT",
    path: "/fees/structures/{structureId}",
    auth: true,
    permission: "fees.manage",
    summary: "Update structure (affects future lines only)",
    errors: [],
  },
  "FEE_ASSIGN_STUDENT": {
    id: "FEE_ASSIGN_STUDENT",
    method: "POST",
    path: "/fees/students/{studentId}/assign",
    auth: true,
    permission: "fees.manage",
    summary: "Assign extra/custom fee (e.g. transport) to a student",
    errors: [],
  },
  "FEE_STUDENT_LEDGER": {
    id: "FEE_STUDENT_LEDGER",
    method: "GET",
    path: "/fees/students/{studentId}/ledger",
    auth: true,
    permission: "fees.view",
    summary: "All fee lines + payments for a student (collect screen)",
    errors: [],
  },
  "FEE_COLLECT": {
    id: "FEE_COLLECT",
    method: "POST",
    path: "/fees/payments",
    auth: true,
    permission: "fees.collect",
    summary: "Collect payment against selected lines (idempotent). Returns receipt.",
    errors: ["VALIDATION_ERROR","CONFLICT","PAYMENT_FAILED"],
  },
  "FEE_PAYMENTS_LIST": {
    id: "FEE_PAYMENTS_LIST",
    method: "GET",
    path: "/fees/payments",
    auth: true,
    permission: "fees.view",
    summary: "Payment register",
    errors: [],
  },
  "FEE_RECEIPT": {
    id: "FEE_RECEIPT",
    method: "GET",
    path: "/fees/payments/{paymentId}/receipt",
    auth: true,
    permission: "fees.view",
    summary: "Receipt data (client renders PDF) or pdfUrl",
    errors: [],
  },
  "FEE_PAYMENT_REFUND": {
    id: "FEE_PAYMENT_REFUND",
    method: "POST",
    path: "/fees/payments/{paymentId}/refund",
    auth: true,
    permission: "fees.refund",
    summary: "Request refund (goes to approvals)",
    errors: [],
  },
  "FEE_CONCESSION": {
    id: "FEE_CONCESSION",
    method: "POST",
    path: "/fees/concessions",
    auth: true,
    permission: "fees.concession",
    summary: "Concession/waiver (goes to approvals above threshold)",
    errors: [],
  },
  "FEE_DUES": {
    id: "FEE_DUES",
    method: "GET",
    path: "/fees/dues",
    auth: true,
    permission: "fees.view",
    summary: "Defaulters list",
    errors: [],
  },
  "FEE_REMINDERS_SEND": {
    id: "FEE_REMINDERS_SEND",
    method: "POST",
    path: "/fees/reminders",
    auth: true,
    permission: "fees.manage",
    summary: "Send due reminders to selected students' guardians",
    errors: [],
  },
  "FEE_SUMMARY": {
    id: "FEE_SUMMARY",
    method: "GET",
    path: "/fees/summary",
    auth: true,
    permission: "fees.view",
    summary: "Fee module landing cards",
    errors: [],
  },
  "FEE_ONLINE_INITIATE": {
    id: "FEE_ONLINE_INITIATE",
    method: "POST",
    path: "/fees/online/initiate",
    auth: true,
    permission: "PARENT",
    summary: "Parent pays online",
    errors: [],
  },
  "FEE_ONLINE_CONFIRM": {
    id: "FEE_ONLINE_CONFIRM",
    method: "POST",
    path: "/fees/online/confirm",
    auth: true,
    permission: "PARENT",
    summary: "Confirm after gateway",
    errors: ["PAYMENT_FAILED"],
  },
  "NOTICES_LIST": {
    id: "NOTICES_LIST",
    method: "GET",
    path: "/communication/notices",
    auth: true,
    permission: "communication.view",
    summary: "Sent/scheduled notices",
    errors: [],
  },
  "NOTICE_CREATE": {
    id: "NOTICE_CREATE",
    method: "POST",
    path: "/communication/notices",
    auth: true,
    permission: "communication.send",
    summary: "Compose and send/schedule notice via selected channels",
    errors: ["VALIDATION_ERROR","PLAN_LIMIT_REACHED"],
  },
  "NOTICE_GET": {
    id: "NOTICE_GET",
    method: "GET",
    path: "/communication/notices/{noticeId}",
    auth: true,
    permission: "communication.view",
    summary: "Notice with delivery report",
    errors: [],
  },
  "NOTICE_DELETE": {
    id: "NOTICE_DELETE",
    method: "DELETE",
    path: "/communication/notices/{noticeId}",
    auth: true,
    permission: "communication.send",
    summary: "Delete or cancel scheduled",
    errors: [],
  },
  "NOTICE_RECIPIENT_COUNT": {
    id: "NOTICE_RECIPIENT_COUNT",
    method: "POST",
    path: "/communication/recipient-count",
    auth: true,
    permission: "communication.send",
    summary: "Live recipient count while composing",
    errors: [],
  },
  "TEMPLATES_LIST": {
    id: "TEMPLATES_LIST",
    method: "GET",
    path: "/communication/templates",
    auth: true,
    permission: "communication.view",
    summary: "Message templates",
    errors: [],
  },
  "TEMPLATE_UPSERT": {
    id: "TEMPLATE_UPSERT",
    method: "PUT",
    path: "/communication/templates/{templateId}",
    auth: true,
    permission: "communication.send",
    summary: "Create/update template",
    errors: [],
  },
  "THREADS_LIST": {
    id: "THREADS_LIST",
    method: "GET",
    path: "/communication/threads",
    auth: true,
    permission: "communication.view",
    summary: "Teacher-parent chat threads for current user",
    errors: [],
  },
  "THREAD_CREATE": {
    id: "THREAD_CREATE",
    method: "POST",
    path: "/communication/threads",
    auth: true,
    permission: "communication.send",
    summary: "Start thread with parent of a student",
    errors: [],
  },
  "THREAD_MESSAGES": {
    id: "THREAD_MESSAGES",
    method: "GET",
    path: "/communication/threads/{threadId}/messages",
    auth: true,
    permission: "communication.view",
    summary: "Messages (cursor)",
    errors: [],
  },
  "THREAD_SEND": {
    id: "THREAD_SEND",
    method: "POST",
    path: "/communication/threads/{threadId}/messages",
    auth: true,
    permission: "communication.send",
    summary: "Send message",
    errors: [],
  },
  "THREAD_READ": {
    id: "THREAD_READ",
    method: "POST",
    path: "/communication/threads/{threadId}/read",
    auth: true,
    permission: "communication.view",
    summary: "Mark thread read",
    errors: [],
  },
  "PORTAL_NOTICES": {
    id: "PORTAL_NOTICES",
    method: "GET",
    path: "/portal/notices",
    auth: true,
    permission: "PARENT",
    summary: "Notices visible to parent/student",
    errors: [],
  },
  "ROLES_LIST": {
    id: "ROLES_LIST",
    method: "GET",
    path: "/roles",
    auth: true,
    permission: "roles.manage",
    summary: "Roles",
    errors: [],
  },
  "ROLE_CREATE": {
    id: "ROLE_CREATE",
    method: "POST",
    path: "/roles",
    auth: true,
    permission: "roles.manage",
    summary: "Create custom role",
    errors: [],
  },
  "ROLE_UPDATE": {
    id: "ROLE_UPDATE",
    method: "PUT",
    path: "/roles/{roleId}",
    auth: true,
    permission: "roles.manage",
    summary: "Update role permissions (system roles: only non-critical perms editable)",
    errors: ["FORBIDDEN"],
  },
  "ROLE_DELETE": {
    id: "ROLE_DELETE",
    method: "DELETE",
    path: "/roles/{roleId}",
    auth: true,
    permission: "roles.manage",
    summary: "Delete custom role (blocked if users assigned)",
    errors: ["CONFLICT"],
  },
  "PERMISSIONS_CATALOG": {
    id: "PERMISSIONS_CATALOG",
    method: "GET",
    path: "/permissions",
    auth: true,
    permission: "roles.manage",
    summary: "Grouped permission catalog for matrix UI",
    errors: [],
  },
  "USERS_LIST": {
    id: "USERS_LIST",
    method: "GET",
    path: "/users",
    auth: true,
    permission: "users.manage",
    summary: "Administrators/users",
    errors: [],
  },
  "USER_INVITE": {
    id: "USER_INVITE",
    method: "POST",
    path: "/users/invite",
    auth: true,
    permission: "users.manage",
    summary: "Invite admin/user by email with role",
    errors: ["DUPLICATE_ENTRY","PLAN_LIMIT_REACHED"],
  },
  "USER_UPDATE": {
    id: "USER_UPDATE",
    method: "PUT",
    path: "/users/{userId}",
    auth: true,
    permission: "users.manage",
    summary: "Change role/details",
    errors: [],
  },
  "USER_STATUS": {
    id: "USER_STATUS",
    method: "PATCH",
    path: "/users/{userId}/status",
    auth: true,
    permission: "users.manage",
    summary: "Activate/deactivate",
    errors: [],
  },
  "USER_RESET_PASSWORD": {
    id: "USER_RESET_PASSWORD",
    method: "POST",
    path: "/users/{userId}/reset-password",
    auth: true,
    permission: "users.manage",
    summary: "Admin triggers reset link",
    errors: [],
  },
  "INVITE_ACCEPT": {
    id: "INVITE_ACCEPT",
    method: "POST",
    path: "/auth/accept-invite",
    auth: false,
    permission: null,
    summary: "Invitee sets password",
    errors: [],
  },
  "REPORTS_CATALOG": {
    id: "REPORTS_CATALOG",
    method: "GET",
    path: "/reports",
    auth: true,
    permission: "reports.view",
    summary: "All available reports grouped by module (filtered by permission)",
    errors: [],
  },
  "REPORT_DATA": {
    id: "REPORT_DATA",
    method: "POST",
    path: "/reports/{reportKey}/data",
    auth: true,
    permission: "reports.view",
    summary: "Run report and get columns + rows (paginated preview). Client exports to xlsx/pdf/csv from this shape.",
    errors: [],
  },
  "REPORT_EXPORT_JOB": {
    id: "REPORT_EXPORT_JOB",
    method: "POST",
    path: "/reports/{reportKey}/export",
    auth: true,
    permission: "reports.export",
    summary: "Server-side export for large reports (>5000 rows). Small ones are exported on client.",
    errors: [],
  },
  "REPORT_EXPORT_STATUS": {
    id: "REPORT_EXPORT_STATUS",
    method: "GET",
    path: "/reports/jobs/{jobId}",
    auth: true,
    permission: "reports.export",
    summary: "Poll export job",
    errors: [],
  },
  "BULK_TEMPLATE": {
    id: "BULK_TEMPLATE",
    method: "GET",
    path: "/bulk/templates/{entity}",
    auth: true,
    permission: "students.import",
    summary: "Download blank xlsx/csv template with headers, sample row, and validation hints (entity: STUDENTS|STAFF|FEE_ASSIGNMENTS|MARKS|GUARDIANS)",
    errors: [],
  },
  "BULK_UPLOAD": {
    id: "BULK_UPLOAD",
    method: "POST",
    path: "/bulk/imports",
    auth: true,
    permission: "students.import",
    summary: "Upload file; server parses and validates all rows (no data written yet)",
    errors: ["VALIDATION_ERROR","PLAN_LIMIT_REACHED"],
  },
  "BULK_GET": {
    id: "BULK_GET",
    method: "GET",
    path: "/bulk/imports/{importId}",
    auth: true,
    permission: "students.import",
    summary: "Job status + summary (poll)",
    errors: [],
  },
  "BULK_ROWS": {
    id: "BULK_ROWS",
    method: "GET",
    path: "/bulk/imports/{importId}/rows",
    auth: true,
    permission: "students.import",
    summary: "Preview rows with per-row validation",
    errors: [],
  },
  "BULK_COMMIT": {
    id: "BULK_COMMIT",
    method: "POST",
    path: "/bulk/imports/{importId}/commit",
    auth: true,
    permission: "students.import",
    summary: "Insert valid rows (invalid skipped). Idempotent.",
    errors: ["IMPORT_VALIDATION_FAILED","PLAN_LIMIT_REACHED"],
  },
  "BULK_ERROR_REPORT": {
    id: "BULK_ERROR_REPORT",
    method: "GET",
    path: "/bulk/imports/{importId}/error-report",
    auth: true,
    permission: "students.import",
    summary: "Download xlsx of failed rows with error column so user can fix and re-upload",
    errors: [],
  },
  "BULK_CANCEL": {
    id: "BULK_CANCEL",
    method: "POST",
    path: "/bulk/imports/{importId}/cancel",
    auth: true,
    permission: "students.import",
    summary: "Cancel before commit",
    errors: [],
  },
  "BULK_HISTORY": {
    id: "BULK_HISTORY",
    method: "GET",
    path: "/bulk/imports",
    auth: true,
    permission: "students.import",
    summary: "Past imports",
    errors: [],
  },
  "SCHOOL_PROFILE_GET": {
    id: "SCHOOL_PROFILE_GET",
    method: "GET",
    path: "/settings/school",
    auth: true,
    permission: "settings.manage",
    summary: "School profile",
    errors: [],
  },
  "SCHOOL_PROFILE_UPDATE": {
    id: "SCHOOL_PROFILE_UPDATE",
    method: "PUT",
    path: "/settings/school",
    auth: true,
    permission: "settings.manage",
    summary: "Update profile/branding",
    errors: [],
  },
  "PREFERENCES_GET": {
    id: "PREFERENCES_GET",
    method: "GET",
    path: "/settings/preferences",
    auth: true,
    permission: "settings.manage",
    summary: "App preferences",
    errors: [],
  },
  "PREFERENCES_UPDATE": {
    id: "PREFERENCES_UPDATE",
    method: "PUT",
    path: "/settings/preferences",
    auth: true,
    permission: "settings.manage",
    summary: "Update preferences",
    errors: [],
  },
  "FILE_UPLOAD": {
    id: "FILE_UPLOAD",
    method: "POST",
    path: "/files",
    auth: true,
    permission: null,
    summary: "Generic upload (multipart). Max 10MB; png/jpg/pdf/xlsx/csv/docx",
    errors: ["VALIDATION_ERROR"],
  },
  "AUDIT_LOGS": {
    id: "AUDIT_LOGS",
    method: "GET",
    path: "/audit-logs",
    auth: true,
    permission: "audit.view",
    summary: "Who did what",
    errors: [],
  },
  "PORTAL_CHILDREN": {
    id: "PORTAL_CHILDREN",
    method: "GET",
    path: "/portal/children",
    auth: true,
    permission: "PARENT",
    summary: "Children linked to logged-in parent",
    errors: [],
  },
  "PORTAL_OVERVIEW": {
    id: "PORTAL_OVERVIEW",
    method: "GET",
    path: "/portal/children/{studentId}/overview",
    auth: true,
    permission: "PARENT",
    summary: "Single-screen overview",
    errors: [],
  },
  "PORTAL_ATTENDANCE": {
    id: "PORTAL_ATTENDANCE",
    method: "GET",
    path: "/portal/children/{studentId}/attendance",
    auth: true,
    permission: "PARENT",
    summary: "Monthly calendar attendance",
    errors: [],
  },
  "PORTAL_FEES": {
    id: "PORTAL_FEES",
    method: "GET",
    path: "/portal/children/{studentId}/fees",
    auth: true,
    permission: "PARENT",
    summary: "Fee ledger for parent",
    errors: [],
  },
  "PORTAL_LEAVE_APPLY": {
    id: "PORTAL_LEAVE_APPLY",
    method: "POST",
    path: "/portal/children/{studentId}/leave",
    auth: true,
    permission: "PARENT",
    summary: "Parent applies leave for child (visible to class teacher)",
    errors: [],
  },
};

export const ALL_ENDPOINT_IDS: EndpointId[] = Object.keys(CONTRACT_ROUTES) as EndpointId[];
