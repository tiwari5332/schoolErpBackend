# School ERP — Backend Skeleton

Matches the LLD doc (`school-erp-lld.md`) module-for-module. Read this before you start filling gaps — it tells you exactly what's real and what's a pattern to replicate.

## 🚀 Quick Environment & API Reference

- **Production Base URL**: `https://miraculous-education-production-bee2.up.railway.app`
- **Primary Key Strategy**: Time-sequential UUIDs (`@UuidGenerator(style = UuidGenerator.Style.TIME)` on `BaseEntity`).

### Whitelisted (Unauthenticated) Endpoints (`.permitAll()`)
- `GET /` & `GET /health` & `GET /api/public/ping`
- `POST /api/auth/register` (School Onboarding)
- `POST /api/auth/admin/login` & `POST /api/auth/teacher/login` & `POST /api/auth/parent/login`
- `GET /api/public/schools/{schoolId}/roles/{roleId}/permissions` (Role permissions by Role ID)
- `GET /api/public/schools/{schoolId}/roles/by-name/{roleName}/permissions` (Role permissions by Role Name)
- `GET /api/roles`, `POST /api/roles`, `POST /api/roles/assign` (Role Management)

---

## What's fully built

- **Every entity** across all 7 groups (tenancy, identity, RBAC, academic, student, fee, communication) — with the constraints we hardened: `DECIMAL(10,2)` money fields, per-school unique codes, `gateway_txn_id` uniqueness, effective-dated fee policies, `Broadcast.recipientCount` frozen at send time.
- **Every repository**, including the ones backing the LLD's numbered SQL queries (4.1–4.8) as real Spring Data / JPQL — `FeeInvoiceRepository.searchWithFilters`, `ActorRoleAssignmentRepository.findEffectivePermissionCodes`, `AuthSessionRepository.deactivateAllActiveSessions`, `ParentAccountRepository`/`GuardianRepository` for the two-step parent login.
- **The full 3-layer authorization flow** we walked through: `JwtAuthFilter` (auth) → `SchoolErpPermissionEvaluator` + `PermissionService` (coarse RBAC gate, cached) → `TenantFilterInterceptor` (Hibernate `@Filter`-based tenant isolation, §5 of the LLD). `SecurityConfig` wires all three into one filter chain.
- **RBAC end to end**: `Role`/`Permission`/`RolePermission`/`ActorRoleAssignment` entities, `RbacService.assignRole`, `RoleController` for Admin's "Manage Roles" screen, and `V2__seed_rbac.sql` seeding the 4 system roles + a starter permission catalog.
- **Academic Setup module, complete** (`DepartmentController`/`Service`, `ClassMasterController`/`Service`, `SectionController`/`Service`, `SubjectController`/`Service`) — Department create/update/delete with HOD-must-be-a-teacher-at-this-school validation, Class+Section setup with cross-entity tenant checks and duplicate-section-name rejection, Section↔Subject and Subject↔Teacher mapping with duplicate-pair rejection. Every write endpoint is `@Valid` (DTO) + `@PreAuthorize(hasPermission(...))` (RBAC) + service-layer business-rule checks — see "Validation, three layers" below.
- **Onboarding module, complete** (`StudentOnboardingController`/`Service`, `TeacherOnboardingController`/`Service`) — single onboarding creates Student + Enrollment + Guardian (+ ParentAccount if new) **atomically in one transaction**, matching "no separate enrollment step." Bulk CSV upload for both, via Apache Commons CSV, with **each row processed in its own `REQUIRES_NEW` transaction** — a bad row 47 doesn't roll back the 46 that succeeded; failures come back as a structured per-row report (`BulkUploadResult`). Teacher onboarding generates a random temporary password server-side (`SecureRandom` + BCrypt) — **never** returned in the API response, only a confirmation flag; actually sending it via SMS/WhatsApp is a flagged TODO pending the Communication Hub module.
- **Settings/Billing module, complete** (`PlanController`, `SchoolController`, `SubscriptionController`, `TopUpController` + matching services) — Super-Admin-only plan catalog management and school onboarding (creates School + initial Admin with a random temp password, same never-return-it-raw pattern, + first `SchoolSubscription`, atomically); Admin-facing subscription view/upgrade (**no mid-cycle proration** — upgrading closes out the old subscription and starts a fresh one, preserving history rather than mutating it); Super-Admin cap override with the mandatory reason/timestamp audit trail; top-up pack purchase; and **`UsageLedgerService.consumeOne`**, which implements the plan-quota-then-oldest-top-up consumption order from the LLD. **`CapacityCheckService` is now wired into both onboarding services** — `StudentOnboardingService`/`TeacherOnboardingService` call it before writing a new row, so the plan's student/teacher cap (respecting a Super Admin override) is actually enforced, not just described.
- **Fee Management module, complete** (`FeeSetupController`, `FeePaymentController`, `FeeWaiverController`, `RefundController` + matching services) — fee component and per-section structure setup; **`LateFeeSlabService`/`BulkDiscountPolicyService`** implement the append-only, effective-dated pattern (close-out-then-replace, never edit in place — an already-billed invoice keeps the slab/discount that was live when it was calculated); **`LateFeeAutoApplyService`** is a real `@Scheduled` nightly sweep implementing LLD query 4.3, deliberately running outside tenant scope (cross-school by design, since it's a background job, not a request) and skipping any invoice with a `FeeWaiverLog` so a manual waiver never gets silently overwritten; **`FeeWaiverService`** with the mandatory audit trail; **`RefundService`** handling both `CREDIT_ADJUSTMENT` (applied to the earliest outstanding invoice) and `MANUAL_CASH` modes without ever mutating the original `Payment`; **`BulkPaymentService`** resolves class-scoped-then-school-scoped discount policy, generates any not-yet-existing invoices for the requested month range, distributes the discount proportionally across them, and records one `Payment` allocated across all of them via the now-shared `PaymentService` (extended this pass with a `recordManualCashPayment` path and an amount-sum validation that was missing before).
- **Global exception handling** (`GlobalExceptionHandler`) — Bean Validation failures, business-rule violations, not-found, and access-denied all return a consistent `ApiError` JSON shape instead of a generic 500 or Spring's default verbose validation body.
- **Tenant filter is now real, not just described** — `@FilterDef`/`@Filter` added to `Department`, `ClassMaster`, `Section`, `Subject`, `AcademicYear`. With `TenantFilterInterceptor` enabling the filter per-request, `findById()` on a row belonging to another school now returns empty instead of leaking it — closes README gap #5, for these five entities. The same annotations still need adding to the remaining `TenantScoped` entities (tenancy, fee, identity, communication modules).
- **Five working services** covering the trickiest logic: `AuthService` (single-session enforcement, parent school-picker), `PromotionService` (the Section-anchored promotion from LLD query 4.4), `FeeInvoiceGenerationService` (idempotent monthly batch generation, no proration), `PaymentService` (idempotent gateway webhook handling, bulk-payment allocation).
- **Three general-purpose controllers** wired to real permission checks (`AuthController`, `RoleController`, `FeeInvoiceController`) as a template for the rest.

### Validation, three layers (Academic Setup as the reference implementation)

1. **DTO / API boundary** — Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Min`) on every request record, enforced via `@Valid` in the controller. Malformed input never reaches a service method.
2. **RBAC (coarse authorization)** — `@PreAuthorize("hasPermission(null, 'ACADEMIC_SETUP_MANAGE')")` on every write endpoint, `ACADEMIC_SETUP_VIEW` on reads. Resolved through `PermissionService` (cached).
3. **Business rules (domain validation)** — in the service layer, after the DTO already passed syntactic validation: HOD/class-teacher/subject-teacher must belong to the caller's school, section names must be unique within (class, year), section-subject and subject-teacher pairs can't be duplicated. These throw `BusinessRuleException`, caught centrally by `GlobalExceptionHandler` and returned as `409 CONFLICT` with a clear message.

Layer 3 (ownership — "does this Teacher actually teach in this Section") is still not wired in anywhere, Academic Setup included — see the gap list below, unchanged from before.

## What's intentionally NOT built — and why

This is the honest part. Building genuinely correct, tested code for all ~30 entities × full CRUD × validation × error handling in one pass would produce code nobody actually reviewed carefully — worse than not having it. What's missing, in priority order for you to tackle next:

1. **Communication Hub is the only module with zero service/controller code left.** `UsageLedgerService.consumeOne` is ready for its Broadcast-send path to call once that module exists, but nothing calls it yet.
2. **`TopUpService.purchase` and `SchoolOnboardingService`/subscription upgrade skip real payment gateway confirmation** — both provision immediately rather than waiting on a gateway callback. Flagged inline with a `TODO`; do not deploy as-is for anything that should only activate after payment actually clears.
3. **Two assumed defaults in `BulkPaymentService`, flagged inline, not hidden:** the due-date-is-the-10th-of-each-month convention, and the class-scoped-then-school-scoped discount fallback order — neither was explicitly specified in the requirements; confirm both before relying on them.
4. **`LateFeeAutoApplyService`'s nightly sweep now has a real default schedule** (2 AM daily, `application.yml` → `app.late-fee-sweep.cron`, overridable via `LATE_FEE_SWEEP_CRON`) — confirm that timing actually fits your fee-due-date conventions before relying on it in production.
5. **Replace the illustrative `findAll().stream().anyMatch(...)` / `.filter(...)` lookups** in `SectionService`, `SubjectService`, `StudentOnboardingService`, `TeacherOnboardingService`, `LateFeeAutoApplyService`, `RefundService`, and `BulkPaymentService` with real indexed repository queries before any of this touches production data volume — correct but O(n) per call, called out inline in each file, not hidden.
6. **Layer 3 (ownership) checks** — e.g. "does this Teacher actually teach in this Section" before returning student data to them. `SectionSubjectTeacherRepository.findAllByTeacher_Id` is there to support this, but no service method calls it yet. This is the single most important thing to add before this touches real student data — it's the gap we spent real time on in the RBAC discussion.
7. **Real DDL in `V1__init_schema.sql`** — still a placeholder comment. Now needs to cover the fee module's constraints too (e.g. `FeeInvoice` unique on `(student_id, year_month)`, `Payment.gateway_txn_id` unique) alongside everything listed before. `ddl-auto: validate` means the app refuses to start until the DDL matches every entity, including the ones added this pass.
8. **OTP send/verify endpoints** — `OtpRequest` entity and repository exist; no controller/service sends or verifies one yet.
9. **`@FilterDef`/`@Filter` still missing on the fee and communication module entities** — `FeeInvoice`, `Payment`, `Broadcast`, etc. still need the same two-line addition already applied to Academic Setup and Onboarding's entities.
10. **Tests.** None written. Do not treat this as a green light to skip them — for a production system handling money and student PII, this is the least optional item on this list.

## Running it (once the above gaps are filled)

```
mvn spring-boot:run
```

Needs Postgres reachable at the URL in `application.yml` (override via `DB_USERNAME`/`DB_PASSWORD` env vars), and a real `JWT_SECRET` — the default in `application.yml` is a placeholder, not something to deploy with.
