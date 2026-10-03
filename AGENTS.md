# School ERP — Codebase Memory & Architectural Knowledge Base

> **CRITICAL AGENT INSTRUCTION (PERSISTENT MEMORY PROTOCOL):**
> 1. This document serves as the permanent, in-context memory space for the `school_erp` repository.
> 2. **NEVER scan the entire codebase (`find`, full grep sweeps, recursive file listings)** when asked to perform work, inspect features, or modify code. Consult this document first.
> 3. **INCREMENTAL MEMORY UPDATE RULE:** Whenever you create, modify, refactor, or delete any code (entity, DTO, repository, service, controller, migration, security rule, or configuration), you **MUST** immediately update this `AGENTS.md` (and `.agents/rules/codebase_memory.md`) to reflect the changes. This ensures our memory space is always synchronized with the code.

---

## 1. System Overview & Technology Stack

- **Runtime & Language**: Node.js 18+, TypeScript (v5.5)
- **Web Framework**: Express.js (v4.19)
- **Database & ORM**: PostgreSQL database with pure raw SQL queries (`pg` pool, `db.query`, `db.transaction`)
- **Security & Auth**: `jsonwebtoken` (HS256 stateless tokens), `bcryptjs` for password & OTP hashing, `helmet`, `cors`
- **Utilities**: `multer` + `csv-parser` for bulk CSV onboarding, `node-cron` for scheduled late fee sweep, `zod` for request validation
- **Primary Key Strategy**: Standard UUIDs (`@default(uuid()) @db.Uuid`)
- **Money Handling**: High precision `DECIMAL(10,2)` across all financial fields
- **Node Project Commands**:
  - `npm run dev`: Start dev server with auto-reload (`ts-node-dev`)
  - `npm run build`: Compile TypeScript to `./dist`
  - `npm start`: Launch compiled production server (`dist/server.js`)
  - `npx prisma generate`: Generate Prisma Client types
  - `npx prisma migrate dev`: Run PostgreSQL database migrations

### Project Structure (Feature-Wise Modules under `src/modules/`):
- `src/modules/academic/` -> `academic.controller.ts`, `academic.service.ts`, `academic.route.ts`
- `src/modules/auth/` -> `auth.controller.ts`, `auth.service.ts`, `auth.route.ts`
- `src/modules/billing/` -> `billing.controller.ts`, `billing.service.ts`, `billing.route.ts`
- `src/modules/fee/` -> `fee.controller.ts`, `fee.service.ts`, `fee.route.ts`
- `src/modules/onboarding/` -> `onboarding.controller.ts`, `onboarding.service.ts`, `onboarding.route.ts`
- `src/modules/role/` -> `role.controller.ts`, `role.service.ts`, `role.route.ts`
- `src/modules/teacher/` -> `teacher.controller.ts`, `teacher.service.ts`, `teacher.route.ts`
- `src/modules/notification/` -> `notification.service.ts`
- `src/routes/index.ts` -> Central route mount point importing from feature modules.

---

## 2. Multi-Tenancy & Tenant Isolation Architecture

- **Isolation Pattern**: Shared database, discriminator column (`school_id`), enforced via Hibernate ORM-level filter (`@Filter(name = "tenantFilter", condition = "school_id = :schoolId")`).
- **Core Abstractions**:
  - `TenantScoped`: Interface requiring `UUID getSchoolId()`. Implemented by all tenant-owned entities.
  - `TenantContext`: Static accessor wrapping `SecurityContextHolder` to resolve `currentSchoolId()` and `currentPrincipal()`.
  - `TenantFilterInterceptor`: Spring `OncePerRequestFilter` (Order 2, runs after `JwtAuthFilter`). Unwraps Hibernate `Session`, enables `tenantFilter` with caller's `schoolId`, and disables it in `finally`.
  - **Super-Admin Bypass**: When `schoolId` is null (Super Admin or public endpoints), `tenantFilter` is NOT enabled, allowing cross-tenant operations.
- **ORM Filter Coverage**:
  - Active: `Department`, `Grade`, `Section`, `Subject`, `AcademicYear`, `Admin`, `Teacher`, `ParentAccount`, `Student`.

