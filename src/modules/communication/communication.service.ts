import db from '../../config/database';
import { BusinessRuleException, NotFoundError } from '../../utils/response';
import { NotificationService } from '../notification/notification.service';
import { Logger } from '../../libs/logger';

export interface SendBroadcastParams {
  schoolId: string;
  senderTeacherId?: string | null;
  actorType: string;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'IN_APP';
  messageBody?: string;
  templateCode?: string;
  templateVariables?: Record<string, any>;
  sectionIds?: string[];
  directRecipients?: Array<{ phone?: string; email?: string; name?: string }>;
}

export class CommunicationService {
  /**
   * List broadcasts for a school
   */
  static async getBroadCastList(schoolId: string, channel?: string, status?: string) {
    const res = await db.query(
      `SELECT b.*, t.name as sender_name, t.employee_code as sender_employee_code
       FROM broadcasts b
       LEFT JOIN teachers t ON b.sender_teacher_id = t.id
       WHERE b.school_id = $1
         AND ($2::varchar IS NULL OR b.channel = $2)
         AND ($3::varchar IS NULL OR b.status = $3)
       ORDER BY b.scheduled_at DESC NULLS LAST, b.sent_at DESC NULLS LAST`,
      [schoolId, channel || null, status || null]
    );
    return res.rows;
  }

