import db from '../../config/database';
import { BusinessRuleException, NotFoundError } from '../../utils/response';

export class FeeService {
  // --- Fee Components ---

  static async getFeeComponents(schoolId: string) {
    const res = await db.query(`SELECT * FROM fee_components WHERE school_id = $1`, [schoolId]);
    return res.rows;
  }

  static async createFeeComponent(schoolId: string, name: string, code: string) {
    const existingRes = await db.query(
      `SELECT id FROM fee_components WHERE school_id = $1 AND code = $2`,
      [schoolId, code]
    );
    if (existingRes.rows.length > 0) throw new BusinessRuleException(`Fee component '${code}' already exists`);

    const res = await db.query(
      `INSERT INTO fee_components (id, school_id, name, code)
       VALUES (gen_random_uuid(), $1, $2, $3)
       RETURNING *`,
      [schoolId, name, code]
    );
    return res.rows[0];
  }

  // --- Section Fee Structures ---

  static async getSectionFeeStructure(sectionId: string) {
    const res = await db.query(
      `SELECT sfs.*, row_to_json(fc.*) as "feeComponent"
       FROM section_fee_structures sfs
       JOIN fee_components fc ON sfs.fee_component_id = fc.id
       WHERE sfs.section_id = $1`,
      [sectionId]
    );
    return res.rows;
  }

  static async setSectionFeeStructure(sectionId: string, items: Array<{ feeComponentId: string; amount: number; frequency: string }>) {
    await db.query(`DELETE FROM section_fee_structures WHERE section_id = $1`, [sectionId]);

    for (const item of items) {
      await db.query(
        `INSERT INTO section_fee_structures (id, section_id, fee_component_id, amount, frequency)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         ON CONFLICT (section_id, fee_component_id) DO UPDATE SET amount = EXCLUDED.amount, frequency = EXCLUDED.frequency`,
        [sectionId, item.feeComponentId, item.amount, item.frequency]
      );
    }

    return this.getSectionFeeStructure(sectionId);
  }

  // --- Late Fee Slabs (Append-Only Effective-Dated) ---

  static async getLateFeeSlabs(schoolId: string) {
    const res = await db.query(
      `SELECT * FROM late_fee_slabs WHERE school_id = $1 AND effective_to IS NULL ORDER BY days_overdue_from ASC`,
      [schoolId]
    );
    return res.rows;
  }