---

## 3. Security, Authentication & 3-Layer Authorization Pipeline

### Pipeline Steps:
0. **Step 0 — Request/Response Logging (`RequestResponseLoggingInterceptor`)**:
   - Order 0 (runs before `JwtAuthFilter`).
   - Resolves `sessionId` (`X-Session-Id` header -> `sess-<tokenHash>` from Bearer token matching `AuthSession.tokenHash` -> `anon-<uuid>` fallback) and `requestId`.
   - Populates SLF4J MDC (`sessionId`, `requestId`) and sets `X-Session-Id` and `X-Request-Id` response headers.
   - Wraps request/response with `ContentCachingRequestWrapper` and `ContentCachingResponseWrapper`.
   - **Selective Body Logging (`app.logging.detailed-uris`)**: Configured via `application.properties` (empty by default). When a URI is in the whitelist, outputs full structured banner blocks (`==============================Request==============================` and `==============================Response=============================` / `[WARN]` / `[ERROR]`) with indented headers, pretty-printed JSON request/response payloads, and masked credentials. For all other URIs, prints a concise 1-line HTTP log (`[HTTP] METHOD URI -> Status (took Xms)`) with zero request/response body.
   - `GlobalExceptionHandler` logs all validation failures, business rule conflicts, not-found errors, access denials, and unhandled server errors with stack traces.
1. **Step 1 — Authentication (`JwtAuthFilter`)**:
   - Intercepts `Authorization: Bearer <token>`.
   - Parses JWT via `JwtService`, extracting `actorType`, `actorId`, `schoolId`, `planCode`, and `features`.
   - Populates `SecurityContextHolder` with `UsernamePasswordAuthenticationToken` carrying `SecurityPrincipal`.
2. **Step 2 — Tenant Isolation (`TenantFilterInterceptor`)**:
   - Sets Hibernate session filter `tenantFilter` using `principal.getSchoolId()`.
3. **Step 3 — Coarse Authorization (`SchoolErpPermissionEvaluator` + `PermissionService`)**:
   - Hooks into Spring Security SpEL `@PreAuthorize("hasPermission(null, 'PERMISSION_CODE')")`.
   - `PermissionService.effectivePermissions(principal)` is cached under `"effectivePermissions"` (key: `actorType:actorId`).
   - Evicted via `permissionService.evict(actorType, actorId)` whenever roles are assigned or updated.
4. **Step 4 — Business Domain Validation (Layer 3)**:
   - Handled inside service methods (e.g. validating teacher belongs to school, section belongs to academic year). Throws `BusinessRuleException` (mapped to HTTP 409).

### Identity & Single-Session Rule:
- Enforced in `AuthSessionRepository.deactivateAllActiveSessions(actorType, actorId)` on every login.
- Only one active session is permitted per actor. A new login invalidates previous sessions.

### Token & Hash Specifications:
- **Login Token (Session JWT)**: Signed with HMAC-SHA256 (`HS256`) via `app.jwt.secret`.
  - Claims: `sub` (`actorId` UUID), `actorType` (`ADMIN|TEACHER|PARENT|SUPER_ADMIN`), `schoolId` (UUID, null for Super Admin), `planCode` (`BASIC|ADVANCE|PREMIUM|ENTERPRISE`), `features` (`List<String>`), `iat`, `exp` (60m).
- **Signup Token (`signupToken`)**: Signed with HMAC-SHA256 (`HS256`) with 15m expiry.
  - Claims: `sub` (`actorId` UUID), `purpose: "SIGNUP"`, `actorType` (`TEACHER|PARENT`), `schoolId` (UUID), `msisdn`, `iat`, `exp`.
- **Database Hash Token (`AuthSession.tokenHash`)**:
  - `tokenHash` stores hex string of 32-bit hash code: `Integer.toHexString(token.hashCode())`. Raw token is never persisted in DB.
- **Other Hash Fields**:
  - `passwordHash` (in `Admin`, `Teacher`, `ParentAccount`): BCrypt hash (`PasswordEncoder.encode(password)`).
  - `otpHash` (in `OtpRequest`): BCrypt hash (`PasswordEncoder.encode(otpCode)`).

