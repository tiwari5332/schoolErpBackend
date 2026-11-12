import db from './database';
import { Logger } from '../libs/logger';
import { PermissionCode } from './constants';

export async function initDatabaseSchema(): Promise<void> {
  try {
    Logger.info('Initializing database schema and required tables...');

    // 0. Ensure schools.updated_at has default
    await db.query(`
      ALTER TABLE "schools" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
    `);

    // 0a. Widen employee_employment columns to prevent truncation on UUIDs
    await db.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_employment') THEN
          ALTER TABLE employee_employment ALTER COLUMN school_id TYPE VARCHAR(100);
          ALTER TABLE employee_employment ALTER COLUMN employee_id TYPE VARCHAR(100);
          ALTER TABLE employee_employment ALTER COLUMN department_id TYPE VARCHAR(100);
          ALTER TABLE employee_employment ALTER COLUMN designation TYPE VARCHAR(100);
          ALTER TABLE employee_employment ALTER COLUMN employeement_type TYPE VARCHAR(100);
          ALTER TABLE employee_employment ALTER COLUMN "joining_Date" TYPE VARCHAR(100);
        END IF;
      END $$;
    `);

    // 1. Create Student Attendance table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "student_attendance" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL,
        "student_id" UUID NOT NULL,
        "section_id" UUID NOT NULL,
        "academic_year_id" UUID NOT NULL,
        "date" DATE NOT NULL,
        "attendance_type" VARCHAR(50) NOT NULL DEFAULT 'DAILY_HOMEROOM',
        "subject_id" UUID,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
        "remarks" TEXT,
        "recorded_by_teacher_id" UUID,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "student_attendance_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create Staff Attendance table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "staff_attendance" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL,
        "teacher_id" UUID NOT NULL,
        "date" DATE NOT NULL,
        "check_in_time" TIMESTAMP(3),
        "check_out_time" TIMESTAMP(3),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
        "source" VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
        "remarks" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "staff_attendance_school_teacher_date_key" UNIQUE ("school_id", "teacher_id", "date")
      );
    `);

    // 3. Create Monthly Attendance Ledgers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "monthly_attendance_ledgers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL,
        "student_id" UUID NOT NULL,
        "section_id" UUID NOT NULL,
        "year_month" VARCHAR(7) NOT NULL,
        "total_working_days" INTEGER NOT NULL DEFAULT 0,
        "present_days" INTEGER NOT NULL DEFAULT 0,
        "absent_days" INTEGER NOT NULL DEFAULT 0,
        "late_days" INTEGER NOT NULL DEFAULT 0,
        "half_days" INTEGER NOT NULL DEFAULT 0,
        "excused_days" INTEGER NOT NULL DEFAULT 0,
        "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "exam_eligible" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "monthly_attendance_ledgers_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "monthly_attendance_ledgers_student_year_month_key" UNIQUE ("student_id", "year_month")
      );
    `);

    // 4. Create single active enrollment partial unique index per HLD section 7.3 & 9
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_single_active_enrollment"
      ON "enrollments" ("student_id")
      WHERE status = 'ACTIVE';
    `);

    // 4a. Create Academic Sessions table per requirements
    await db.query(`
      CREATE TABLE IF NOT EXISTS "academic_sessions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'current', 'closed')),
        "is_current" BOOLEAN NOT NULL DEFAULT false,
        "created_by" UUID,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "academic_sessions_school_name_key" UNIQUE ("school_id", "name"),
        CONSTRAINT "academic_sessions_dates_check" CHECK (end_date > start_date)
      );
    `);

    // Partial unique index: Only one is_current = true per school
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_single_current_session"
      ON "academic_sessions" ("school_id")
      WHERE is_current = true;
    `);

    // Non-functional requirement indexes: (school_id, status) and (school_id, start_date)
    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_school_status"
      ON "academic_sessions" ("school_id", "status");
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_school_start_date"
      ON "academic_sessions" ("school_id", "start_date");
    `);

    // 4b. Create User Preferences table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "user_preferences" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "actor_type" VARCHAR(50) NOT NULL,
        "actor_id" UUID NOT NULL,
        "selected_session_id" UUID REFERENCES academic_sessions(id) ON DELETE SET NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "user_preferences_actor_key" UNIQUE ("actor_type", "actor_id")
      );
    `);

    // 4c. Create Academic Session Audit Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "academic_session_audit_logs" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        "session_id" UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        "action" VARCHAR(50) NOT NULL,
        "performed_by" UUID,
        "details" JSONB,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "academic_session_audit_logs_pkey" PRIMARY KEY ("id")
      );
    `);

    // 4d. Migration + Seed: Create current session from existing academic_years
    await db.query(`
      INSERT INTO academic_sessions (id, school_id, name, start_date, end_date, status, is_current, created_at, updated_at)
      SELECT
        ay.id,
        ay.school_id,
        ay.name,
        ay.start_date,
        ay.end_date,
        CASE WHEN ay.status = 'ACTIVE' THEN 'current' ELSE 'closed' END,
        CASE WHEN ay.status = 'ACTIVE' THEN true ELSE false END,
        ay.created_at,
        NOW()
      FROM academic_years ay
      ON CONFLICT (school_id, name) DO NOTHING;
    `);

    // 4e. Dashboard & Calendar Schema: timezone, thresholds, system flags, and indexes
    await db.query(`
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata';
      ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "low_balance_threshold" DECIMAL(5,2) NOT NULL DEFAULT 10.00;
      ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
      ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "school_id" UUID;
      ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "session_id" UUID;
    `);

    // Backfill payments school_id from students if missing
    await db.query(`
      UPDATE payments p
      SET school_id = s.school_id
      FROM students s
      WHERE p.student_id = s.id AND p.school_id IS NULL;
    `);

    // Create Calendar Events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "calendar_events" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        "title" VARCHAR(255) NOT NULL,
        "type" VARCHAR(50) NOT NULL CHECK (type IN ('event', 'holiday', 'exam', 'fee_due', 'vacation')),
        "date" DATE NOT NULL,
        "end_date" DATE,
        "description" TEXT,
        "all_day" BOOLEAN NOT NULL DEFAULT true,
        "notify_users" BOOLEAN NOT NULL DEFAULT false,
        "created_by" UUID,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create In-App Notifications table for bell badge
    await db.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        "recipient_id" UUID NOT NULL,
        "recipient_type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "type" VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create Daily Stats table for summary roll-up
    await db.query(`
      CREATE TABLE IF NOT EXISTS "daily_stats" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "school_id" UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        "session_id" UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "students_enrolled" INTEGER NOT NULL DEFAULT 0,
        "students_present" INTEGER NOT NULL DEFAULT 0,
        "students_absent" INTEGER NOT NULL DEFAULT 0,
        "students_total" INTEGER NOT NULL DEFAULT 0,
        "attendance_status" VARCHAR(50) NOT NULL DEFAULT 'not_marked',
        "staff_active" INTEGER NOT NULL DEFAULT 0,
        "staff_on_leave" INTEGER NOT NULL DEFAULT 0,
        "fees_collected_today" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        "fees_collected_month" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        "pending_dues" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "daily_stats_school_session_date_unique" UNIQUE ("school_id", "session_id", "date")
      );
    `);

    // Performance Indexes for Dashboard Aggregates
    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_calendar_events_school_date" ON "calendar_events" ("school_id", "date");
      CREATE INDEX IF NOT EXISTS "idx_notifications_recipient" ON "notifications" ("school_id", "recipient_id", "is_read");
      CREATE INDEX IF NOT EXISTS "idx_daily_stats_lookup" ON "daily_stats" ("school_id", "session_id", "date");
      CREATE INDEX IF NOT EXISTS "idx_student_attendance_school_session_date" ON "student_attendance" ("school_id", "academic_year_id", "date");
      CREATE INDEX IF NOT EXISTS "idx_staff_attendance_school_date" ON "staff_attendance" ("school_id", "date");
      CREATE INDEX IF NOT EXISTS "idx_payments_school_paid_at" ON "payments" ("school_id", "paid_at");
    `);

    // 5. Seed System Permissions into PostgreSQL permissions table
    const permissionCodes = Object.values(PermissionCode);
    for (const code of permissionCodes) {
      await db.query(
        `INSERT INTO permissions (id, code, description)
         VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [code, `Permission for ${code}`]
      );
    }

    // 6. Seed Default Message Templates per HLD section 10
    const defaultTemplates = [
      {
        name: 'Absentee Parent Notification',
        code: 'ABSENTEE_ALERT',
        template: 'Dear Parent, your ward {{studentName}} was marked absent today, {{date}}, in Grade {{gradeSection}}. If this is an error, please contact the school office.',
        channel: 'SMS',
      },
      {
        name: 'Absentee WhatsApp Alert',
        code: 'ABSENTEE_ALERT_WHATSAPP',
        template: 'Dear Parent, your ward {{studentName}} was marked absent today, {{date}}, in Grade {{gradeSection}}. If this is an error, please contact the school office.',
        channel: 'WHATSAPP',
      },
      {
        name: 'Monthly Fee Reminder',
        code: 'FEE_REMINDER',
        template: 'Dear Parent, fee invoice of amount ${{amount}} for {{studentName}} is due on {{dueDate}}. Please pay via the parent portal.',
        channel: 'SMS',
      },
      {
        name: 'Emergency Holiday Notice',
        code: 'EMERGENCY_HOLIDAY',
        template: 'School notice: The school will remain closed on {{date}} due to {{reason}}. Classes will resume on {{resumeDate}}.',
        channel: 'SMS',
      },
      {
        name: 'General Broadcast Template',
        code: 'GENERAL_BROADCAST',
        template: '{{schoolName}} Announcement: {{messageBody}}',
        channel: 'IN_APP',
      },
    ];

    for (const tmpl of defaultTemplates) {
      await db.query(
        `INSERT INTO message_templates (id, name, code, template, channel)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         ON CONFLICT (code) DO NOTHING`,
        [tmpl.name, tmpl.code, tmpl.template, tmpl.channel]
      );
    }

    // 7. Seed Features catalog (HLD Section 4.2)
    const defaultFeatures = [
      { code: 'ACADEMIC_SETUP', description: 'Academic calendar, grades, sections and subjects management' },
      { code: 'STUDENT_MANAGEMENT', description: 'Student enrollment and guardian management' },
      { code: 'CSV_ONBOARDING', description: 'Bulk CSV onboarding for students and teachers' },
      { code: 'FEE_BASIC', description: 'Basic fee recording and manual cash payments' },
      { code: 'FEE_GATEWAY', description: 'Online payment gateway integration (UPI, Cards, NetBanking)' },
      { code: 'LATE_FEE_SWEEP', description: 'Automated nightly late fee calculation sweeps' },
      { code: 'COMMUNICATION_EMAIL', description: 'Email notifications and announcements' },
      { code: 'COMMUNICATION_SMS', description: 'SMS broadcast and parent absentee alerts' },
      { code: 'COMMUNICATION_WHATSAPP', description: 'WhatsApp Business API broadcasts and alerts' },
      { code: 'ATTENDANCE_BIOMETRIC', description: 'Biometric and RFID staff and student attendance' },
      { code: 'ADVANCED_REPORTS', description: 'Comprehensive financial and attendance ledgers' },
    ];

    for (const f of defaultFeatures) {
      await db.query(
        `INSERT INTO features (id, code, description)
         VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [f.code, f.description]
      );
    }

    // 8. Bind Features to Plans (HLD Section 4.1 & 4.2)
    const planFeatureMappings: Record<string, string[]> = {
      BASIC: ['ACADEMIC_SETUP', 'STUDENT_MANAGEMENT', 'FEE_BASIC', 'COMMUNICATION_EMAIL'],
      ADVANCE: [
        'ACADEMIC_SETUP',
        'STUDENT_MANAGEMENT',
        'FEE_BASIC',
        'COMMUNICATION_EMAIL',
        'CSV_ONBOARDING',
        'LATE_FEE_SWEEP',
        'COMMUNICATION_SMS',
      ],
      PREMIUM: [
        'ACADEMIC_SETUP',
        'STUDENT_MANAGEMENT',
        'FEE_BASIC',
        'COMMUNICATION_EMAIL',
        'CSV_ONBOARDING',
        'LATE_FEE_SWEEP',
        'COMMUNICATION_SMS',
        'FEE_GATEWAY',
        'COMMUNICATION_WHATSAPP',
        'ATTENDANCE_BIOMETRIC',
        'ADVANCED_REPORTS',
      ],
      ENTERPRISE: [
        'ACADEMIC_SETUP',
        'STUDENT_MANAGEMENT',
        'FEE_BASIC',
        'COMMUNICATION_EMAIL',
        'CSV_ONBOARDING',
        'LATE_FEE_SWEEP',
        'COMMUNICATION_SMS',
        'FEE_GATEWAY',
        'COMMUNICATION_WHATSAPP',
        'ATTENDANCE_BIOMETRIC',
        'ADVANCED_REPORTS',
      ],
    };

    for (const [planCode, featureCodes] of Object.entries(planFeatureMappings)) {
      const planRes = await db.query(`SELECT id FROM plans WHERE code = $1`, [planCode]);
      if (planRes.rows[0]) {
        const planId = planRes.rows[0].id;
        for (const fCode of featureCodes) {
          const featRes = await db.query(`SELECT id FROM features WHERE code = $1`, [fCode]);
          if (featRes.rows[0]) {
            const featId = featRes.rows[0].id;
            await db.query(
              `INSERT INTO plan_features (id, plan_id, feature_id, enabled)
               VALUES (gen_random_uuid(), $1, $2, true)
               ON CONFLICT (plan_id, feature_id) DO NOTHING`,
              [planId, featId]
            );
          }
        }
      }
    }

    Logger.info('✅ Database schema and default seeds verified successfully.');
  } catch (error: any) {
    Logger.error('Failed to initialize database schema / seeds', { error: error.message });
  }
}