  static async updateLateFeeSlabs(schoolId: string, slabs: Array<{ daysOverdueFrom: number; daysOverdueTo: number; amount: number }>) {
    const now = new Date();
    await db.query(
      `UPDATE late_fee_slabs SET effective_to = $1 WHERE school_id = $2 AND effective_to IS NULL`,
      [now, schoolId]
    );

    for (const s of slabs) {
      await db.query(
        `INSERT INTO late_fee_slabs (id, school_id, days_overdue_from, days_overdue_to, amount, effective_from)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
        [schoolId, s.daysOverdueFrom, s.daysOverdueTo, s.amount, now]
      );
    }

    return this.getLateFeeSlabs(schoolId);
  }

  // --- Bulk Payment Discount Policies ---

  static async createDiscountPolicy(schoolId: string, data: { gradeId?: string; monthsCount: number; discountPercentage: number }) {
    const now = new Date();
    await db.query(
      `UPDATE bulk_payment_discount_policies
       SET effective_to = $1
       WHERE school_id = $2 AND ($3::uuid IS NULL OR grade_id = $3::uuid) AND months_count = $4 AND effective_to IS NULL`,
      [now, schoolId, data.gradeId || null, data.monthsCount]
    );

    const res = await db.query(
      `INSERT INTO bulk_payment_discount_policies (id, school_id, grade_id, months_count, discount_percentage, effective_from)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [schoolId, data.gradeId || null, data.monthsCount, data.discountPercentage, now]
    );
    return res.rows[0];
  }

  // --- Fee Invoices ---

  static async searchInvoices(schoolId: string, filters: { status?: string; sectionId?: string; yearMonth?: string }) {
    const res = await db.query(
      `SELECT fi.*, row_to_json(st.*) as student
       FROM fee_invoices fi
       JOIN students st ON fi.student_id = st.id
       JOIN enrollments e ON fi.enrollment_id = e.id
       WHERE st.school_id = $1
         AND ($2::varchar IS NULL OR fi.status = $2)
         AND ($3::varchar IS NULL OR fi.year_month = $3)
         AND ($4::uuid IS NULL OR e.section_id = $4::uuid)`,
      [schoolId, filters.status || null, filters.yearMonth || null, filters.sectionId || null]
    );
    return res.rows;
  }

  // --- Payments & Refunds ---

  static async recordGatewayPayment(data: {
    studentId: string;
    amount: number;
    gatewayTxnId: string;
    invoiceIds: string[];
  }) {
    const existingRes = await db.query(
      `SELECT * FROM payments WHERE gateway_txn_id = $1`,
      [data.gatewayTxnId]
    );
    if (existingRes.rows.length > 0) {
      return existingRes.rows[0];
    }

    return db.transaction(async (client) => {
      const paymentRes = await client.query(
        `INSERT INTO payments (id, student_id, amount, mode, gateway_txn_id, status)
         VALUES (gen_random_uuid(), $1, $2, 'CARD', $3, 'SUCCESS')
         RETURNING *`,
        [data.studentId, data.amount, data.gatewayTxnId]
      );
      const payment = paymentRes.rows[0];

      let remainingAmount = data.amount;
      for (const invoiceId of data.invoiceIds) {
        if (remainingAmount <= 0) break;
        const invRes = await client.query(`SELECT * FROM fee_invoices WHERE id = $1`, [invoiceId]);
        const invoice = invRes.rows[0];
        if (!invoice) continue;

        const allocated = Math.min(remainingAmount, Number(invoice.balance));
        remainingAmount -= allocated;

        await client.query(
          `INSERT INTO payment_allocations (id, payment_id, fee_invoice_id, amount)
           VALUES (gen_random_uuid(), $1, $2, $3)`,
          [payment.id, invoice.id, allocated]
        );

        const newPaidAmount = Number(invoice.paid_amount) + allocated;
        const newBalance = Number(invoice.balance) - allocated;
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

        await client.query(
          `UPDATE fee_invoices SET paid_amount = $1, balance = $2, status = $3 WHERE id = $4`,
          [newPaidAmount, newBalance, newStatus, invoice.id]
        );
      }

      return payment;
    });
  }

  static async recordManualCashPayment(schoolId: string, adminId: string, data: {
    studentId: string;
    amount: number;
    invoiceIds: string[];
  }) {
    return db.transaction(async (client) => {
      const paymentRes = await client.query(
        `INSERT INTO payments (id, student_id, amount, mode, recorded_by_admin_id, status)
         VALUES (gen_random_uuid(), $1, $2, 'CASH', $3, 'SUCCESS')
         RETURNING *`,
        [data.studentId, data.amount, adminId]
      );
      const payment = paymentRes.rows[0];

      let remainingAmount = data.amount;
      for (const invoiceId of data.invoiceIds) {
        if (remainingAmount <= 0) break;
        const invRes = await client.query(`SELECT * FROM fee_invoices WHERE id = $1`, [invoiceId]);
        const invoice = invRes.rows[0];
        if (!invoice) continue;

        const allocated = Math.min(remainingAmount, Number(invoice.balance));
        remainingAmount -= allocated;

        await client.query(
          `INSERT INTO payment_allocations (id, payment_id, fee_invoice_id, amount)
           VALUES (gen_random_uuid(), $1, $2, $3)`,
          [payment.id, invoice.id, allocated]
        );

        const newPaidAmount = Number(invoice.paid_amount) + allocated;
        const newBalance = Number(invoice.balance) - allocated;
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

        await client.query(
          `UPDATE fee_invoices SET paid_amount = $1, balance = $2, status = $3 WHERE id = $4`,
          [newPaidAmount, newBalance, newStatus, invoice.id]
        );
      }

      return payment;
    });
  }

  static async applyFeeWaiver(invoiceId: string, adminId: string, reason: string) {
    const invRes = await db.query(`SELECT * FROM fee_invoices WHERE id = $1`, [invoiceId]);
    const invoice = invRes.rows[0];
    if (!invoice) throw new NotFoundError(`Invoice not found: ${invoiceId}`);

    const originalLateFee = Number(invoice.late_fee_amount);
    if (originalLateFee <= 0) {
      throw new BusinessRuleException('No late fee to waive on this invoice');
    }

    return db.transaction(async (client) => {
      await client.query(
        `INSERT INTO fee_waiver_logs (id, fee_invoice_id, waived_by_admin_id, original_late_fee, reason)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [invoiceId, adminId, originalLateFee, reason]
      );

      const newTotal = Number(invoice.total_amount) - originalLateFee;
      const newBalance = Math.max(0, Number(invoice.balance) - originalLateFee);
      const newStatus = newBalance <= 0 ? 'PAID' : invoice.status;

      const updatedRes = await client.query(
        `UPDATE fee_invoices
         SET late_fee_amount = 0, total_amount = $1, balance = $2, status = $3
         WHERE id = $4
         RETURNING *`,
        [newTotal, newBalance, newStatus, invoiceId]
      );
      return updatedRes.rows[0];
    });
  }

  static async processRefund(paymentId: string, adminId: string, amount: number, mode: string, reason: string) {
    const payRes = await db.query(`SELECT id FROM payments WHERE id = $1`, [paymentId]);
    if (payRes.rows.length === 0) throw new NotFoundError(`Payment not found: ${paymentId}`);

    const res = await db.query(
      `INSERT INTO refunds (id, payment_id, amount, mode, reason, approved_by_admin_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [paymentId, amount, mode, reason, adminId]
    );
    return res.rows[0];
  }
}
