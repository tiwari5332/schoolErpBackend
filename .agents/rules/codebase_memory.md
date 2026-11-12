---
description: Permanent codebase memory, architecture reference, and entity/API index for school_erp
globs: "**/*"
always_on: true
---

# School ERP — Codebase Memory & Architectural Rule

## Core Directives for Agent Behavior
1. **Never Rescan the Whole Codebase**:
   - The entire architecture, entity graph, security pipeline, service layer, and API route catalog of `school_erp` is indexed below.
   - Do NOT run full-tree file listings (`find`, `tree`), mass greps across the entire project, or broad scans to understand the project structure.
2. **Mandatory Memory Update on Code Changes**:
   - Whenever you create, modify, or remove any file in `school_erp` (entities, DTOs, controllers, services, repositories, configurations, migrations, or security rules), you MUST immediately update this file (`.agents/rules/codebase_memory.md`) and `AGENTS.md` to keep our memory synchronized with the current code state.
3. **Progress Tracking Protocol (`PROGRESS.md`)**:
   - Only write or update `PROGRESS.md` when the user explicitly instructs to record completed work.


---

## Technical Summary
- **Primary Stack (EduTrio Modern Monolith)**: Node.js 22 LTS, NestJS 10.4+ with Fastify v4 adapter (`@nestjs/platform-fastify`), TypeScript v5.9, PostgreSQL 16 with Prisma ORM (`@prisma/client`), Redis 7 (`ioredis`) + BullMQ v5, Zod v3.25 validation, Argon2id (`argon2`) password hashing, JWT 15m + rotating opaque refresh tokens with family reuse detection.
- **Contract Source of Truth**: `api-contract.json` (175 endpoints across 16 modules). Generated artefacts in `src/contract/generated/`: `routes.ts`, `enums.ts`, `fixtures.ts`, `openapi.json`, `schemas.ts`.
- **Runtime Entrypoints**:
  - `src/main.ts`: Fastify HTTP API server listening on `/api/v1` with Helmet, CORS, Rate Limit, and Swagger UI at `/docs`.
  - `src/server.ts`, `src/index.ts`, `api/index.ts`: Cached Fastify application instance and request handler for Vercel Serverless deployments, routed via `vercel.json`.
  - `src/worker.ts`: BullMQ background worker process for imports, exports, notifications, reminders, outbox relay.
  - Build script: `prisma generate && tsc` (`postinstall: prisma generate` ensures Prisma client types exist before compilation on CI/CD platforms like Vercel).
- **Project Structure**:
  - `src/contract/`: Decorators (`@Endpoint()`), coverage checking (`ContractCoverageChecker`), generated routes/enums/fixtures.
  - `src/common/`: Domain errors (`DomainError`), response interceptors (`EnvelopeInterceptor`), filters (`GlobalExceptionFilter`), decorators (`@Public()`, `@RequirePermission()`, `@RequireRole()`, `@CurrentUser()`), guards (`AuthGuard`, `PermissionsGuard`, `SubscriptionGuard`, `SessionLockGuard`), utilities (`Clock`, `IdGenerator`, `Money`, `PaginationUtil`, `IdempotencyService`).
  - `src/infra/`: `PrismaService`, `RedisService`, `QueueService`, `StorageService`, `TenantTx`, `TenantContext`.
  - `src/modules/`: Feature modules mapping 1:1 to `api-contract.json` (health, auth, onboarding, subscription, platform, roles, users, academic, calendar, students, staff, attendance, timetable, exams, fees, communication, dashboard, reports, bulk, settings, portal) [All Phases B0 through B8 complete; 175/175 endpoints active with 100% contract coverage].
- **Legacy Prototype**: Archived in `legacy/` (Express controllers, routes, middleware, and raw SQL queries) preserved for reference.
- **Tenancy**: Multi-tenant database isolation via tenant helper functions and middleware (`getTenantSchoolId`, `tenantInterceptor`).
- **Security**: 
  0. `requestResponseLogger` (Order 0) tracks request/response logs.
  1. `jwtAuthFilter` parses Bearer JWT -> sets principal in context.
  2. `tenantInterceptor` enforces tenant context.
  3. `hasPermission` middleware evaluates required permission codes.
- **Roles & RBAC**: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `PARENT`.
- **Single-Session**: `AuthSession` active status enforced on login.

---

## Entity Map by Domain

