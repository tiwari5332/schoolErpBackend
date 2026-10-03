-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "contactEmail" VARCHAR(255) NOT NULL,
    "contactPhone" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "schoolId" VARCHAR(20),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "yearly_price" DECIMAL(10,2) NOT NULL,
    "student_cap" INTEGER NOT NULL,
    "teacher_cap" INTEGER NOT NULL,
    "sms_quota" INTEGER NOT NULL,
    "whatsapp_quota" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "features_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_subscriptions" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "billing_cycle" VARCHAR(20) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "override_max_students" INTEGER,
    "override_max_teachers" INTEGER,
    "overridden_by_super_admin_id" UUID,
    "override_reason" TEXT,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_up_packs" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "credits_purchased" INTEGER NOT NULL,
    "cost_paid" DECIMAL(10,2) NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_up_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_ledgers" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "year_month" VARCHAR(7) NOT NULL,
    "plan_credits_used" INTEGER NOT NULL DEFAULT 0,
    "top_up_credits_used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "msisdn" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "employee_code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "login_msisdn" VARCHAR(50) NOT NULL,
    "msisdns" TEXT,
    "dob" TIMESTAMP(3),
    "gender" VARCHAR(20),
    "address" TEXT,
    "aadhar_no" VARCHAR(50),
    "pan_no" VARCHAR(50),
    "bank_details" TEXT,
    "date_of_joining" TIMESTAMP(3),
    "designation" VARCHAR(100),
    "password_hash" VARCHAR(255),
    "password_set" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_accounts" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "msisdn" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "password_set" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL,
    "parent_account_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "relation" VARCHAR(50) NOT NULL,
    "occupation" VARCHAR(100),
    "address" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "actor_type" VARCHAR(50) NOT NULL,
    "actor_id" UUID NOT NULL,
    "device_id" VARCHAR(255),
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" UUID NOT NULL,
    "msisdn" VARCHAR(50) NOT NULL,
    "otp_hash" VARCHAR(255) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "hod_teacher_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_department_maps" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,

    CONSTRAINT "teacher_department_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actor_role_assignments" (
    "id" UUID NOT NULL,
    "actor_type" VARCHAR(50) NOT NULL,
    "actor_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "actor_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "class_teacher_id" UUID,
    "capacity" INTEGER NOT NULL DEFAULT 40,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_types" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "subject_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "subject_type_id" UUID NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_subject_maps" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,

    CONSTRAINT "section_subject_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_subject_teachers" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,

    CONSTRAINT "section_subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_broadcast_quotas" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "quota_limit" INTEGER NOT NULL,
    "quota_used" INTEGER NOT NULL DEFAULT 0,
    "year_month" VARCHAR(7) NOT NULL,

    CONSTRAINT "teacher_broadcast_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "dob" TIMESTAMP(3),
    "address" TEXT,
    "aadhar_no" VARCHAR(50),
    "blood_group" VARCHAR(10),
    "date_of_admission" TIMESTAMP(3),
    "previous_school" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "roll_no" INTEGER,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_components" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "fee_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_fee_structures" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "fee_component_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" VARCHAR(50) NOT NULL,

    CONSTRAINT "section_fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "late_fee_slabs" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "days_overdue_from" INTEGER NOT NULL,
    "days_overdue_to" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),

    CONSTRAINT "late_fee_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_payment_discount_policies" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "grade_id" UUID,
    "months_count" INTEGER NOT NULL,
    "discount_percentage" DECIMAL(5,2) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),

    CONSTRAINT "bulk_payment_discount_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "year_month" VARCHAR(7) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "late_fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balance" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_invoice_lines" (
    "id" UUID NOT NULL,
    "fee_invoice_id" UUID NOT NULL,
    "fee_component_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "fee_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mode" VARCHAR(50) NOT NULL,
    "gateway_txn_id" VARCHAR(255),
    "paid_by_guardian_id" UUID,
    "recorded_by_admin_id" UUID,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "fee_invoice_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_waiver_logs" (
    "id" UUID NOT NULL,
    "fee_invoice_id" UUID NOT NULL,
    "waived_by_admin_id" UUID NOT NULL,
    "original_late_fee" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "waived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_waiver_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mode" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_by_admin_id" UUID NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasts" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "sender_teacher_id" UUID,
    "channel" VARCHAR(20) NOT NULL,
    "message_body" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "template" TEXT NOT NULL,
    "channel" VARCHAR(20) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_employment" (
    "id" UUID NOT NULL,
    "school_id" VARCHAR(20),
    "employee_id" VARCHAR(20),
    "department_id" VARCHAR(20),
    "designation" VARCHAR(20),
    "employeement_type" VARCHAR(20),
    "joining_Date" VARCHAR(20),
    "status" TEXT,

    CONSTRAINT "employee_employment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_schoolId_key" ON "schools"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "features_code_key" ON "features"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_id_key" ON "plan_features"("plan_id", "feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_ledgers_school_id_channel_year_month_key" ON "usage_ledgers"("school_id", "channel", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_school_id_employee_code_key" ON "teachers"("school_id", "employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_school_id_msisdn_key" ON "parent_accounts"("school_id", "msisdn");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_parent_account_id_student_id_key" ON "guardians"("parent_account_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_school_id_code_key" ON "departments"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_department_maps_teacher_id_department_id_academic_y_key" ON "teacher_department_maps"("teacher_id", "department_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "actor_role_assignments_actor_type_actor_id_role_id_key" ON "actor_role_assignments"("actor_type", "actor_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "grades_school_id_name_key" ON "grades"("school_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sections_grade_id_academic_year_id_name_key" ON "sections"("grade_id", "academic_year_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_types_school_id_code_key" ON "subject_types"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_school_id_code_key" ON "subjects"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "section_subject_maps_section_id_subject_id_key" ON "section_subject_maps"("section_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_subject_teachers_section_id_subject_id_teacher_id_key" ON "section_subject_teachers"("section_id", "subject_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_broadcast_quotas_teacher_id_channel_year_month_key" ON "teacher_broadcast_quotas"("teacher_id", "channel", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_student_code_key" ON "students"("school_id", "student_code");

-- CreateIndex
CREATE UNIQUE INDEX "fee_components_school_id_code_key" ON "fee_components"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "section_fee_structures_section_id_fee_component_id_key" ON "section_fee_structures"("section_id", "fee_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_student_id_year_month_key" ON "fee_invoices"("student_id", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_txn_id_key" ON "payments"("gateway_txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_code_key" ON "message_templates"("code");

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_up_packs" ADD CONSTRAINT "top_up_packs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_ledgers" ADD CONSTRAINT "usage_ledgers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "parent_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_department_maps" ADD CONSTRAINT "teacher_department_maps_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_department_maps" ADD CONSTRAINT "teacher_department_maps_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actor_role_assignments" ADD CONSTRAINT "actor_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_class_teacher_id_fkey" FOREIGN KEY ("class_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_types" ADD CONSTRAINT "subject_types_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_subject_type_id_fkey" FOREIGN KEY ("subject_type_id") REFERENCES "subject_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_subject_maps" ADD CONSTRAINT "section_subject_maps_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_subject_maps" ADD CONSTRAINT "section_subject_maps_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_subject_teachers" ADD CONSTRAINT "section_subject_teachers_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_subject_teachers" ADD CONSTRAINT "section_subject_teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_subject_teachers" ADD CONSTRAINT "section_subject_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_broadcast_quotas" ADD CONSTRAINT "teacher_broadcast_quotas_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_components" ADD CONSTRAINT "fee_components_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_fee_structures" ADD CONSTRAINT "section_fee_structures_fee_component_id_fkey" FOREIGN KEY ("fee_component_id") REFERENCES "fee_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_fee_structures" ADD CONSTRAINT "section_fee_structures_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_fee_slabs" ADD CONSTRAINT "late_fee_slabs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_payment_discount_policies" ADD CONSTRAINT "bulk_payment_discount_policies_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_payment_discount_policies" ADD CONSTRAINT "bulk_payment_discount_policies_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoice_lines" ADD CONSTRAINT "fee_invoice_lines_fee_component_id_fkey" FOREIGN KEY ("fee_component_id") REFERENCES "fee_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoice_lines" ADD CONSTRAINT "fee_invoice_lines_fee_invoice_id_fkey" FOREIGN KEY ("fee_invoice_id") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_fee_invoice_id_fkey" FOREIGN KEY ("fee_invoice_id") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_waiver_logs" ADD CONSTRAINT "fee_waiver_logs_fee_invoice_id_fkey" FOREIGN KEY ("fee_invoice_id") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
