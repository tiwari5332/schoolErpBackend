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
- **Stack**: Node.js 18+, Express.js v4.19, TypeScript v5.5, PostgreSQL (`pg` raw queries), JWT (HS256), bcryptjs, Multer, node-cron, Zod.
- **Project Structure**: Feature-wise modules under `src/modules/`:
  - `academic` -> `academic.controller.ts`, `academic.service.ts`, `academic.route.ts`
  - `auth` -> `auth.controller.ts`, `auth.service.ts`, `auth.route.ts`
  - `billing` -> `billing.controller.ts`, `billing.service.ts`, `billing.route.ts`
  - `fee` -> `fee.controller.ts`, `fee.service.ts`, `fee.route.ts`
  - `onboarding` -> `onboarding.controller.ts`, `onboarding.service.ts`, `onboarding.route.ts`
  - `role` -> `role.controller.ts`, `role.service.ts`, `role.route.ts`
  - `teacher` -> `teacher.controller.ts`, `teacher.service.ts`, `teacher.route.ts`
  - `notification` -> `notification.service.ts`
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
   - `Broadcast`: (`school`, `senderTeacherId`, `channel`, `messageBody`, `recipientCount`).
   - `MessageTemplate`: Reusable templates.

---

## API Map
- **Public & Auth**: `POST /api/auth/register`, `/admin/login`, `/teacher/login`, `/parent/login`, `/signup`, `/create-password`, `/forgot-password`, `/reset-password`, `/change-password`, `/otp/send`, `/otp/resend`, `/otp/verify`, `GET /api/auth/parent/schools`.
- **Public RBAC Metadata**: `GET /api/public/schools/{schoolId}/roles/{roleId}/permissions`, `/roles/by-name/{roleName}/permissions`.
- **Academic**: `GET/POST/PUT /api/academic/academic-years` (+ `/years`, `/active`, `/{id}/activate`, `/{id}/close`), `GET/POST/PUT /api/academic/grades` (and `/classes`), `/departments` (optional `?academicYearId=`), `POST /departments/assign-faculty`, `/sections` (optional `?academicYearId=`), `GET /sections/{id}/subjects`, `/subjects`, `/subjects/map-to-section` (accepts `subjectIds` list for single & multiple), `/subjects/assign-teacher`, `/subject-types`, `PATCH /sections/{id}/class-teacher`, `POST /api/academic/rollover`.
- **Onboarding**: `POST /api/onboarding/students` (+ `/bulk`), `POST /api/onboarding/teachers` (+ `/bulk`).
- **Teachers**: `GET /api/teachers` (all teachers of school; optional `?sectionId=`), `GET /api/teachers/section/{sectionId}` (teachers of particular section: homeroom + subjects).
- **Fee Management**: `GET /api/fee-invoices/search`, `GET/POST /api/fee/setup/components`, `/sections/{id}/structure`, `/late-fee-slabs`, `/bulk-discount-policies`, `POST /api/fee/payments/gateway`, `/manual-cash`, `/bulk`, `POST /api/fee/invoices/{id}/waiver`, `POST /api/fee/payments/{id}/refund`.
- **Billing**: `GET/POST/PUT /api/billing/plans`, `POST /api/billing/schools`, `/schools/{id}/subscription/override-cap`, `GET/POST /api/billing/subscription` (+ `/upgrade`), `GET/POST /api/billing/topups` (+ `/usage`).
- **Roles**: `GET/POST /api/roles`, `POST /api/roles/assign`.
- **Health**: `GET /`, `GET /health`, `GET /api/public/ping`.

---

## Guidelines
- **Diagram Generation Rule**: Do NOT regenerate or modify diagram files (`school-erp-lld.svg`, `school-erp-lld-diagram.html`, `generate_diagram_svg.py`, etc.) automatically. Only modify or regenerate diagrams when explicitly requested by the user.
- **CURL Request Rule**: When asked for cURL commands, output ONLY the cURL commands without any sample responses, explanations, or extra commentary. Always use base URL `https://miraculous-education-production-bee2.up.railway.app` and header `Authorization: Bearer {{authToken}}`.