### Whitelisted (Public / Unauthenticated) Endpoints:
- `GET /`, `GET /health`, `GET /api/public/ping`
- `POST /api/auth/register` (School onboarding & initial admin creation)
- `POST /api/auth/admin/login`
- `POST /api/auth/teacher/login`
- `POST /api/auth/parent/login`
- `GET /api/auth/parent/schools?msisdn=...` (Step 1 of parent login)
- `POST /api/auth/signup` (Teacher/parent initial account verification)
- `POST /api/auth/create-password` (One-time password creation using signup token)
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `POST /api/auth/otp/send`, `POST /api/auth/otp/resend`, `POST /api/auth/otp/verify`
- `GET /api/public/schools/{schoolId}/roles/{roleId}/permissions`
- `GET /api/public/schools/{schoolId}/roles/by-name/{roleName}/permissions`
- `GET /api/roles`, `POST /api/roles`, `POST /api/roles/assign`

---

## 4. RBAC & Identity Architecture

### System Roles (Seeded in `V2__seed_rbac.sql` with `school_id = NULL`):
1. `SUPER_ADMIN`: Cross-tenant platform administrator. Possesses all permissions.
2. `ADMIN`: School administrator. Possesses all permissions except platform billing/overrides (`SUBSCRIPTION_OVERRIDE`, `PLAN_MANAGE`, `SCHOOL_MANAGE`).
3. `TEACHER`: Teaching staff (`STUDENT_VIEW`, `FEE_INVOICE_VIEW`, `BROADCAST_SEND`, `ACADEMIC_SETUP_VIEW`).
4. `PARENT`: Guardian/parent.
- **Custom Roles**: Created at runtime with `school_id != NULL` by school Admins.

### Polymorphic Actor Role Assignment:
- `ActorType`: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `PARENT`, `STAFF`
- `ActorRoleAssignment`: Links `(actorType, actorId)` to `Role`. Extensible without schema alteration. Effective permissions are computed via union in `ActorRoleAssignmentRepository.findEffectivePermissionCodes`.

---

## 5. Domain Entity Directory

### 1. Tenancy (`com.schoolerp.tenancy`):
- `School`: Root tenant (`name`, `address`, `contactEmail`, `contactPhone`, `currentSubscription`, `status: ACTIVE|SUSPENDED|ARCHIVED`).
- `Plan`: Subscription tier (`code: BASIC|ADVANCE|PREMIUM|ENTERPRISE`, `displayName`, `monthlyPrice`, `yearlyPrice`, `studentCap`, `teacherCap`, `smsQuota`, `whatsappQuota`, `active`, `featuresJson`).
- `Feature`: Plan feature item (`code`, `description`).
- `PlanFeature`: M-to-M between `Plan` and `Feature` (`enabled`).
- `SchoolSubscription`: School's active/historic plan (`school`, `plan`, `billingCycle: MONTHLY|YEARLY`, `startDate`, `endDate`, `status: ACTIVE|EXPIRED|CANCELLED|UPGRADED`, `overrideMaxStudents`, `overrideMaxTeachers`, `overriddenBySuperAdminId`, `overrideReason`, `changeReason`).
- `TopUpPack`: Quota expansion pack (`school`, `channel: SMS|WHATSAPP`, `creditsPurchased`, `costPaid`, `purchasedAt`).
- `UsageLedger`: Monthly credit usage tracker (`school`, `channel`, `yearMonth`, `planCreditsUsed`, `topUpCreditsUsed`).
- `SuperAdmin`: Platform owner entity (`email`, `passwordHash`, `name`).

