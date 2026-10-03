import db from '../../config/database';
import { BusinessRuleException } from '../../utils/response';
import { CsvUtils } from '../../utils/csvParser';

export class CapacityCheckService {
  static async verifyStudentCapacity(schoolId: string): Promise<void> {
    const subRes = await db.query(
      `SELECT ss.override_max_students, p.student_cap
       FROM school_subscriptions ss
       JOIN plans p ON ss.plan_id = p.id
       WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
       LIMIT 1`,
      [schoolId]
    );

    const subscription = subRes.rows[0];
    if (!subscription) {
      throw new BusinessRuleException('No active subscription found for school');
    }

    const maxCap = subscription.override_max_students ?? subscription.student_cap;
    const countRes = await db.query(
      `SELECT COUNT(*)::int as count FROM students WHERE school_id = $1`,
      [schoolId]
    );
    const currentCount = countRes.rows[0].count;

    if (currentCount >= maxCap) {
      throw new BusinessRuleException(`Student onboarding limit reached (${currentCount}/${maxCap}). Upgrade subscription.`);
    }
  }

  static async verifyTeacherCapacity(schoolId: string): Promise<void> {
    const subRes = await db.query(
      `SELECT ss.override_max_teachers, p.teacher_cap
       FROM school_subscriptions ss
       JOIN plans p ON ss.plan_id = p.id
       WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
       LIMIT 1`,
      [schoolId]
    );

    const subscription = subRes.rows[0];
    if (!subscription) {
      throw new BusinessRuleException('No active subscription found for school');
    }

    const maxCap = subscription.override_max_teachers ?? subscription.teacher_cap;
    const countRes = await db.query(
      `SELECT COUNT(*)::int as count FROM teachers WHERE school_id = $1 AND status = 'ACTIVE'`,
      [schoolId]
    );
    const currentCount = countRes.rows[0].count;

    if (currentCount >= maxCap) {
      throw new BusinessRuleException(`Teacher onboarding limit reached (${currentCount}/${maxCap}). Upgrade subscription.`);
    }
  }
}