  /**
   * Broadcast Dispatch Engine (HLD Section 4.3 & 10)
   * Enforces TeacherBroadcastQuota & multi-tier SaaS Plan + TopUpPack spending.
   */
  static async sendBroadcast(params: SendBroadcastParams) {
    const { schoolId, senderTeacherId, actorType, channel, sectionIds, directRecipients } = params;
    const yearMonth = new Date().toISOString().slice(0, 7); // e.g. '2026-10'

    // 1. Resolve message body (from pre-approved template or custom)
    let finalMessage = params.messageBody || '';
    if (params.templateCode) {
      const tmplRes = await db.query(
        `SELECT * FROM message_templates WHERE code = $1 LIMIT 1`,
        [params.templateCode]
      );
      const tmpl = tmplRes.rows[0];
      if (!tmpl) {
        throw new NotFoundError(`Message template '${params.templateCode}' not found`);
      }
      finalMessage = NotificationService.renderTemplate(tmpl.template, params.templateVariables || {});
    }

    if (!finalMessage.trim()) {
      throw new BusinessRuleException('Broadcast message body cannot be empty');
    }

    // 2. Resolve audience / recipients
    const recipients: Array<{ phone?: string; email?: string; name?: string; studentId?: string }> = [];

    if (directRecipients && directRecipients.length > 0) {
      for (const dr of directRecipients) {
        recipients.push({
          phone: dr.phone,
          email: dr.email,
          name: dr.name || 'Recipient',
        });
      }
    }

    if (sectionIds && sectionIds.length > 0) {
      // Gather active students and their primary guardian contacts
      const guardianContactsRes = await db.query(
        `SELECT DISTINCT
           st.id as student_id,
           st.name as student_name,
           pa.msisdn as phone,
           pa.email as email,
           pa.name as parent_name
         FROM enrollments e
         JOIN students st ON e.student_id = st.id
         JOIN guardians g ON st.id = g.student_id AND g.is_primary = true
         JOIN parent_accounts pa ON g.parent_account_id = pa.id
         WHERE e.section_id = ANY($1::uuid[])
           AND st.school_id = $2
           AND e.status = 'ACTIVE'`,
        [sectionIds, schoolId]
      );

      for (const row of guardianContactsRes.rows) {
        recipients.push({
          phone: row.phone,
          email: row.email,
          name: row.parent_name || row.student_name,
          studentId: row.student_id,
        });
      }
    }

    const recipientCount = recipients.length;
    if (recipientCount === 0) {
      throw new BusinessRuleException('No valid recipients found for broadcast in the specified sections');
    }

    // 3. Teacher Broadcast Quota Check (HLD Section 10)
    if (actorType === 'TEACHER' && senderTeacherId) {
      const quotaRes = await db.query(
        `SELECT * FROM teacher_broadcast_quotas
         WHERE teacher_id = $1 AND channel = $2 AND year_month = $3`,
        [senderTeacherId, channel, yearMonth]
      );

      const quota = quotaRes.rows[0];
      if (!quota) {
        throw new BusinessRuleException(
          `No broadcast quota allocated for teacher on channel '${channel}' for ${yearMonth}. Contact Admin.`
        );
      }

      if (quota.quota_used + recipientCount > quota.quota_limit) {
        throw new BusinessRuleException(
          `Broadcast exceeds your monthly teacher quota limit (${quota.quota_used + recipientCount}/${quota.quota_limit} on ${channel})`
        );
      }
    }

    // 4. SaaS Plan & TopUp Ledger Spending Check (HLD Section 4.3)
    let planCreditsToUse = 0;
    let topUpCreditsToUse = 0;

    if (channel === 'SMS' || channel === 'WHATSAPP') {
      const subRes = await db.query(
        `SELECT ss.*, p.sms_quota, p.whatsapp_quota
         FROM school_subscriptions ss
         JOIN plans p ON ss.plan_id = p.id
         WHERE ss.school_id = $1 AND ss.status = 'ACTIVE'
         LIMIT 1`,
        [schoolId]
      );

      const subscription = subRes.rows[0];
      if (!subscription) {
        throw new BusinessRuleException('No active school subscription found');
      }

      const planQuota = channel === 'SMS' ? subscription.sms_quota : subscription.whatsapp_quota;

      // Get or create usage ledger row for current yearMonth
      let ledgerRes = await db.query(
        `SELECT * FROM usage_ledgers WHERE school_id = $1 AND channel = $2 AND year_month = $3`,
        [schoolId, channel, yearMonth]
      );

      let ledger = ledgerRes.rows[0];
      if (!ledger) {
        const createLedgerRes = await db.query(
          `INSERT INTO usage_ledgers (id, school_id, channel, year_month, plan_credits_used, top_up_credits_used)
           VALUES (gen_random_uuid(), $1, $2, $3, 0, 0)
           RETURNING *`,
          [schoolId, channel, yearMonth]
        );
        ledger = createLedgerRes.rows[0];
      }

      const planCreditsUsed = ledger.plan_credits_used || 0;
      const topUpCreditsUsed = ledger.top_up_credits_used || 0;

      const availablePlanCredits = Math.max(0, planQuota - planCreditsUsed);
      planCreditsToUse = Math.min(recipientCount, availablePlanCredits);
      const remainingNeeded = recipientCount - planCreditsToUse;

      if (remainingNeeded > 0) {
        // Must draw from purchased top-up packs
        const topUpSumRes = await db.query(
          `SELECT COALESCE(SUM(credits_purchased), 0)::int as total_purchased
           FROM top_up_packs
           WHERE school_id = $1 AND channel = $2`,
          [schoolId, channel]
        );

        const totalTopUpPurchased = topUpSumRes.rows[0].total_purchased || 0;
        const availableTopUpCredits = Math.max(0, totalTopUpPurchased - topUpCreditsUsed);

        if (remainingNeeded > availableTopUpCredits) {
          throw new BusinessRuleException(
            `Insufficient ${channel} quota. Needed: ${recipientCount}, Available: ${availablePlanCredits + availableTopUpCredits}. Please purchase a Top-Up Pack.`
          );
        }

        topUpCreditsToUse = remainingNeeded;
      }
    }

    // 5. Execute deduction and persist broadcast in transaction
    const broadcastRecord = await db.transaction(async (client) => {
      // Deduct from usage ledger if SMS/WhatsApp
      if (channel === 'SMS' || channel === 'WHATSAPP') {
        await client.query(
          `UPDATE usage_ledgers
           SET plan_credits_used = plan_credits_used + $1,
               top_up_credits_used = top_up_credits_used + $2
           WHERE school_id = $3 AND channel = $4 AND year_month = $5`,
          [planCreditsToUse, topUpCreditsToUse, schoolId, channel, yearMonth]
        );
      }

      // Deduct teacher quota if sent by teacher
      if (actorType === 'TEACHER' && senderTeacherId) {
        await client.query(
          `UPDATE teacher_broadcast_quotas
           SET quota_used = quota_used + $1
           WHERE teacher_id = $2 AND channel = $3 AND year_month = $4`,
          [recipientCount, senderTeacherId, channel, yearMonth]
        );
      }

      // Insert broadcast entry
      const bRes = await client.query(
        `INSERT INTO broadcasts (id, school_id, sender_teacher_id, channel, message_body, recipient_count, sent_at, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), 'SENT')
         RETURNING *`,
        [schoolId, senderTeacherId || null, channel, finalMessage, recipientCount]
      );

      return bRes.rows[0];
    });

    // 6. Asynchronously trigger notification delivery via NotificationService
    NotificationService.dispatchBroadcast({
      schoolId,
      channel,
      message: finalMessage,
      recipients,
    }).catch((err) => {
      Logger.error(`Async dispatch error for broadcast ${broadcastRecord.id}: ${err.message}`);
    });

    return {
      broadcast: broadcastRecord,
      recipientCount,
      quotaBreakdown: {
        channel,
        planCreditsDeducted: planCreditsToUse,
        topUpCreditsDeducted: topUpCreditsToUse,
      },
    };
  }