### 2. Identity (`com.schoolerp.identity`):
- `Admin`: School administrator (`school`, `name`, `email`, `msisdn`, `passwordHash`, `status`).
- `Teacher`: School teacher (`school`, `employeeCode`, `name`, `email`, `loginMsisdn`, `msisdns`, `dob`, `gender`, `address`, `aadharNo`, `panNo`, `bank details`, `dateOfJoining`, `designation`, `passwordHash`, `passwordSet`, `status`).
- `ParentAccount`: School-scoped parent login (`school`, `msisdn`, `name`, `email`, `passwordHash`, `passwordSet`, `status`). Unique on `(school_id, msisdn)`.
- `Guardian`: Join table between `ParentAccount` and `Student` (`parentAccount`, `student`, `relation`, `occupation`, `address`, `isPrimary`).
- `AuthSession`: Token session tracking (`actorType`, `actorId`, `deviceId`, `tokenHash`, `expiresAt`, `active`).
- `OtpRequest`: OTP lifecycle (`msisdn`, `otpHash`, `purpose: LOGIN|RESET_PASSWORD`, `expiresAt`, `verifiedAt`).
- `Department`: Academic department (`school`, `name`, `code`, `hodTeacher`).
- `TeacherDepartmentMap`: Join between `Teacher` and `Department`.

### 3. Academic Setup (`com.schoolerp.academic`):
- `AcademicYear`: Session year (`school`, `name`, `startDate`, `endDate`, `status: ACTIVE|COMPLETED`).
- `Grade`: Stable grade label (`school`, `name`, `sequenceOrder`). E.g., "Grade 5", "Grade 10".
- `Section`: **Anchor Entity** (`school`, `grade`, `academicYear`, `name`, `classTeacher`, `capacity`). All student enrollments, subject mappings, and fee structures anchor here.
- `SubjectType`: School-scoped subject classification (`school`, `name`, `code`, `description`). E.g., Core, Elective, Language, Extracurricular.
- `Subject`: Subject definition (`school`, `name`, `code`, `subjectType`).
- `SectionSubjectMap`: Maps `Subject` to `Section`.
- `SectionSubjectTeacher`: Assigns `Teacher` to `(Section, Subject)` pair.
- `TeacherBroadcastQuota`: Quota allocation per teacher for communications.

### 4. Student Management (`com.schoolerp.student`):
- `Student`: Year-independent identity (`school`, `studentCode`, `name`, `email`, `phone`, `dob`, `address`, `aadharNo`, `bloodGroup`, `dateOfAdmission`, `previousSchool`).
- `Enrollment`: Year-scoped placement (`student`, `section`, `rollNo`, `enrolledAt`, `status: ACTIVE|PROMOTED|TRANSFERRED|WITHDRAWN`). Enforced single active enrollment per student via partial unique index.

### 5. Fee Management (`com.schoolerp.fee`):
- `FeeComponent`: Fee head (`school`, `name`, `code`). E.g., Tuition, Transport.
- `SectionFeeStructure`: Per-section pricing (`section`, `feeComponent`, `amount`, `frequency: MONTHLY|ONE_TIME|ANNUAL`).
- `LateFeeSlab`: Append-only, effective-dated overdue penalty rules (`school`, `daysOverdueFrom`, `daysOverdueTo`, `amount`, `effectiveFrom`, `effectiveTo`).
- `BulkPaymentDiscountPolicy`: Append-only, effective-dated discount rules (`school`, `grade` (optional), `monthsCount: 3|6|12`, `discountPercentage`, `effectiveFrom`, `effectiveTo`).
- `FeeInvoice`: Monthly bill (`student`, `enrollment`, `yearMonth`, `dueDate`, `totalAmount`, `lateFeeAmount`, `discountAmount`, `paidAmount`, `balance`, `status: PENDING|PARTIAL|PAID|OVERDUE`). Unique on `(student_id, year_month)`.
- `FeeInvoiceLine`: Line-item breakdown (`invoice`, `feeComponent`, `amount`).
- `Payment`: Payment record (`student`, `amount`, `mode: UPI|CARD|CASH`, `gatewayTxnId` (unique), `paidByGuardianId`, `recordedByAdminId`, `paidAt`, `status: SUCCESS|FAILED|PENDING`).
- `PaymentAllocation`: Maps payment amount to specific `FeeInvoice`.
- `FeeWaiverLog`: Audit trail of waived late fees (`invoice`, `waivedByAdminId`, `originalLateFee`, `reason`, `waivedAt`).
- `Refund`: Refund record (`payment`, `amount`, `mode: CREDIT_ADJUSTMENT|MANUAL_CASH`, `reason`, `approvedByAdminId`, `processedAt`). Never mutates original `Payment`.