export class OnboardingService {
  static async onboardStudent(schoolId: string, data: {
    studentCode: string;
    name: string;
    email?: string;
    phone?: string;
    dob?: string;
    sectionId: string;
    rollNo?: number;
    parentName: string;
    parentMsisdn: string;
    parentEmail?: string;
    relation?: string;
  }) {
    await CapacityCheckService.verifyStudentCapacity(schoolId);

    const existingRes = await db.query(
      `SELECT id FROM students WHERE school_id = $1 AND student_code = $2`,
      [schoolId, data.studentCode]
    );
    if (existingRes.rows.length > 0) {
      throw new BusinessRuleException(`Student with code '${data.studentCode}' already exists`);
    }

    return db.transaction(async (client) => {
      const studentRes = await client.query(
        `INSERT INTO students (id, school_id, student_code, name, email, phone, dob)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [schoolId, data.studentCode, data.name, data.email || null, data.phone || null, data.dob ? new Date(data.dob) : null]
      );
      const student = studentRes.rows[0];

      const enrollmentRes = await client.query(
        `INSERT INTO enrollments (id, student_id, section_id, roll_no, status)
         VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE')
         RETURNING *`,
        [student.id, data.sectionId, data.rollNo || null]
      );
      const enrollment = enrollmentRes.rows[0];

      let parentRes = await client.query(
        `SELECT * FROM parent_accounts WHERE school_id = $1 AND msisdn = $2`,
        [schoolId, data.parentMsisdn]
      );
      let parent = parentRes.rows[0];

      if (!parent) {
        const createParentRes = await client.query(
          `INSERT INTO parent_accounts (id, school_id, name, msisdn, email)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)
           RETURNING *`,
          [schoolId, data.parentName, data.parentMsisdn, data.parentEmail || null]
        );
        parent = createParentRes.rows[0];
      }

      const guardianRes = await client.query(
        `INSERT INTO guardians (id, parent_account_id, student_id, relation, is_primary)
         VALUES (gen_random_uuid(), $1, $2, $3, true)
         RETURNING *`,
        [parent.id, student.id, data.relation || 'PARENT']
      );
      const guardian = guardianRes.rows[0];

      return { student, enrollment, parentAccount: parent, guardian };
    });
  }

  static async bulkOnboardStudents(schoolId: string, sectionId: string, csvBuffer: Buffer) {
    const rows = await CsvUtils.parseCsvBuffer<any>(csvBuffer);
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ row: number; studentCode: string; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await this.onboardStudent(schoolId, {
          studentCode: row.studentCode || row.code,
          name: row.name,
          email: row.email,
          phone: row.phone,
          dob: row.dob,
          sectionId,
          rollNo: row.rollNo ? parseInt(row.rollNo, 10) : undefined,
          parentName: row.parentName || row.guardianName,
          parentMsisdn: row.parentMsisdn || row.guardianPhone,
          parentEmail: row.parentEmail,
          relation: row.relation,
        });
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({
          row: i + 1,
          studentCode: row.studentCode || row.code || 'UNKNOWN',
          error: err.message || 'Failed to onboard student',
        });
      }
    }

    return { totalProcessed: rows.length, successCount, failureCount, errors };
  }

  static async onboardTeacher(schoolId: string, data: {
    employeeCode: string;
    name: string;
    email?: string;
    loginMsisdn: string;
    dateOfBirth?: string;
    gender?: string;
    designation?: string;
    dateOfJoining?: string;
    address: string;
    employeeType?: string;
  }) {
    await CapacityCheckService.verifyTeacherCapacity(schoolId);

    const existingRes = await db.query(
      `SELECT id FROM teachers WHERE school_id = $1 AND employee_code = $2`,
      [schoolId, data.employeeCode]
    );
    if (existingRes.rows.length > 0) {
      throw new BusinessRuleException(`Teacher with code '${data.employeeCode}' already exists`);
    }

    const latestRes = await db.query(
      `SELECT employee_code FROM teachers WHERE school_id = $1 ORDER BY employee_code DESC LIMIT 1`,
      [schoolId]
    );
    const latestEmployeeCode = latestRes.rows[0]?.employee_code;
    const employeeCodeSuffix = latestEmployeeCode?.split('-') ?? null;
    const nextEmployeeCode = employeeCodeSuffix && employeeCodeSuffix.length >= 3 ? `${employeeCodeSuffix[0]}-${employeeCodeSuffix[1]}-${String(parseInt(employeeCodeSuffix[2]) + 1).padStart(4, "0")}` : (data.employeeCode || '1');

    await db.query(
      `INSERT INTO teachers (id, school_id, employee_code, name, email, login_msisdn, dob, gender, address)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        schoolId,
        nextEmployeeCode,
        data.name,
        data.email || null,
        data.loginMsisdn,
        data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        data.gender || null,
        data.address || null,
      ]
    );

    await db.query(
      `INSERT INTO employee_employment (id, school_id, employee_id, designation, joining_Date, employeement_type, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ACTIVE')`,
      [
        schoolId,
        nextEmployeeCode,
        data.designation || null,
        data.dateOfJoining || null,
        data.employeeType || null,
      ]
    );
  }

  static async bulkOnboardTeachers(schoolId: string, csvBuffer: Buffer) {
    const rows = await CsvUtils.parseCsvBuffer<any>(csvBuffer);
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ row: number; employeeCode: string; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await this.onboardTeacher(schoolId, {
          employeeCode: row.employeeCode || row.code,
          name: row.name,
          email: row.email,
          loginMsisdn: row.loginMsisdn || row.phone,
          dateOfBirth: row.dateOfBirth,
          gender: row.gender,
          designation: row.designation,
          dateOfJoining: row.dateOfJoining,
          address: row.address,
        });
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({
          row: i + 1,
          employeeCode: row.employeeCode || row.code || 'UNKNOWN',
          error: err.message || 'Failed to onboard teacher',
        });
      }
    }

    return { totalProcessed: rows.length, successCount, failureCount, errors };
  }
}