  /**
   * Template Management
   */
  static async getTemplates(channel?: string) {
    const res = await db.query(
      `SELECT * FROM message_templates
       WHERE ($1::varchar IS NULL OR channel = $1)
       ORDER BY name ASC`,
      [channel || null]
    );
    return res.rows;
  }

  static async createTemplate(name: string, code: string, template: string, channel: string) {
    const existing = await db.query(`SELECT id FROM message_templates WHERE code = $1`, [code]);
    if (existing.rows.length > 0) {
      throw new BusinessRuleException(`Template with code '${code}' already exists`);
    }

    const res = await db.query(
      `INSERT INTO message_templates (id, name, code, template, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [name, code, template, channel]
    );
    return res.rows[0];
  }

  /**
   * Teacher Broadcast Quota Management
   */
  static async assignTeacherQuota(
    schoolId: string,
    teacherId: string,
    channel: string,
    quotaLimit: number,
    yearMonth: string
  ) {
    const teacherRes = await db.query(
      `SELECT id FROM teachers WHERE id = $1 AND school_id = $2`,
      [teacherId, schoolId]
    );
    if (!teacherRes.rows[0]) throw new NotFoundError(`Teacher not found: ${teacherId}`);

    const res = await db.query(
      `INSERT INTO teacher_broadcast_quotas (id, teacher_id, channel, quota_limit, quota_used, year_month)
       VALUES (gen_random_uuid(), $1, $2, $3, 0, $4)
       ON CONFLICT (teacher_id, channel, year_month) DO UPDATE
       SET quota_limit = EXCLUDED.quota_limit
       RETURNING *`,
      [teacherId, channel, quotaLimit, yearMonth]
    );
    return res.rows[0];
  }

  static async getTeacherQuotas(schoolId: string, teacherId: string, yearMonth?: string) {
    const currentYearMonth = yearMonth || new Date().toISOString().slice(0, 7);
    const res = await db.query(
      `SELECT tbq.*, t.name as teacher_name, t.employee_code
       FROM teacher_broadcast_quotas tbq
       JOIN teachers t ON tbq.teacher_id = t.id
       WHERE tbq.teacher_id = $1 AND t.school_id = $2 AND tbq.year_month = $3`,
      [teacherId, schoolId, currentYearMonth]
    );
    return res.rows;
  }
}

export default CommunicationService;