### 6. Communication Hub (`com.schoolerp.communication`):
- `Broadcast`: Communication record (`school`, `senderTeacherId`, `channel: SMS|WHATSAPP|IN_APP`, `messageBody`, `recipientCount`, `scheduledAt`, `sentAt`, `status`).
- `MessageTemplate`: Pre-approved notification templates.

---

## 6. Complete API Route Reference

### Authentication & Public (`/api/auth`, `/api/public`):
- `POST /api/auth/register` -> `RegisterResponse` (Onboards school + admin + assigns BASIC plan)
- `POST /api/auth/admin/login` -> `TokenResponse`
- `POST /api/auth/teacher/login` -> `TokenResponse`
- `POST /api/auth/parent/login?parentAccountId=&deviceId=` -> `TokenResponse`
- `GET  /api/auth/parent/schools?msisdn=` -> `List<ParentSchoolOption>`
- `POST /api/auth/signup` -> `UserSignupResponse` (Initial signup eligibility check)
- `POST /api/auth/create-password` -> `UserCreatePasswordResponse` (One-time password creation)
- `POST /api/auth/forgot-password?email=&mobileNo=` -> `boolean`
- `POST /api/auth/reset-password` -> `boolean`
- `POST /api/auth/change-password` -> `boolean`
- `POST /api/auth/otp/send` -> `SendOtpResponse`
- `POST /api/auth/otp/resend` -> `SendOtpResponse`
- `POST /api/auth/otp/verify` -> `VerifyOtpResponse`
- `GET  /api/public/schools/{schoolId}/roles/{roleId}/permissions` -> `RolePermissionsResponse`
- `GET  /api/public/schools/{schoolId}/roles/by-name/{roleName}/permissions` -> `RolePermissionsResponse`

### Academic Setup (`/api/academic`):
- `GET    /api/academic/academic-years` (and `/years`) [ACADEMIC_SETUP_VIEW] -> `List<AcademicYearResponse>` (All academic sessions ordered by start date desc)
- `GET    /api/academic/academic-years/active` (and `/years/active`) [ACADEMIC_SETUP_VIEW] -> `AcademicYearResponse` (Current active session)
- `GET    /api/academic/academic-years/{id}` (and `/years/{id}`) [ACADEMIC_SETUP_VIEW] -> `AcademicYearResponse`
- `POST   /api/academic/academic-years` (and `/years`) [ACADEMIC_SETUP_MANAGE] -> `AcademicYearResponse` (Creates session; if ACTIVE, closes previous)
- `PUT    /api/academic/academic-years/{id}` (and `/years/{id}`) [ACADEMIC_SETUP_MANAGE] -> `AcademicYearResponse`
- `PATCH  /api/academic/academic-years/{id}/activate` (and `/years/{id}/activate`) [ACADEMIC_SETUP_MANAGE] -> `AcademicYearResponse` (Flipping to ACTIVE closes prior session)
- `PATCH  /api/academic/academic-years/{id}/close` (and `/years/{id}/close`) [ACADEMIC_SETUP_MANAGE] -> `AcademicYearResponse`
- `GET    /api/academic/grades` (and `/classes`) [ACADEMIC_SETUP_VIEW]
- `POST   /api/academic/grades` (and `/classes`) [ACADEMIC_SETUP_MANAGE]
- `PUT    /api/academic/grades/{id}` (and `/classes/{id}`) [ACADEMIC_SETUP_MANAGE]
- `GET    /api/academic/departments?academicYearId=` [ACADEMIC_SETUP_VIEW] -> `List<DepartmentResponse>` (includes `facultyCount` for year)
- `POST   /api/academic/departments` [ACADEMIC_SETUP_MANAGE]
- `PUT    /api/academic/departments/{id}` [ACADEMIC_SETUP_MANAGE]
- `DELETE /api/academic/departments/{id}` [ACADEMIC_SETUP_MANAGE]
- `POST   /api/academic/departments/assign-faculty` [ACADEMIC_SETUP_MANAGE] (Assigns teachers to department for an academic year)
- `GET    /api/academic/sections?academicYearId=` [ACADEMIC_SETUP_VIEW] -> `List<SectionResponse>`
- `GET    /api/academic/sections/{id}/subjects` [ACADEMIC_SETUP_VIEW] -> `List<SubjectResponse>` (Subjects mapped to section)
- `POST   /api/academic/sections` [ACADEMIC_SETUP_MANAGE]
- `PUT    /api/academic/sections/{id}` [ACADEMIC_SETUP_MANAGE]
- `PATCH  /api/academic/sections/{id}/class-teacher?teacherId=` [ACADEMIC_SETUP_MANAGE]
- `POST   /api/academic/rollover?fromAcademicYearId=&toAcademicYearId=` [ACADEMIC_SETUP_MANAGE] -> `AcademicRolloverResult` (Clones sections & subject mappings to new academic year)
- `GET    /api/academic/subjects` [ACADEMIC_SETUP_VIEW]
- `POST   /api/academic/subjects` [ACADEMIC_SETUP_MANAGE]
- `POST   /api/academic/subjects/map-to-section` [ACADEMIC_SETUP_MANAGE] -> `List<UUID>` (Maps subjects to section via `subjectIds` list)
- `POST   /api/academic/subjects/assign-teacher` [ACADEMIC_SETUP_MANAGE]
- `GET    /api/academic/subject-types` [ACADEMIC_SETUP_VIEW]
- `POST   /api/academic/subject-types` [ACADEMIC_SETUP_MANAGE]
- `PUT    /api/academic/subject-types/{id}` [ACADEMIC_SETUP_MANAGE]
- `DELETE /api/academic/subject-types/{id}` [ACADEMIC_SETUP_MANAGE]

