# School ERP — Low Level Design (LLD) Document
**System Architecture, Entity-Relationship Modeling & Database Specifications**

---

## 1. Executive Architecture & Design Principles

### 1.1 Multi-Tenant Isolation
- **Pattern**: Shared database with discriminator column (`school_id`).
- **Enforcement**: Hibernate ORM-level `@Filter(name = "tenantFilter", condition = "school_id = :schoolId")` parameterized per-request by `TenantFilterInterceptor`.
- **Super-Admin Bypass**: Super-Admin or public unauthenticated requests operate with `school_id = null`, disabling the filter for cross-tenant platform administration.

### 1.2 Primary Key & Financial Data Standards
- **Primary Keys**: Time-sequential UUIDs (`@UuidGenerator(style = UuidGenerator.Style.TIME)` on `BaseEntity`).
- **Monetary Fields**: Strict high-precision `DECIMAL(10,2)` across all financial ledgers, fee structures, invoices, and payment allocations.
- **Append-Only Policies**: `LateFeeSlab`, `BulkPaymentDiscountPolicy`, and `FeeWaiverLog` are never modified in-place; historical terms are sealed with `effective_to` and new slabs are inserted with `effective_from`.

### 1.3 Authorization Architecture
- **Layer 1 (Authentication)**: `JwtAuthFilter` extracts JWT claims (`actorType`, `actorId`, `schoolId`, `planCode`, `features`).
- **Layer 2 (Tenant Context)**: `TenantFilterInterceptor` activates Hibernate `tenantFilter`.
- **Layer 3 (RBAC Gateway)**: `SchoolErpPermissionEvaluator` evaluates SpEL `@PreAuthorize("hasPermission(null, 'CODE')")` against `PermissionService` (cached).
- **Layer 4 (Domain Rules)**: Service-level ownership validation (e.g., verifying teachers and sections belong to caller's school).

---

## 2. Master Unified Database Entity-Relationship Diagram

> **Visual Artifacts**:
> - **Interactive Browser Viewer (Zoom / Pan / Domain Filters)**: Open [school-erp-lld-diagram.html](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/school-erp-lld-diagram.html) in your browser.
> - **Standalone Vector Graphic**: View [school-erp-lld-diagram.svg](file:///Users/shubhamverma/Workspace%20Active%20Projects/school_erp/school-erp-lld-diagram.svg).

```mermaid
erDiagram
    %% Tenancy & Subscription
    SCHOOL ||--o| SCHOOL_SUBSCRIPTION : "current subscription"
    SCHOOL ||--o{ SCHOOL_SUBSCRIPTION : "subscription history"
    PLAN ||--o{ SCHOOL_SUBSCRIPTION : "subscribed under"
    PLAN ||--o{ PLAN_FEATURE : defines
    FEATURE ||--o{ PLAN_FEATURE : enables
    SCHOOL ||--o{ TOP_UP_PACK : purchases
    SCHOOL ||--o{ USAGE_LEDGER : tracks

    %% Identity & RBAC
    SCHOOL ||--o{ ADMIN : employs
    SCHOOL ||--o{ TEACHER : employs
    SCHOOL ||--o{ PARENT_ACCOUNT : registers
    SCHOOL ||--o{ ROLE : defines_custom
    ROLE ||--o{ ROLE_PERMISSION : contains
    PERMISSION ||--o{ ROLE_PERMISSION : grants
    ROLE ||--o{ ACTOR_ROLE_ASSIGNMENT : assigned_in

    %% Academic Setup (Anchor: Section)
    SCHOOL ||--o{ ACADEMIC_YEAR : schedules
    SCHOOL ||--o{ GRADE : defines
    SCHOOL ||--o{ DEPARTMENT : organizes
    SCHOOL ||--o{ SUBJECT : offers
    GRADE ||--o{ SECTION : groups
    ACADEMIC_YEAR ||--o{ SECTION : bounds
    TEACHER ||--o| SECTION : "class teacher"
    DEPARTMENT ||--o| TEACHER : "headed by HOD"
    TEACHER ||--o{ TEACHER_DEPARTMENT_MAP : belongs_to
    DEPARTMENT ||--o{ TEACHER_DEPARTMENT_MAP : has_teacher
    SECTION ||--o{ SECTION_SUBJECT_MAP : teaches
    SUBJECT ||--o{ SECTION_SUBJECT_MAP : included_in
    SECTION ||--o{ SECTION_SUBJECT_TEACHER : assigns
    SUBJECT ||--o{ SECTION_SUBJECT_TEACHER : for_subject
    TEACHER ||--o{ SECTION_SUBJECT_TEACHER : instructs

    %% Student Placement & Guardians
    SCHOOL ||--o{ STUDENT : enrolls
    PARENT_ACCOUNT ||--o{ GUARDIAN : holds
    STUDENT ||--o{ GUARDIAN : cared_by
    STUDENT ||--o{ ENROLLMENT : participates
    SECTION ||--o{ ENROLLMENT : accommodates

    %% Fee Management & Payments
    SCHOOL ||--o{ FEE_COMPONENT : establishes
    SECTION ||--o{ SECTION_FEE_STRUCTURE : prices
    FEE_COMPONENT ||--o{ SECTION_FEE_STRUCTURE : itemizes
    STUDENT ||--o{ FEE_INVOICE : billed
    ENROLLMENT ||--o{ FEE_INVOICE : based_on
    FEE_INVOICE ||--o{ FEE_INVOICE_LINE : itemized_by
    FEE_COMPONENT ||--o{ FEE_INVOICE_LINE : categorizes
    STUDENT ||--o{ PAYMENT : tenders
    PAYMENT ||--o{ PAYMENT_ALLOCATION : distributes
    FEE_INVOICE ||--o{ PAYMENT_ALLOCATION : settled_by
    FEE_INVOICE ||--o{ FEE_WAIVER_LOG : adjusted_by
    PAYMENT ||--o{ REFUND : reversed_by

    %% Communication
    SCHOOL ||--o{ BROADCAST : dispatches
    TEACHER ||--o{ BROADCAST : originates
    TEACHER ||--o| TEACHER_BROADCAST_QUOTA : allocated
    SCHOOL ||--o{ MESSAGE_TEMPLATE : stores

    %% Key Definitions
    SCHOOL {
        uuid id PK
        string name
        uuid current_subscription_id FK
        string status
    }
    PLAN {
        uuid id PK
        string code UK
        decimal monthly_price
        int student_cap
    }
    SCHOOL_SUBSCRIPTION {
        uuid id PK
        uuid school_id FK
        uuid plan_id FK
        string status
    }
    ADMIN {
        uuid id PK
        uuid school_id FK
        string msisdn UK
    }
    TEACHER {
        uuid id PK
        uuid school_id FK
        string employee_code UK
        string login_msisdn UK
    }
    PARENT_ACCOUNT {
        uuid id PK
        uuid school_id FK
        string msisdn UK
    }
    GRADE {
        uuid id PK
        uuid school_id FK
        string name
    }
    SECTION {
        uuid id PK
        uuid school_id FK
        uuid grade_id FK
        uuid academic_year_id FK
        uuid class_teacher_id FK
        string name
    }
    STUDENT {
        uuid id PK
        uuid school_id FK
        string student_code UK
        string name
    }
    ENROLLMENT {
        uuid id PK
        uuid student_id FK
        uuid section_id FK
        string status
    }
    GUARDIAN {
        uuid id PK
        uuid parent_account_id FK
        uuid student_id FK
        string relation
    }
    FEE_INVOICE {
        uuid id PK
        uuid student_id FK
        uuid enrollment_id FK
        string year_month UK
        decimal total_amount
        decimal balance
        string status
    }
    PAYMENT {
        uuid id PK
        uuid student_id FK
        decimal amount
        string mode
        string gateway_txn_id UK
    }
    PAYMENT_ALLOCATION {
        uuid id PK
        uuid payment_id FK
        uuid invoice_id FK
        decimal allocated_amount
    }
```


---

## 3. Module-by-Module Entity Relationships & Schemas

### 3.1 Tenancy & Billing Domain
Manages schools, subscription tiers, platform feature gating, and top-up quota ledgers.

```mermaid
erDiagram
    SCHOOL ||--o| SCHOOL_SUBSCRIPTION : "current subscription"
    SCHOOL ||--o{ SCHOOL_SUBSCRIPTION : "subscription history"
    PLAN ||--o{ SCHOOL_SUBSCRIPTION : "subscribed under"
    PLAN ||--o{ PLAN_FEATURE : defines
    FEATURE ||--o{ PLAN_FEATURE : enables
    SCHOOL ||--o{ TOP_UP_PACK : purchases
    SCHOOL ||--o{ USAGE_LEDGER : tracks

    SCHOOL {
        uuid id PK
        string name
        string address
        string contact_email
        string contact_phone
        uuid current_subscription_id FK
        string status "ACTIVE | SUSPENDED | ARCHIVED"
        timestamp created_at
        timestamp updated_at
    }

    PLAN {
        uuid id PK
        string code "BASIC | ADVANCE | PREMIUM | ENTERPRISE"
        string display_name
        decimal monthly_price "10,2"
        decimal yearly_price "10,2"
        int student_cap
        int teacher_cap
        int sms_quota
        int whatsapp_quota
        boolean active
        text features_json
        timestamp created_at
        timestamp updated_at
    }

    FEATURE {
        uuid id PK
        string code UK
        string description
        timestamp created_at
        timestamp updated_at
    }

    PLAN_FEATURE {
        uuid id PK
        uuid plan_id FK
        uuid feature_id FK
        boolean enabled
        timestamp created_at
        timestamp updated_at
    }

    SCHOOL_SUBSCRIPTION {
        uuid id PK
        uuid school_id FK
        uuid plan_id FK
        string billing_cycle "MONTHLY | YEARLY"
        date start_date
        date end_date
        string status "ACTIVE | EXPIRED | CANCELLED | UPGRADED"
        int override_max_students "Super Admin cap override"
        int override_max_teachers "Super Admin cap override"
        uuid overridden_by_super_admin_id
        string override_reason
        timestamp overridden_at
        string change_reason
        timestamp created_at
        timestamp updated_at
    }

    TOP_UP_PACK {
        uuid id PK
        uuid school_id FK
        string channel "SMS | WHATSAPP"
        int credits_purchased
        decimal cost_paid "10,2"
        timestamp purchased_at
        timestamp created_at
        timestamp updated_at
    }

    USAGE_LEDGER {
        uuid id PK
        uuid school_id FK
        string channel "SMS | WHATSAPP"
        string year_month "YYYY-MM"
        int plan_credits_used
        int top_up_credits_used
        timestamp created_at
        timestamp updated_at
    }

    SUPER_ADMIN {
        uuid id PK
        string email UK
        string password_hash
        string name
        timestamp created_at
        timestamp updated_at
    }
```

---

### 3.2 Identity & Role-Based Access Control (RBAC) Domain
Manages identities (Admin, Teacher, Parent), system & custom roles, polymorphic role assignments, and token sessions.

```mermaid
erDiagram
    SCHOOL ||--o{ ADMIN : employs
    SCHOOL ||--o{ TEACHER : employs
    SCHOOL ||--o{ PARENT_ACCOUNT : registers
    SCHOOL ||--o{ ROLE : defines_custom
    ROLE ||--o{ ROLE_PERMISSION : contains
    PERMISSION ||--o{ ROLE_PERMISSION : grants
    ROLE ||--o{ ACTOR_ROLE_ASSIGNMENT : assigned_to

    ADMIN {
        uuid id PK
        uuid school_id FK
        string name
        string email
        string msisdn UK
        string password_hash
        string status "ACTIVE | INACTIVE"
        timestamp created_at
        timestamp updated_at
    }

    TEACHER {
        uuid id PK
        uuid school_id FK
        string employee_code "UK with school_id"
        string name
        string email
        string login_msisdn UK
        string msisdn_alt1
        string msisdn_alt2
        date dob
        string gender
        string address
        string emergency_contact
        string aadhar_no
        string pan_no
        string bank_acc_no
        string bank_name
        string blood_group
        date date_of_joining
        string designation
        string password_hash
        boolean password_set
        string status "ACTIVE | INACTIVE"
        timestamp created_at
        timestamp updated_at
    }

    PARENT_ACCOUNT {
        uuid id PK
        uuid school_id FK
        string msisdn "UK with school_id"
        string name
        string email
        string password_hash
        boolean password_set
        string status "ACTIVE | INACTIVE"
        timestamp created_at
        timestamp updated_at
    }

    ROLE {
        uuid id PK
        uuid school_id FK "null for system roles"
        string name
        boolean system_role
        string description
        timestamp created_at
        timestamp updated_at
    }

    PERMISSION {
        uuid id PK
        string code UK
        string module
        string description
        timestamp created_at
        timestamp updated_at
    }

    ROLE_PERMISSION {
        uuid role_id PK, FK
        uuid permission_id PK, FK
    }

    ACTOR_ROLE_ASSIGNMENT {
        uuid id PK
        string actor_type "ADMIN | TEACHER | PARENT | SUPER_ADMIN"
        uuid actor_id "Polymorphic FK"
        uuid role_id FK
        uuid assigned_by
        timestamp assigned_at
        timestamp created_at
        timestamp updated_at
    }

    AUTH_SESSION {
        uuid id PK
        string actor_type
        uuid actor_id
        string device_id
        string token_hash "Hex representation of token.hashCode()"
        timestamp expires_at
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    OTP_REQUEST {
        uuid id PK
        string msisdn
        string otp_hash "BCrypt hash of 6-digit OTP"
        string purpose "LOGIN | RESET_PASSWORD"
        timestamp expires_at
        timestamp verified_at
        timestamp created_at
        timestamp updated_at
    }
```

---

### 3.3 Academic Setup Domain
The core structural skeleton of classes, sections, departments, subjects, and teaching allocations.

> **Key Architectural Pattern: The Anchor Entity**
> `Section` is the foundational anchor entity. It is recreated per academic year. All fee structures, student enrollments, subject curriculum maps, and class teacher allocations attach to `Section` rather than `Grade` or `Student`.

```mermaid
erDiagram
    SCHOOL ||--o{ ACADEMIC_YEAR : schedules
    SCHOOL ||--o{ GRADE : defines
    SCHOOL ||--o{ DEPARTMENT : organizes
    SCHOOL ||--o{ SUBJECT : offers
    GRADE ||--o{ SECTION : groups
    ACADEMIC_YEAR ||--o{ SECTION : bounds
    TEACHER ||--o| SECTION : "class teacher"
    DEPARTMENT ||--o| TEACHER : "headed by HOD"
    TEACHER ||--o{ TEACHER_DEPARTMENT_MAP : joins
    DEPARTMENT ||--o{ TEACHER_DEPARTMENT_MAP : contains
    DEPARTMENT ||--o{ SUBJECT : categorizes
    SECTION ||--o{ SECTION_SUBJECT_MAP : teaches
    SUBJECT ||--o{ SECTION_SUBJECT_MAP : included_in
    SECTION ||--o{ SECTION_SUBJECT_TEACHER : assigns
    SUBJECT ||--o{ SECTION_SUBJECT_TEACHER : assigned_for
    TEACHER ||--o{ SECTION_SUBJECT_TEACHER : instructs

    ACADEMIC_YEAR {
        uuid id PK
        uuid school_id FK
        string name "e.g. 2026-2027"
        date start_date
        date end_date
        string status "ACTIVE | COMPLETED"
        timestamp created_at
        timestamp updated_at
    }

    GRADE {
        uuid id PK
        uuid school_id FK
        string name "e.g. Grade 10"
        int sequence_order
        timestamp created_at
        timestamp updated_at
    }

    DEPARTMENT {
        uuid id PK
        uuid school_id FK
        string name "e.g. Science"
        string code "e.g. SCI"
        uuid hod_teacher_id FK
        timestamp created_at
        timestamp updated_at
    }

    TEACHER_DEPARTMENT_MAP {
        uuid id PK
        uuid teacher_id FK
        uuid department_id FK
        timestamp created_at
        timestamp updated_at
    }

    SECTION {
        uuid id PK
        uuid school_id FK
        uuid grade_id FK
        uuid academic_year_id FK
        string name "e.g. Section A"
        uuid class_teacher_id FK
        int capacity
        timestamp created_at
        timestamp updated_at
    }

    SUBJECT {
        uuid id PK
        uuid school_id FK
        string name "e.g. Mathematics"
        string code "e.g. MATH10"
        uuid department_id FK
        timestamp created_at
        timestamp updated_at
    }

    SECTION_SUBJECT_MAP {
        uuid id PK
        uuid section_id FK
        uuid subject_id FK
        timestamp created_at
        timestamp updated_at
    }

    SECTION_SUBJECT_TEACHER {
        uuid id PK
        uuid section_id FK
        uuid subject_id FK
        uuid teacher_id FK
        timestamp created_at
        timestamp updated_at
    }
```

---

### 3.4 Student Management & Onboarding Domain
Separates permanent student identity from year-scoped classroom enrollment, mapped with guardian accounts.

```mermaid
erDiagram
    SCHOOL ||--o{ STUDENT : enrolls
    PARENT_ACCOUNT ||--o{ GUARDIAN : holds
    STUDENT ||--o{ GUARDIAN : cared_by
    STUDENT ||--o{ ENROLLMENT : participates
    SECTION ||--o{ ENROLLMENT : accommodates

    STUDENT {
        uuid id PK
        uuid school_id FK
        string student_code "UK with school_id"
        string name
        string email
        string phone
        date dob
        string address
        string emergency_contact
        string gender
        string aadhar_no
        string blood_group
        string nationality
        date date_of_admission
        string previous_school
        timestamp created_at
        timestamp updated_at
    }

    ENROLLMENT {
        uuid id PK
        uuid student_id FK
        uuid section_id FK
        string roll_no
        timestamp enrolled_at
        string status "ACTIVE | PROMOTED | TRANSFERRED | WITHDRAWN"
        timestamp created_at
        timestamp updated_at
    }

    GUARDIAN {
        uuid id PK
        uuid parent_account_id FK
        uuid student_id FK
        string relation "Father | Mother | Guardian"
        string occupation
        string address
        boolean is_primary
        timestamp created_at
        timestamp updated_at
    }
```

> **Key Database Constraint: Single Active Enrollment**
> To prevent duplicate active school placements:
> ```sql
> CREATE UNIQUE INDEX ux_enrollment_one_active ON enrollment(student_id) WHERE status = 'ACTIVE';
> ```

---

### 3.5 Fee Management, Billing & Payment Allocation Domain
End-to-end fee lifecycle handling recurring invoices, effective-dated penalties & discounts, payments, allocations, waivers, and non-destructive refunds.

```mermaid
erDiagram
    SCHOOL ||--o{ FEE_COMPONENT : establishes
    SECTION ||--o{ SECTION_FEE_STRUCTURE : configures
    FEE_COMPONENT ||--o{ SECTION_FEE_STRUCTURE : itemizes
    STUDENT ||--o{ FEE_INVOICE : billed
    ENROLLMENT ||--o{ FEE_INVOICE : based_on
    FEE_INVOICE ||--o{ FEE_INVOICE_LINE : itemized_by
    FEE_COMPONENT ||--o{ FEE_INVOICE_LINE : categorizes
    STUDENT ||--o{ PAYMENT : tenders
    PAYMENT ||--o{ PAYMENT_ALLOCATION : distributes
    FEE_INVOICE ||--o{ PAYMENT_ALLOCATION : settled_by
    FEE_INVOICE ||--o{ FEE_WAIVER_LOG : adjusted_by
    PAYMENT ||--o{ REFUND : reversed_by

    FEE_COMPONENT {
        uuid id PK
        uuid school_id FK
        string name "e.g. Tuition Fee"
        string code "e.g. TUITION"
        timestamp created_at
        timestamp updated_at
    }

    SECTION_FEE_STRUCTURE {
        uuid id PK
        uuid section_id FK
        uuid fee_component_id FK
        decimal amount "10,2"
        string frequency "MONTHLY | ONE_TIME | ANNUAL"
        timestamp created_at
        timestamp updated_at
    }

    LATE_FEE_SLAB {
        uuid id PK
        uuid school_id FK
        int days_overdue_from
        int days_overdue_to
        decimal amount "10,2"
        date effective_from
        date effective_to
    }

    BULK_PAYMENT_DISCOUNT_POLICY {
        uuid id PK
        uuid school_id FK
        uuid grade_id FK "nullable for school-wide default"
        int months_count "3 | 6 | 12"
        decimal discount_percentage "5,2"
        date effective_from
        date effective_to
    }

    FEE_INVOICE {
        uuid id PK
        uuid student_id FK
        uuid enrollment_id FK
        string year_month "YYYY-MM (UK with student_id)"
        date due_date
        decimal total_amount "10,2"
        decimal late_fee_amount "10,2"
        decimal discount_amount "10,2"
        decimal paid_amount "10,2"
        decimal balance "10,2"
        string status "PENDING | PARTIAL | PAID | OVERDUE"
        timestamp generated_at
        timestamp created_at
        timestamp updated_at
    }

    FEE_INVOICE_LINE {
        uuid id PK
        uuid invoice_id FK
        uuid fee_component_id FK
        decimal amount "10,2"
    }

    PAYMENT {
        uuid id PK
        uuid student_id FK
        decimal amount "10,2"
        string mode "UPI | CARD | CASH"
        string gateway_txn_id UK "nullable for CASH"
        uuid paid_by_guardian_id
        uuid recorded_by_admin_id
        timestamp paid_at
        string status "SUCCESS | FAILED | PENDING"
    }

    PAYMENT_ALLOCATION {
        uuid id PK
        uuid payment_id FK
        uuid invoice_id FK
        decimal allocated_amount "10,2"
    }

    FEE_WAIVER_LOG {
        uuid id PK
        uuid invoice_id FK
        uuid waived_by_admin_id
        decimal original_late_fee "10,2"
        string reason
        timestamp waived_at
    }

    REFUND {
        uuid id PK
        uuid payment_id FK
        decimal amount "10,2"
        string mode "CREDIT_ADJUSTMENT | MANUAL_CASH"
        string reason
        uuid approved_by_admin_id
        timestamp processed_at
    }
```

---

### 3.6 Communication Hub Domain
Notification records, messaging quota management, and message templates.

```mermaid
erDiagram
    SCHOOL ||--o{ BROADCAST : sends
    TEACHER ||--o{ BROADCAST : originates
    TEACHER ||--o| TEACHER_BROADCAST_QUOTA : allocated
    SCHOOL ||--o{ MESSAGE_TEMPLATE : stores

    BROADCAST {
        uuid id PK
        uuid school_id FK
        uuid sender_teacher_id FK
        string channel "SMS | WHATSAPP | IN_APP"
        text message_body
        int recipient_count "frozen at send time"
        timestamp scheduled_at
        timestamp sent_at
        string status "SCHEDULED | SENT | FAILED"
        timestamp created_at
        timestamp updated_at
    }

    TEACHER_BROADCAST_QUOTA {
        uuid id PK
        uuid teacher_id FK
        int quota
        timestamp created_at
        timestamp updated_at
    }

    MESSAGE_TEMPLATE {
        uuid id PK
        uuid school_id FK
        string code
        string channel "SMS | WHATSAPP"
        text template_body
        timestamp created_at
        timestamp updated_at
    }
```

---

## 4. Complete Database Table Dictionary

| Table Name | Primary Key | Foreign Keys / Scoping | Indexes & Unique Constraints | Core Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| `school` | `id` (UUID) | `current_subscription_id` -> `school_subscription(id)` | PK index | Root tenant entity. |
| `plan` | `id` (UUID) | None | `code` UNIQUE | Subscription tier catalog. |
| `feature` | `id` (UUID) | None | `code` UNIQUE | Granular feature items for plans. |
| `plan_feature` | `id` (UUID) | `plan_id` -> `plan(id)`, `feature_id` -> `feature(id)` | UNIQUE(`plan_id`, `feature_id`) | Feature gating per plan. |
| `school_subscription` | `id` (UUID) | `school_id` -> `school(id)`, `plan_id` -> `plan(id)` | Index(`school_id`, `status`) | Active & historic subscription log. |
| `top_up_pack` | `id` (UUID) | `school_id` -> `school(id)` | Index(`school_id`, `channel`) | SMS/WhatsApp credit packages. |
| `usage_ledger` | `id` (UUID) | `school_id` -> `school(id)` | UNIQUE(`school_id`, `channel`, `year_month`) | Monthly credit usage tracking. |
| `super_admin` | `id` (UUID) | None | `email` UNIQUE | Platform owner credentials. |
| `admin` | `id` (UUID) | `school_id` -> `school(id)` | `msisdn` UNIQUE | School administrator account. |
| `teacher` | `id` (UUID) | `school_id` -> `school(id)` | `login_msisdn` UNIQUE, UNIQUE(`school_id`, `employee_code`) | Teaching staff account. |
| `parent_account` | `id` (UUID) | `school_id` -> `school(id)` | UNIQUE(`school_id`, `msisdn`) | Guardian account scoped to school. |
| `guardian` | `id` (UUID) | `parent_account_id` -> `parent_account(id)`, `student_id` -> `student(id)` | Index(`parent_account_id`), Index(`student_id`) | Parent-Student association. |
| `auth_session` | `id` (UUID) | Polymorphic `(actor_type, actor_id)` | Index(`actor_type`, `actor_id`, `active`) | Enforces single active session per actor. |
| `otp_request` | `id` (UUID) | None | Index(`msisdn`, `verified_at`) | OTP lifecycle and verification log. |
| `role` | `id` (UUID) | `school_id` -> `school(id)` (`null` for system) | UNIQUE(`school_id`, `name`) | System & custom RBAC roles. |
| `permission` | `id` (UUID) | None | `code` UNIQUE | Fine-grained capability definitions. |
| `role_permission` | `(role_id, permission_id)` | FKs to `role(id)` & `permission(id)` | Compound PK | Maps capabilities to roles. |
| `actor_role_assignment`| `id` (UUID) | Polymorphic `(actor_type, actor_id)`, `role_id` -> `role(id)`| Index(`actor_type`, `actor_id`) | Assigns roles to polymorphic actors. |
| `academic_year` | `id` (UUID) | `school_id` -> `school(id)` | Index(`school_id`, `status`) | School operational session. |
| `grade` | `id` (UUID) | `school_id` -> `school(id)` | Index(`school_id`, `sequence_order`) | Year-independent grade labels. |
| `department` | `id` (UUID) | `school_id` -> `school(id)`, `hod_teacher_id` -> `teacher(id)` | UNIQUE(`school_id`, `code`) | Academic departments. |
| `teacher_department_map`| `id` (UUID) | `teacher_id` -> `teacher(id)`, `department_id` -> `department(id)` | UNIQUE(`teacher_id`, `department_id`) | Teacher department associations. |
| `section` | `id` (UUID) | `school_id`, `grade_id`, `academic_year_id`, `class_teacher_id` | UNIQUE(`grade_id`, `academic_year_id`, `name`) | **Anchor Entity** for classes. |
| `subject` | `id` (UUID) | `school_id` -> `school(id)`, `department_id` -> `department(id)` | UNIQUE(`school_id`, `code`) | Subject definitions. |
| `section_subject_map` | `id` (UUID) | `section_id` -> `section(id)`, `subject_id` -> `subject(id)` | UNIQUE(`section_id`, `subject_id`) | Curriculum per section. |
| `section_subject_teacher`| `id` (UUID) | `section_id`, `subject_id`, `teacher_id` | UNIQUE(`section_id`, `subject_id`, `teacher_id`) | Subject teacher assignment. |
| `student` | `id` (UUID) | `school_id` -> `school(id)` | UNIQUE(`school_id`, `student_code`) | Permanent student identity. |
| `enrollment` | `id` (UUID) | `student_id` -> `student(id)`, `section_id` -> `section(id)` | Partial UNIQUE on `student_id` WHERE `status = 'ACTIVE'` | Year-scoped section placement. |
| `fee_component` | `id` (UUID) | `school_id` -> `school(id)` | UNIQUE(`school_id`, `code`) | Fee heads (Tuition, Transport, etc.). |
| `section_fee_structure`| `id` (UUID) | `section_id` -> `section(id)`, `fee_component_id` -> `fee_component(id)`| UNIQUE(`section_id`, `fee_component_id`) | Section pricing model. |
| `late_fee_slab` | `id` (UUID) | `school_id` -> `school(id)` | Append-only (`effective_from`, `effective_to`) | Overdue penalty schedules. |
| `bulk_payment_discount_policy`| `id` (UUID)| `school_id` -> `school(id)`, `grade_id` (nullable) | Append-only (`effective_from`, `effective_to`) | Advance payment discount rules. |
| `fee_invoice` | `id` (UUID) | `student_id` -> `student(id)`, `enrollment_id` -> `enrollment(id)` | UNIQUE(`student_id`, `year_month`) | Monthly billing records. |
| `fee_invoice_line` | `id` (UUID) | `invoice_id` -> `fee_invoice(id)`, `fee_component_id` | Index(`invoice_id`) | Line items for fee invoices. |
| `payment` | `id` (UUID) | `student_id` -> `student(id)` | `gateway_txn_id` UNIQUE (nullable for CASH) | Payment transaction logs. |
| `payment_allocation`| `id` (UUID) | `payment_id` -> `payment(id)`, `invoice_id` -> `fee_invoice(id)` | Index(`payment_id`), Index(`invoice_id`) | Payment-to-invoice allocations. |
| `fee_waiver_log` | `id` (UUID) | `invoice_id` -> `fee_invoice(id)` | Index(`invoice_id`) | Audit log of waived late fees. |
| `refund` | `id` (UUID) | `payment_id` -> `payment(id)` | Index(`payment_id`) | Refund transactions. |
| `broadcast` | `id` (UUID) | `school_id` -> `school(id)`, `sender_teacher_id` -> `teacher(id)` | Index(`school_id`, `status`) | Broadcast messages. |
| `teacher_broadcast_quota`| `id` (UUID)| `teacher_id` -> `teacher(id)` | `teacher_id` UNIQUE | Quota per teacher. |
| `message_template` | `id` (UUID) | `school_id` -> `school(id)` | UNIQUE(`school_id`, `code`) | Pre-configured message templates. |

---

## 5. Architectural Invariants & Critical Flow Mechanisms

### 5.1 The Anchor Section Model
```mermaid
flowchart TD
    AY[Academic Year 2026-2027] --> Sec[Section 10-A Anchor Entity]
    GR[Grade: Grade 10] --> Sec
    CT[Teacher: Class Teacher] --> Sec
    Sec --> SFS[SectionFeeStructure: Pricing]
    Sec --> SSM[SectionSubjectMap: Curriculum]
    SSM --> SST[SectionSubjectTeacher: Teacher Assignment]
    Sec --> Enr[Enrollment: Student Placements]
```
- **Rationale**: Re-creating `Section` each academic year isolates student promotions and transfers to simple updates on `enrollment.section_id`. Curriculum, pricing, and teachers remain tightly bounded to the section.

### 5.2 Atomic Onboarding & Isolated Bulk Uploads
```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Controller as StudentOnboardingController
    participant Service as StudentOnboardingService
    participant Cap as CapacityCheckService
    participant DB as PostgreSQL Database

    Admin->>Controller: POST /api/onboarding/students (Single)
    Controller->>Service: onboardSingle(request)
    Service->>Cap: assertCanAddStudent(schoolId)
    Cap-->>Service: Cap valid (Current < overrideMax ?? planCap)
    rect rgb(240, 248, 255)
    Note over Service,DB: Single Atomic @Transactional Boundary
    Service->>DB: INSERT student
    Service->>DB: INSERT enrollment (status: ACTIVE)
    Service->>DB: INSERT parent_account (if phone new to school)
    Service->>DB: INSERT guardian (maps parent to student)
    Service->>DB: INSERT actor_role_assignment (PARENT role)
    end
    Service-->>Controller: StudentResponse
    Controller-->>Admin: 201 Created

    Admin->>Controller: POST /api/onboarding/students/bulk (CSV)
    loop Each CSV Row
        Service->>Service: onboardRowIsolated(row) [REQUIRES_NEW]
        alt Valid Row
            Service->>DB: Commit row transaction
        else Invalid Row (e.g. Bad section, duplicate code)
            Service->>DB: Rollback row transaction only
            Service->>Service: Record RowError (rowNumber, reason)
        end
    end
    Controller-->>Admin: BulkUploadResult (total, success, failed, errors[])
```

### 5.3 Payment Allocation & Refund Isolation
```mermaid
flowchart LR
    P[Payment Record] -->|Allocates to| A1[PaymentAllocation: Inv 1]
    P -->|Allocates to| A2[PaymentAllocation: Inv 2]
    A1 --> I1[FeeInvoice: Month 1]
    A2 --> I2[FeeInvoice: Month 2]
    R[Refund Record] -.->|References without mutating| P
    R -->|Mode: CREDIT_ADJUSTMENT| I3[Applies to earliest outstanding invoice]
    R -->|Mode: MANUAL_CASH| CashOut[Physical cash payout recorded]
```
- **Idempotency**: Webhook retries match on `payment.gateway_txn_id` UNIQUE constraint and result in safe no-ops.
- **Immutability**: `Payment` is strictly immutable. Refunds generate separate append-only `Refund` records to preserve audit integrity.