1. **Tenancy (`tenancy`)**:
   - `School`: Root tenant (`id`, `name`, `address`, `contactEmail`, `contactPhone`, `currentSubscription`, `status`).
   - `Plan`: Plan catalog (`id`, `code: BASIC|ADVANCE|PREMIUM|ENTERPRISE`, `displayName`, `monthlyPrice`, `yearlyPrice`, `studentCap`, `teacherCap`, `smsQuota`, `whatsappQuota`, `active`).
   - `Feature`, `PlanFeature`: Feature gating per plan.
   - `SchoolSubscription`: (`school`, `plan`, `billingCycle`, `startDate`, `endDate`, `status`, `overrideMaxStudents`, `overrideMaxTeachers`).
   - `TopUpPack`, `UsageLedger`: SMS/WhatsApp quota & purchases.
   - `SuperAdmin`: Platform owner credentials.

2. **Identity (`identity`)**:
   - `Admin`: School admin (`school`, `name`, `email`, `msisdn`, `passwordHash`, `status`).
   - `Teacher`: Teacher (`school`, `employeeCode`, `loginMsisdn`, `passwordHash`, `passwordSet`, `status`).
   - `ParentAccount`: School-scoped (`school`, `msisdn`, `passwordHash`, `passwordSet`, `status`).
   - `Guardian`: Maps `ParentAccount` to `Student`.
   - `AuthSession`: Active session tracking (`actorType`, `actorId`, `deviceId`, `active`).
   - `OtpRequest`: OTP records (`msisdn`, `otpHash`, `purpose`, `expiresAt`, `verifiedAt`).
   - `Department`, `TeacherDepartmentMap`: School departments.

3. **Academic (`academic`)**:
   - `AcademicYear`: (`school`, `name`, `startDate`, `endDate`, `status`).
   - `Grade`: Stable label (`school`, `name`, `sequenceOrder`). E.g., "Grade 5".
   - `Section`: **Anchor Entity** (`school`, `grade`, `academicYear`, `name`, `classTeacher`, `capacity`).
   - `SubjectType`: School-scoped classification (`school`, `name`, `code`, `description`).
   - `Subject`, `SectionSubjectMap`, `SectionSubjectTeacher`.

4. **Student (`student`)**:
   - `Student`: Year-independent identity (`school`, `studentCode`, `name`, `email`, `phone`, `dob`, etc.).
   - `Enrollment`: Year-scoped placement (`student`, `section`, `rollNo`, `status: ACTIVE|PROMOTED|TRANSFERRED|WITHDRAWN`).

5. **Fee (`fee`)**:
   - `FeeComponent`: Fee heads (`school`, `name`, `code`).
   - `SectionFeeStructure`: Amount per section & frequency.
   - `LateFeeSlab`: Append-only overdue penalty slabs.
   - `BulkPaymentDiscountPolicy`: Append-only discount policies.
   - `FeeInvoice`: Monthly bill (`student`, `enrollment`, `yearMonth`, `dueDate`, `totalAmount`, `balance`, `status`).
   - `FeeInvoiceLine`: Line breakdown per invoice.
   - `Payment`: (`student`, `amount`, `mode: UPI|CARD|CASH`, `gatewayTxnId`, `status`).
   - `PaymentAllocation`: Payment to invoice mapping.
   - `FeeWaiverLog`: Audit trail of waived late fees.
   - `Refund`: (`payment`, `amount`, `mode`, `reason`).

6. **Communication (`communication`)**:
   - `Broadcast`: (`school`, `senderTeacherId`, `channel: SMS|WHATSAPP|EMAIL|IN_APP`, `messageBody`, `recipientCount`, `sentAt`, `status`).
   - `MessageTemplate`: Pre-approved reusable templates (`name`, `code`, `template`, `channel`).
   - `TeacherBroadcastQuota`: Quota limits and tracking per teacher, channel, and month.

7. **Attendance (`attendance`)**:
   - `StudentAttendance`: (`school`, `student`, `section`, `academicYear`, `date`, `attendanceType: DAILY_HOMEROOM|SUBJECT_WISE`, `subject`, `status: PRESENT|ABSENT|LATE|HALF_DAY|EXCUSED`, `recordedByTeacher`).
   - `StaffAttendance`: Biometric/RFID/manual check-in & check-out (`school`, `teacher`, `date`, `checkInTime`, `checkOutTime`, `status`, `source`).
   - `MonthlyAttendanceLedger`: Monthly roll-up & exam eligibility (`school`, `student`, `section`, `yearMonth`, `totalWorkingDays`, `presentDays`, `absentDays`, `percentage`, `examEligible`).

---