### Onboarding (`/api/onboarding`):
- `POST /api/onboarding/students` [STUDENT_CREATE] -> `StudentResponse` (Atomic Student + Enrollment + Guardian creation)
- `POST /api/onboarding/students/bulk` (multipart CSV) [STUDENT_CREATE] -> `BulkUploadResult`
- `POST /api/onboarding/teachers` [TEACHER_CREATE] -> `TeacherResponse`
- `POST /api/onboarding/teachers/bulk` (multipart CSV) [TEACHER_CREATE] -> `BulkUploadResult`

### Teachers (`/api/teachers`):
- `GET /api/teachers` [TEACHER_VIEW | ACADEMIC_SETUP_VIEW] -> `List<TeacherSummaryResponse>` (All teachers in current school; supports optional `?sectionId=`)
- `GET /api/teachers/section/{sectionId}` [TEACHER_VIEW | ACADEMIC_SETUP_VIEW] -> `List<SectionTeacherResponse>` (All teachers of particular section: homeroom teacher + subject teachers with subject mappings)

### Roles & RBAC (`/api/roles`):
- `GET  /api/roles` (List school custom roles)
- `POST /api/roles` (Create school custom role)
- `POST /api/roles/assign` (Assign role to actor)

### Fee Management (`/api/fee`, `/api/fee-invoices`):
- `GET  /api/fee-invoices/search?status=&classId=&yearMonth=` [FEE_INVOICE_VIEW]
- `GET  /api/fee/setup/components` [FEE_STRUCTURE_VIEW]
- `POST /api/fee/setup/components` [FEE_STRUCTURE_MANAGE]
- `GET  /api/fee/setup/sections/{sectionId}/structure` [FEE_STRUCTURE_VIEW]
- `POST /api/fee/setup/sections/structure` [FEE_STRUCTURE_MANAGE]
- `GET  /api/fee/setup/late-fee-slabs` [FEE_STRUCTURE_VIEW]
- `POST /api/fee/setup/late-fee-slabs` [FEE_STRUCTURE_MANAGE] (Replaces whole slab set)
- `POST /api/fee/setup/bulk-discount-policies` [FEE_STRUCTURE_MANAGE]
- `POST /api/fee/payments/gateway` [FEE_PAYMENT_RECORD]
- `POST /api/fee/payments/manual-cash` [FEE_PAYMENT_RECORD]
- `POST /api/fee/payments/bulk` [FEE_PAYMENT_RECORD]
- `POST /api/fee/invoices/{invoiceId}/waiver` [FEE_WAIVER_APPLY]
- `POST /api/fee/payments/{paymentId}/refund` [FEE_REFUND_PROCESS]

