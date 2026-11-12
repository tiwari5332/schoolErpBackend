import cron from 'node-cron';
import db from '../config/database';
import { env } from '../config/env';
import { Logger } from '../libs/logger';

export class LateFeeSweepJob {
  static async runSweep() {
    Logger.info('[LateFeeSweep] Starting nightly late fee calculation sweep...');
    const now = new Date();

    try {
      // Fetch overdue invoices that are not fully paid and have no waivers
      const invRes = await db.query(
        `SELECT fi.*, st.school_id,
                coalesce(count(fwl.id), 0)::int as waiver_count
         FROM fee_invoices fi
         JOIN students st ON fi.student_id = st.id
         LEFT JOIN fee_waiver_logs fwl ON fi.id = fwl.fee_invoice_id
         WHERE fi.due_date < $1 AND fi.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
         GROUP BY fi.id, st.school_id`,
        [now]
      );

      let updatedCount = 0;

      for (const invoice of invRes.rows) {
        if (invoice.waiver_count > 0) continue;

        const schoolId = invoice.school_id;
        const daysOverdue = Math.floor((now.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 3600 * 24));

        const slabRes = await db.query(
          `SELECT * FROM late_fee_slabs
           WHERE school_id = $1 AND effective_to IS NULL
             AND days_overdue_from <= $2 AND days_overdue_to >= $2
           LIMIT 1`,
          [schoolId, daysOverdue]
        );

        if (slabRes.rows.length > 0) {
          const slabAmount = Number(slabRes.rows[0].amount);
          const currentLateFee = Number(invoice.late_fee_amount);

          if (slabAmount !== currentLateFee) {
            const feeDiff = slabAmount - currentLateFee;
            const newTotal = Number(invoice.total_amount) + feeDiff;
            const newBalance = Number(invoice.balance) + feeDiff;

            await db.query(
              `UPDATE fee_invoices
               SET late_fee_amount = $1, total_amount = $2, balance = $3, status = 'OVERDUE'
               WHERE id = $4`,
              [slabAmount, newTotal, newBalance, invoice.id]
            );
            updatedCount++;
          }
        }
      }

      Logger.info(`[LateFeeSweep] Sweep completed successfully. Updated ${updatedCount} invoices.`, { updatedCount });
    } catch (err) {
      Logger.error('[LateFeeSweep] Error running late fee sweep', err);
    }
  }

  static schedule() {
    cron.schedule(env.LATE_FEE_SWEEP_CRON, () => {
      this.runSweep();
    });
    Logger.info(`[LateFeeSweep] Scheduled cron job with pattern: '${env.LATE_FEE_SWEEP_CRON}'`);
  }
}
