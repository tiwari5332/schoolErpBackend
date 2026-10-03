import db from '../../config/database';
import { ActorType, PlanCode } from '../../config/constants';
import { HashUtils } from '../../utils/hash';
import { JwtUtils } from '../../utils/jwt';
import { createSchoolId } from '../../middleware/tenant.middleware';
import { BusinessRuleException, NotFoundError, UnauthorizedError } from '../../utils/response';
import { Logger } from '../../libs/logger';

export class AuthService {
  private static async deactivateSessions(actorType: string, actorId: string) {
    await db.query(
      `UPDATE auth_sessions SET active = false WHERE actor_type = $1 AND actor_id = $2 AND active = true`,
      [actorType, actorId]
    );
  }

  static async registerSchool(data: {
    schoolName: string;
    schoolAddress?: string;
    contactEmail: string;
    contactPhone: string;
    adminName: string;
    adminEmail: string;
    adminMsisdn: string;
    adminPassword: string;
  }) {
    const existingAdminRes = await db.query(
      `SELECT id FROM admins WHERE email = $1`,
      [data.adminEmail]
    );
    if (existingAdminRes.rows.length > 0) {
      throw new BusinessRuleException(`Admin email '${data.adminEmail}' is already registered`);
    }

    let planRes = await db.query(
      `SELECT id FROM plans WHERE code = $1`,
      [PlanCode.BASIC]
    );
    let basicPlanId: string;
    if (planRes.rows.length === 0) {
      const createPlanRes = await db.query(
        `INSERT INTO plans (id, code, display_name, monthly_price, yearly_price, student_cap, teacher_cap, sms_quota, whatsapp_quota)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [PlanCode.BASIC, 'Basic Starter Plan', 0, 0, 200, 20, 500, 100]
      );
      basicPlanId = createPlanRes.rows[0].id;
    } else {
      basicPlanId = planRes.rows[0].id;
    }

    const passwordHash = await HashUtils.hashPassword(data.adminPassword);
    const customSchoolIdCode = createSchoolId(data.schoolName);

    const result = await db.transaction(async (client) => {
      const schoolRes = await client.query(
        `INSERT INTO schools (id, name, address, "contactEmail", "contactPhone", "schoolId")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         RETURNING id, name`,
        [data.schoolName, data.schoolAddress || null, data.contactEmail, data.contactPhone, customSchoolIdCode]
      );
      const school = schoolRes.rows[0];

      const adminRes = await client.query(
        `INSERT INTO admins (id, school_id, name, email, msisdn, password_hash)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         RETURNING id, email`,
        [school.id, data.adminName, data.adminEmail, data.adminMsisdn, passwordHash]
      );
      const admin = adminRes.rows[0];

      await client.query(
        `INSERT INTO school_subscriptions (id, school_id, plan_id, billing_cycle, start_date, status)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4)`,
        [school.id, basicPlanId, 'MONTHLY', 'ACTIVE']
      );

      let roleRes = await client.query(
        `SELECT id FROM roles WHERE school_id IS NULL AND name = $1`,
        ['ADMIN']
      );
      let adminRoleId: string;
      if (roleRes.rows.length === 0) {
        const createRoleRes = await client.query(
          `INSERT INTO roles (id, name, description)
           VALUES (gen_random_uuid(), $1, $2)
           RETURNING id`,
          ['ADMIN', 'School Administrator']
        );
        adminRoleId = createRoleRes.rows[0].id;
      } else {
        adminRoleId = roleRes.rows[0].id;
      }

      await client.query(
        `INSERT INTO actor_role_assignments (id, actor_type, actor_id, role_id)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [ActorType.ADMIN, admin.id, adminRoleId]
      );

      return { school, admin };
    });

    const token = JwtUtils.generateLoginToken({
      actorId: result.admin.id,
      actorType: ActorType.ADMIN,
      schoolId: result.school.id,
      planCode: PlanCode.BASIC,
      features: [],
    });

    const tokenHash = HashUtils.computeTokenHash(token);
    await db.query(
      `INSERT INTO auth_sessions (id, actor_type, actor_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [ActorType.ADMIN, result.admin.id, tokenHash, new Date(Date.now() + 3600000)]
    );

    return {
      token,
      schoolId: result.school.id,
      adminId: result.admin.id,
      email: result.admin.email,
    };
  }

  static async adminLogin(identifier: string, password: string, deviceId?: string) {
    if (!identifier || !password) {
      throw new BusinessRuleException('Email or mobile number and password are required', 400);
    }

    const adminRes = await db.query(
      `SELECT * FROM admins WHERE (email = $1 OR msisdn = $1)`,
      [identifier]
    );

    const admin = adminRes.rows[0];
    if (!admin || admin.status !== 'ACTIVE') {
      throw new UnauthorizedError('Invalid credentials or admin account inactive');
    }

    const matches = await HashUtils.comparePassword(password, admin.password_hash);
    if (!matches) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const subRes = await db.query(
      `SELECT ss.*, p.code as plan_code
       FROM school_subscriptions ss
       JOIN plans p ON ss.plan_id = p.id
       WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
       LIMIT 1`,
      [admin.school_id]
    );
    const subscription = subRes.rows[0];

    await this.deactivateSessions(ActorType.ADMIN, admin.id);

    const token = JwtUtils.generateLoginToken({
      actorId: admin.id,
      actorType: ActorType.ADMIN,
      schoolId: admin.school_id,
      planCode: subscription?.plan_code || PlanCode.BASIC,
      features: [],
    });

    const tokenHash = HashUtils.computeTokenHash(token);
    await db.query(
      `INSERT INTO auth_sessions (id, actor_type, actor_id, device_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [ActorType.ADMIN, admin.id, deviceId || null, tokenHash, new Date(Date.now() + 3600000)]
    );

    return { token, actorId: admin.id, actorType: ActorType.ADMIN, schoolId: admin.school_id };
  }

  static async teacherLogin(employeeCode: string, schoolId: string, password: string, deviceId?: string) {
    const teacherRes = await db.query(
      `SELECT * FROM teachers WHERE school_id = $1 AND employee_code = $2 AND status = 'ACTIVE'`,
      [schoolId, employeeCode]
    );
    const teacher = teacherRes.rows[0];
    if (!teacher || !teacher.password_hash) {
      throw new UnauthorizedError('Invalid employee code or password');
    }

    const matches = await HashUtils.comparePassword(password, teacher.password_hash);
    if (!matches) {
      throw new UnauthorizedError('Invalid employee code or password');
    }

    const subRes = await db.query(
      `SELECT ss.*, p.code as plan_code
       FROM school_subscriptions ss
       JOIN plans p ON ss.plan_id = p.id
       WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
       LIMIT 1`,
      [teacher.school_id]
    );
    const subscription = subRes.rows[0];

    await this.deactivateSessions(ActorType.TEACHER, teacher.id);

    const token = JwtUtils.generateLoginToken({
      actorId: teacher.id,
      actorType: ActorType.TEACHER,
      schoolId: teacher.school_id,
      planCode: subscription?.plan_code || PlanCode.BASIC,
      features: [],
    });

    const tokenHash = HashUtils.computeTokenHash(token);
    await db.query(
      `INSERT INTO auth_sessions (id, actor_type, actor_id, device_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [ActorType.TEACHER, teacher.id, deviceId || null, tokenHash, new Date(Date.now() + 3600000)]
    );

    return { token, actorId: teacher.id, actorType: ActorType.TEACHER, schoolId: teacher.school_id };
  }

  static async parentLogin(schoolId: string, msisdn: string, password: string, deviceId?: string) {
    const parentRes = await db.query(
      `SELECT * FROM parent_accounts WHERE school_id = $1 AND msisdn = $2 AND status = 'ACTIVE'`,
      [schoolId, msisdn]
    );
    const parent = parentRes.rows[0];
    if (!parent || !parent.password_hash) {
      throw new UnauthorizedError('Invalid mobile number or password');
    }

    const matches = await HashUtils.comparePassword(password, parent.password_hash);
    if (!matches) {
      throw new UnauthorizedError('Invalid mobile number or password');
    }

    const subRes = await db.query(
      `SELECT ss.*, p.code as plan_code
       FROM school_subscriptions ss
       JOIN plans p ON ss.plan_id = p.id
       WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
       LIMIT 1`,
      [parent.school_id]
    );
    const subscription = subRes.rows[0];

    await this.deactivateSessions(ActorType.PARENT, parent.id);

    const token = JwtUtils.generateLoginToken({
      actorId: parent.id,
      actorType: ActorType.PARENT,
      schoolId: parent.school_id,
      planCode: subscription?.plan_code || PlanCode.BASIC,
      features: [],
    });

    const tokenHash = HashUtils.computeTokenHash(token);
    await db.query(
      `INSERT INTO auth_sessions (id, actor_type, actor_id, device_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [ActorType.PARENT, parent.id, deviceId || null, tokenHash, new Date(Date.now() + 3600000)]
    );

    return { token, actorId: parent.id, actorType: ActorType.PARENT, schoolId: parent.school_id };
  }

  static async getParentSchools(msisdn: string) {
    const res = await db.query(
      `SELECT pa.id as parent_account_id, s.id as school_id, s.name as school_name, s.address as school_address
       FROM parent_accounts pa
       JOIN schools s ON pa.school_id = s.id
       WHERE pa.msisdn = $1 AND pa.status = 'ACTIVE'`,
      [msisdn]
    );
    return res.rows.map((r) => ({
      parentAccountId: r.parent_account_id,
      schoolId: r.school_id,
      schoolName: r.school_name,
      schoolAddress: r.school_address,
    }));
  }

  static async userSignup(msisdn: string, actorType: string) {
    let actorId: string | null = null;
    let schoolId: string | null = null;

    if (actorType === ActorType.TEACHER) {
      const res = await db.query(`SELECT id, school_id FROM teachers WHERE login_msisdn = $1`, [msisdn]);
      const teacher = res.rows[0];
      if (!teacher) throw new NotFoundError(`No teacher record found for mobile: ${msisdn}`);
      actorId = teacher.id;
      schoolId = teacher.school_id;
    } else if (actorType === ActorType.PARENT) {
      const res = await db.query(`SELECT id, school_id FROM parent_accounts WHERE msisdn = $1`, [msisdn]);
      const parent = res.rows[0];
      if (!parent) throw new NotFoundError(`No parent account found for mobile: ${msisdn}`);
      actorId = parent.id;
      schoolId = parent.school_id;
    } else {
      throw new BusinessRuleException(`Unsupported actorType for signup: ${actorType}`);
    }

    const signupToken = JwtUtils.generateSignupToken(actorId!, actorType, schoolId!, msisdn);
    return { signupToken, actorId, actorType, schoolId };
  }

  static async createPassword(signupToken: string, newPassword: string) {
    const payload = JwtUtils.verifyToken<any>(signupToken);
    if (payload.purpose !== 'SIGNUP') {
      throw new UnauthorizedError('Invalid signup token');
    }

    const passwordHash = await HashUtils.hashPassword(newPassword);

    if (payload.actorType === ActorType.TEACHER) {
      await db.query(
        `UPDATE teachers SET password_hash = $1, password_set = true WHERE id = $2`,
        [passwordHash, payload.sub]
      );
    } else if (payload.actorType === ActorType.PARENT) {
      await db.query(
        `UPDATE parent_accounts SET password_hash = $1, password_set = true WHERE id = $2`,
        [passwordHash, payload.sub]
      );
    }

    return { success: true, message: 'Password set successfully' };
  }

  static async sendOtp(msisdn: string, purpose: string) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await HashUtils.hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      `INSERT INTO otp_requests (id, msisdn, otp_hash, purpose, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [msisdn, otpHash, purpose, expiresAt]
    );

    Logger.info(`[OTP] Generated OTP for ${msisdn} [${purpose}]`, { msisdn, purpose });
    return { msisdn, purpose, expiresAt };
  }

  static async verifyOtp(msisdn: string, purpose: string, otpCode: string) {
    const res = await db.query(
      `SELECT * FROM otp_requests
       WHERE msisdn = $1 AND purpose = $2 AND verified_at IS NULL AND expires_at >= NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [msisdn, purpose]
    );
    const otpReq = res.rows[0];

    if (!otpReq) {
      throw new BusinessRuleException('Invalid or expired OTP');
    }

    const matches = await HashUtils.comparePassword(otpCode, otpReq.otp_hash);
    if (!matches) {
      throw new BusinessRuleException('Incorrect OTP code');
    }

    await db.query(
      `UPDATE otp_requests SET verified_at = NOW() WHERE id = $1`,
      [otpReq.id]
    );

    return { verified: true };
  }

  static async forgotPassword(email?: string, mobileNo?: string) {
    if (!email && !mobileNo) {
      throw new BusinessRuleException('Email or mobileNo is required for forgot password', 400);
    }
    const targetMsisdn = mobileNo || email || '';
    await this.sendOtp(targetMsisdn, 'RESET_PASSWORD');
    return true;
  }

  static async resetPassword(data: { msisdn: string; otpCode: string; newPassword: string }) {
    await this.verifyOtp(data.msisdn, 'RESET_PASSWORD', data.otpCode);
    const passwordHash = await HashUtils.hashPassword(data.newPassword);

    const adminRes = await db.query(`SELECT id FROM admins WHERE msisdn = $1`, [data.msisdn]);
    if (adminRes.rows.length > 0) {
      await db.query(`UPDATE admins SET password_hash = $1 WHERE id = $2`, [passwordHash, adminRes.rows[0].id]);
      return true;
    }

    const teacherRes = await db.query(`SELECT id FROM teachers WHERE login_msisdn = $1`, [data.msisdn]);
    if (teacherRes.rows.length > 0) {
      await db.query(`UPDATE teachers SET password_hash = $1, password_set = true WHERE id = $2`, [passwordHash, teacherRes.rows[0].id]);
      return true;
    }

    const parentRes = await db.query(`SELECT id FROM parent_accounts WHERE msisdn = $1`, [data.msisdn]);
    if (parentRes.rows.length > 0) {
      await db.query(`UPDATE parent_accounts SET password_hash = $1, password_set = true WHERE id = $2`, [passwordHash, parentRes.rows[0].id]);
      return true;
    }

    throw new NotFoundError(`No user account found matching mobile number: ${data.msisdn}`);
  }
}