### Billing & Tenancy (`/api/billing`):
- `GET  /api/billing/plans` [PLAN_VIEW]
- `POST /api/billing/plans` [PLAN_MANAGE] (Super Admin only)
- `PUT  /api/billing/plans/{id}` [PLAN_MANAGE] (Super Admin only)
- `POST /api/billing/schools` [SCHOOL_MANAGE] (Super Admin only - creates School + Admin + Subscription)
- `POST /api/billing/schools/{schoolId}/subscription/override-cap` [SUBSCRIPTION_OVERRIDE] (Super Admin only)
- `GET  /api/billing/subscription` [SUBSCRIPTION_VIEW] (Current school subscription)
- `POST /api/billing/subscription/upgrade` [SUBSCRIPTION_MANAGE] (Closes old, starts new subscription)
- `POST /api/billing/topups` [TOPUP_MANAGE]
- `GET  /api/billing/topups` [USAGE_VIEW]
- `GET  /api/billing/topups/usage?channel=` [USAGE_VIEW]

---

## 7. Key Business Logic & Invariants

1. **No Mid-Cycle Proration**:
   - Monthly fee invoices charge the full fee regardless of enrollment day.
   - Subscription plan upgrades terminate the old subscription and initiate a new one cleanly.
2. **Atomic Student Onboarding**:
   - Single flow generates `Student`, `Enrollment`, `ParentAccount` (if missing), and `Guardian` in one atomic transaction.
3. **Isolated Bulk CSV Processing (`REQUIRES_NEW`)**:
   - In `StudentOnboardingService.bulkOnboard` and `TeacherOnboardingService.bulkOnboard`, each CSV row runs in an isolated `REQUIRES_NEW` transaction. A failure in one row never aborts valid rows.
4. **Capacity Enforcement**:
   - `CapacityCheckService` checks active student/teacher counts against `overrideCap ?? planCap` before any onboarding operation proceeds.
5. **Nightly Late Fee Sweep**:
   - `LateFeeAutoApplyService` runs scheduled at 2 AM (`app.late-fee-sweep.cron`). Cross-tenant by design.
   - Strictly skips invoices with existing `FeeWaiverLog` entries.
6. **Append-Only Effective-Dated Policies**:
   - `LateFeeSlab` and `BulkPaymentDiscountPolicy` are never mutated in-place; old entries are closed out with `effectiveTo`, and new rows are inserted with `effectiveFrom`.
7. **Idempotent Webhooks & Payments**:
   - `Payment.gatewayTxnId` is unique. Duplicate webhook notifications result in idempotent no-ops.
8. **Notification System**:
   - Dispatched via `NotificationFactory` -> `EmailNotificationService`, `SmsNotificationService`, `WhatsAppNotificationService`.

---

## 8. Development & Maintenance Guidelines

- **NEVER scan all files**: Use this document to inspect models, routes, and logic.
- **SYNC AFTER EDITS**: When adding or altering entities, fields, endpoints, or services, update this file immediately.
- **PROGRESS LOG (`PROGRESS.md`)**: Tracks completed milestones and completed modules for developer context. **RULE**: Only write/update `PROGRESS.md` when the user explicitly requests it.
- **LOW LEVEL DESIGN (`school-erp-lld.md`)**: Complete LLD specifications, entity diagrams, and database dictionary.
  - Interactive HTML Viewer: `school-erp-lld-diagram.html`
  - Vector SVG Diagram: `school-erp-lld.svg` (and `school-erp-lld-diagram.svg`)
- **DIAGRAM GENERATION RULE**: Do **NOT** regenerate or modify diagrams (`school-erp-lld.svg`, `school-erp-lld-diagram.html`, `generate_diagram_svg.py`, etc.) automatically. Only modify or regenerate diagrams when the user explicitly requests it.
- **CURL REQUEST RULE**: When the user asks for cURL commands, output **ONLY** the cURL commands (no explanations, no sample responses, no extra commentary). Always use base URL `https://miraculous-education-production-bee2.up.railway.app` and header `Authorization: Bearer {{authToken}}`.