## API Map
- **Public & Auth**: `POST /api/auth/register`, `/admin/login`, `/teacher/login`, `/parent/login`, `/signup`, `/create-password`, `/forgot-password`, `/reset-password`, `/change-password`, `/otp/send`, `/otp/resend`, `/otp/verify`, `GET /api/auth/parent/schools`.
- **Public RBAC Metadata**: `GET /api/public/schools/{schoolId}/roles/{roleId}/permissions`, `/roles/by-name/{roleName}/permissions`.
- **Academic**: `GET/POST/PUT /api/academic/academic-years` (+ `/years`, `/active`, `/{id}/activate`, `/{id}/close`), `GET/POST/PUT /api/academic/grades` (and `/classes`), `/departments` (optional `?academicYearId=`), `POST /departments/assign-faculty`, `/sections` (optional `?academicYearId=`), `GET /sections/{id}/subjects`, `/subjects`, `/subjects/map-to-section` (accepts `subjectIds` list for single & multiple), `/subjects/assign-teacher`, `/subject-types`, `PATCH /sections/{id}/class-teacher`, `POST /api/academic/rollover`, `POST /api/academic/progression/batch-promote`, `GET /api/academic/students/{studentId}/enrollment-history`.
- **Attendance**: `POST /api/attendance/daily` (homeroom morning attendance + auto parent absence SMS/WhatsApp alert), `POST /api/attendance/subject` (subject/period-wise attendance), `GET /api/attendance/sections/{sectionId}` (section attendance query), `GET /api/attendance/students/{studentId}/summary` (student monthly attendance report & exam eligibility), `POST /api/attendance/staff/check-in`, `POST /api/attendance/staff/check-out`, `GET /api/attendance/staff`.
- **Communication & Broadcast**: `POST /api/broadcast/send` (multi-channel broadcast dispatch with teacher quota check + multi-tier plan/top-up ledger deduction), `GET /api/broadcast/list`, `GET/POST /api/broadcast/templates`, `POST /api/broadcast/quotas/assign`, `GET /api/broadcast/quotas/teacher/{teacherId}`.
- **Onboarding**: `POST /api/onboarding/students` (+ `/bulk`), `POST /api/onboarding/teachers` (+ `/bulk`).
- **Teachers**: `GET /api/teachers` (all teachers; optional `?sectionId=`), `GET /api/teachers/{id}` (profile with active department), `GET /api/teachers/section/{sectionId}`, `PUT /api/teachers/{id}` (full staff update with unique phone guard), `PATCH /api/teachers/{id}` (partial staff update).
- **Students**: `GET /api/students` (directory with search, section filter, pagination), `GET /api/students/{id}` (single student details with active enrollment & primary guardian), `PUT /api/students/{id}` (full student update: personal details, section/rollNo reassignment, parent account sync), `PATCH /api/students/{id}` (partial student update).
- **Academic Sessions & Me**: `GET/POST/PUT /api/academic-sessions`, `PATCH /api/academic-sessions/{id}/set-current`, `GET /api/me`, `PUT /api/me/preferences`, `GET /api/me/quick-actions`.
- **Dashboard & Analytics**: `GET /api/dashboard/summary`, `/dashboard/staff-attendance`, `/dashboard/communication-balance`, `/dashboard/pending-actions`, `/dashboard/fee-trend`, `GET /api/calendar/events`, `POST /api/calendar/events`, `GET /api/events/upcoming`, `GET /api/notifications/unread-count`.
- **Fee Management**: `GET /api/fee-invoices/search`, `GET/POST /api/fee/setup/components`, `/sections/{id}/structure`, `/late-fee-slabs`, `/bulk-discount-policies`, `POST /api/fee/payments/gateway`, `/manual-cash`, `/bulk`, `POST /api/fee/invoices/{id}/waiver`, `POST /api/fee/payments/{id}/refund`.
- **Billing**: `GET/POST/PUT /api/billing/plans`, `POST /api/billing/schools`, `/schools/{id}/subscription/override-cap`, `GET/POST /api/billing/subscription` (+ `/upgrade`), `GET/POST /api/billing/topups` (+ `/usage`).
- **Roles**: `GET/POST /api/roles`, `POST /api/roles/assign`.
- **Health**: `GET /`, `GET /health`, `GET /api/public/ping`.

---

## Guidelines
- **Postman Collection**: `School_ERP.postman_collection.json` contains the full 104-request collection across 11 modules.
- **Diagram Generation Rule**: Do NOT regenerate or modify diagram files (`school-erp-lld.svg`, `school-erp-lld-diagram.html`, `generate_diagram_svg.py`, etc.) automatically. Only modify or regenerate diagrams when explicitly requested by the user.
- **CURL Request Rule**: When asked for cURL commands, output ONLY the cURL commands without any sample responses, explanations, or extra commentary. Always use base URL `https://miraculous-education-production-bee2.up.railway.app` and header `Authorization: Bearer {{authToken}}`.
