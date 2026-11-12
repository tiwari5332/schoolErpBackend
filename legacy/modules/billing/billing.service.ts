import db from '../../config/database';
import { BusinessRuleException, NotFoundError } from '../../utils/response';

export class BillingService {
  static async getPlans() {
    const res = await db.query(
      `SELECT p.*,
              coalesce(
                json_agg(
                  json_build_object('id', pf.id, 'enabled', pf.enabled, 'feature', row_to_json(f.*))
                ) FILTER (WHERE pf.id IS NOT NULL), '[]'
              ) as "planFeatures"
       FROM plans p
       LEFT JOIN plan_features pf ON p.id = pf.plan_id
       LEFT JOIN features f ON pf.feature_id = f.id
       WHERE p.active = true
       GROUP BY p.id`
    );
    return res.rows;
  }

  static async createPlan(data: {
    code: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    studentCap: number;
    teacherCap: number;
    smsQuota: number;
    whatsappQuota: number;
    featuresJson?: string;
  }) {
    const res = await db.query(
      `INSERT INTO plans (id, code, display_name, monthly_price, yearly_price, student_cap, teacher_cap, sms_quota, whatsapp_quota, features_json)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.code,
        data.displayName,
        data.monthlyPrice,
        data.yearlyPrice,
        data.studentCap,
        data.teacherCap,
        data.smsQuota,
        data.whatsappQuota,
        data.featuresJson || null,
      ]
    );
    return res.rows[0];
  }

  static async updatePlan(id: string, data: Partial<{
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    studentCap: number;
    teacherCap: number;
    smsQuota: number;
    whatsappQuota: number;
    active: boolean;
  }>) {
    const planRes = await db.query(`SELECT * FROM plans WHERE id = $1`, [id]);
    const existing = planRes.rows[0];
    if (!existing) throw new NotFoundError(`Plan not found: ${id}`);

    const displayName = data.displayName !== undefined ? data.displayName : existing.display_name;
    const monthlyPrice = data.monthlyPrice !== undefined ? data.monthlyPrice : existing.monthly_price;
    const yearlyPrice = data.yearlyPrice !== undefined ? data.yearlyPrice : existing.yearly_price;
    const studentCap = data.studentCap !== undefined ? data.studentCap : existing.student_cap;
    const teacherCap = data.teacherCap !== undefined ? data.teacherCap : existing.teacher_cap;
    const smsQuota = data.smsQuota !== undefined ? data.smsQuota : existing.sms_quota;
    const whatsappQuota = data.whatsappQuota !== undefined ? data.whatsappQuota : existing.whatsapp_quota;
    const active = data.active !== undefined ? data.active : existing.active;

    const res = await db.query(
      `UPDATE plans
       SET display_name = $1, monthly_price = $2, yearly_price = $3, student_cap = $4, teacher_cap = $5, sms_quota = $6, whatsapp_quota = $7, active = $8
       WHERE id = $9
       RETURNING *`,
      [displayName, monthlyPrice, yearlyPrice, studentCap, teacherCap, smsQuota, whatsappQuota, active, id]
    );
    return res.rows[0];
  }

  static async getSchoolSubscription(schoolId: string) {
    const res = await db.query(
      `SELECT ss.*, row_to_json(p.*) as plan
       FROM school_subscriptions ss
       JOIN plans p ON ss.plan_id = p.id
       WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
       LIMIT 1`,
      [schoolId]
    );
    const sub = res.rows[0];
    if (!sub) throw new NotFoundError('No active subscription found for school');
    return sub;
  }

  static async upgradeSubscription(schoolId: string, planId: string, billingCycle: string, changeReason?: string) {
    const planRes = await db.query(`SELECT * FROM plans WHERE id = $1 AND active = true`, [planId]);
    const newPlan = planRes.rows[0];
    if (!newPlan) throw new BusinessRuleException('Invalid or inactive plan selected');

    return db.transaction(async (client) => {
      await client.query(
        `UPDATE school_subscriptions SET status = 'UPGRADED', end_date = NOW() WHERE school_id = $1 AND status = 'ACTIVE'`,
        [schoolId]
      );

      const res = await client.query(
        `INSERT INTO school_subscriptions (id, school_id, plan_id, billing_cycle, start_date, status, change_reason)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), 'ACTIVE', $4)
         RETURNING *`,
        [schoolId, newPlan.id, billingCycle, changeReason || null]
      );
      return res.rows[0];
    });
  }

  static async overrideCap(superAdminId: string, schoolId: string, data: { maxStudents?: number; maxTeachers?: number; reason: string }) {
    const subRes = await db.query(`SELECT id FROM school_subscriptions WHERE school_id = $1 AND status = 'ACTIVE'`, [schoolId]);
    const activeSub = subRes.rows[0];
    if (!activeSub) throw new NotFoundError('No active subscription found for school');

    const res = await db.query(
      `UPDATE school_subscriptions
       SET override_max_students = $1, override_max_teachers = $2, overridden_by_super_admin_id = $3, override_reason = $4
       WHERE id = $5
       RETURNING *`,
      [data.maxStudents || null, data.maxTeachers || null, superAdminId, data.reason, activeSub.id]
    );
    return res.rows[0];
  }

  static async purchaseTopUp(schoolId: string, channel: string, creditsPurchased: number, costPaid: number) {
    const res = await db.query(
      `INSERT INTO top_up_packs (id, school_id, channel, credits_purchased, cost_paid)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [schoolId, channel, creditsPurchased, costPaid]
    );
    return res.rows[0];
  }

  static async getTopUpPacks(schoolId: string) {
    const res = await db.query(
      `SELECT * FROM top_up_packs WHERE school_id = $1 ORDER BY purchased_at DESC`,
      [schoolId]
    );
    return res.rows;
  }

  static async getUsageLedgers(schoolId: string, channel?: string) {
    const res = await db.query(
      `SELECT * FROM usage_ledgers
       WHERE school_id = $1 AND ($2::varchar IS NULL OR channel = $2)
       ORDER BY year_month DESC`,
      [schoolId, channel || null]
    );
    return res.rows;
  }
}
