import db from '../../config/database';
import {
  DashboardSummaryResponse,
  DashboardStaffAttendanceResponse,
  DashboardCommunicationBalanceResponse,
  DashboardPendingActionsResponse,
  DashboardFeeTrendResponse,
  DayType,
  StaffAttendanceItem,
} from './dashboard.dto';
import { BusinessRuleException } from '../../utils/response';

export class DashboardService {
  /**
   * Compute server's "today" in the school's configured timezone.
   * Default: Asia/Kolkata
   */
  static async getSchoolTimezoneAndToday(schoolId: string): Promise<{ timezone: string; today: string }> {
    const res = await db.query<{ timezone: string }>(
      `SELECT timezone FROM schools WHERE id = $1`,
      [schoolId]
    );
    const timezone = res.rows[0]?.timezone || 'Asia/Kolkata';

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = formatter.format(new Date());

    return { timezone, today };
  }

  /**
   * Helper to compute today directly in a given timezone (e.g. for testing)
   */
  static computeTodayInTimezone(timezone: string = 'Asia/Kolkata', date: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }

  /**
   * Resolve day type: 'working' | 'weekly_off' | 'holiday' | 'vacation'
   */
  static async resolveDayType(
    schoolId: string,
    dateStr: string,
    timezone: string = 'Asia/Kolkata'
  ): Promise<{ dayType: DayType; isWorkingDay: boolean }> {
    // 1. Check calendar events for holidays or vacations
    const eventRes = await db.query<{ type: string }>(
      `SELECT type FROM calendar_events
       WHERE school_id = $1
         AND date <= $2::date
         AND (end_date IS NULL OR end_date >= $2::date)
         AND type IN ('holiday', 'vacation')
       ORDER BY (CASE WHEN type = 'holiday' THEN 1 ELSE 2 END)
       LIMIT 1`,
      [schoolId, dateStr]
    );

    if (eventRes.rows.length > 0) {
      const type = eventRes.rows[0].type;
      return {
        dayType: type === 'holiday' ? 'holiday' : 'vacation',
        isWorkingDay: false,
      };
    }

    // 2. Check for Sunday (weekly off) in school's timezone
    // Parse UTC noon to ensure timezone stability
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();

    if (dayOfWeek === 0) {
      return {
        dayType: 'weekly_off',
        isWorkingDay: false,
      };
    }

    // 3. Otherwise working day
    return {
      dayType: 'working',
      isWorkingDay: true,
    };
  }

  /**
   * 1. GET /api/dashboard/summary
   */
  static async getSummary(
    schoolId: string,
    sessionId: string | null,
    canViewFees: boolean
  ): Promise<DashboardSummaryResponse> {
    const { timezone, today } = await this.getSchoolTimezoneAndToday(schoolId);
    const { dayType, isWorkingDay } = await this.resolveDayType(schoolId, today, timezone);

    // Verify if session is current
    let isCurrentSession = true;
    if (sessionId) {
      const sessRes = await db.query(
        `SELECT is_current FROM academic_sessions WHERE id = $1 AND school_id = $2`,
        [sessionId, schoolId]
      );
      if (sessRes.rows[0]) {
        isCurrentSession = Boolean(sessRes.rows[0].is_current);
      }
    }

    // 1. Students enrolled & change this month
    const studentRes = await db.query(
      `SELECT
        COUNT(e.id)::int as enrolled,
        COUNT(CASE WHEN e.enrolled_at >= DATE_TRUNC('month', $3::date) THEN 1 END)::int as change_this_month
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.id
       WHERE sec.school_id = $1
         AND ($2::uuid IS NULL OR sec.academic_year_id = $2)
         AND e.status = 'ACTIVE'`,
      [schoolId, sessionId, today]
    );
    const enrolled = studentRes.rows[0]?.enrolled || 0;
    const changeThisMonth = studentRes.rows[0]?.change_this_month || 0;

    // 2. Staff: active (school-wide) and on leave today
    const staffRes = await db.query(
      `SELECT
        COUNT(t.id)::int as active,
        COUNT(CASE WHEN sa.status = 'ON_LEAVE' THEN 1 END)::int as on_leave_today
       FROM teachers t
       LEFT JOIN staff_attendance sa ON t.id = sa.teacher_id AND sa.date = $2::date
       WHERE t.school_id = $1 AND t.status = 'ACTIVE' AND t.is_system = false`,
      [schoolId, today]
    );
    const staffActive = staffRes.rows[0]?.active || 0;
    const onLeaveToday = staffRes.rows[0]?.on_leave_today || 0;

    // 3. Fees (paise, INR)
    let fees: DashboardSummaryResponse['fees'] = null;
    if (canViewFees) {
      const feesRes = await db.query(
        `SELECT
          COALESCE(SUM(CASE WHEN p.paid_at::date = $2::date THEN p.amount ELSE 0 END), 0)::numeric as collected_today,
          COALESCE(SUM(CASE WHEN p.paid_at >= DATE_TRUNC('month', $2::date) THEN p.amount ELSE 0 END), 0)::numeric as collected_month
         FROM payments p
         WHERE (p.school_id = $1 OR p.student_id IN (SELECT id FROM students WHERE school_id = $1))
           AND p.status = 'SUCCESS'`,
        [schoolId, today]
      );

      const pendingDuesRes = await db.query(
        `SELECT COALESCE(SUM(fi.balance), 0)::numeric as pending_dues
         FROM fee_invoices fi
         JOIN enrollments e ON fi.enrollment_id = e.id
         JOIN sections sec ON e.section_id = sec.id
         WHERE sec.school_id = $1
           AND ($2::uuid IS NULL OR sec.academic_year_id = $2)
           AND fi.status IN ('PENDING', 'PARTIAL', 'OVERDUE')`,
        [schoolId, sessionId]
      );

      const collectedTodayNum = Number(feesRes.rows[0]?.collected_today || 0);
      const collectedMonthNum = Number(feesRes.rows[0]?.collected_month || 0);
      const pendingDuesNum = Number(pendingDuesRes.rows[0]?.pending_dues || 0);

      fees = {
        collectedToday: Math.round(collectedTodayNum * 100),
        collectedThisMonth: Math.round(collectedMonthNum * 100),
        pendingDues: Math.round(pendingDuesNum * 100),
        currency: 'INR',
      };
    }

    // 4. Student Attendance
    let studentAttendance: DashboardSummaryResponse['studentAttendance'];
    if (!isWorkingDay) {
      studentAttendance = {
        present: 0,
        absent: 0,
        total: enrolled,
        percentage: null,
        status: 'holiday',
      };
    } else {
      const attRes = await db.query(
        `SELECT
          COUNT(CASE WHEN status = 'PRESENT' THEN 1 END)::int as present,
          COUNT(CASE WHEN status = 'ABSENT' THEN 1 END)::int as absent,
          COUNT(id)::int as marked
         FROM student_attendance
         WHERE school_id = $1
           AND ($2::uuid IS NULL OR academic_year_id = $2)
           AND date = $3::date`,
        [schoolId, sessionId, today]
      );

      const present = attRes.rows[0]?.present || 0;
      const absent = attRes.rows[0]?.absent || 0;
      const marked = attRes.rows[0]?.marked || 0;

      let status: 'not_marked' | 'partial' | 'complete' | 'holiday' = 'not_marked';
      let percentage: number | null = null;

      if (marked === 0) {
        status = 'not_marked';
        percentage = enrolled > 0 ? 0.0 : 0.0;
      } else if (enrolled > 0 && marked < enrolled) {
        status = 'partial';
        percentage = Math.round((present / marked) * 10000) / 100;
      } else {
        status = 'complete';
        percentage = enrolled > 0 ? Math.round((present / enrolled) * 10000) / 100 : 100.0;
      }

      studentAttendance = {
        present,
        absent,
        total: enrolled,
        percentage,
        status,
      };
    }

    return {
      date: today,
      isWorkingDay,
      dayType,
      isCurrentSession,
      students: {
        enrolled,
        changeThisMonth,
      },
      staff: {
        active: staffActive,
        onLeaveToday,
      },
      fees,
      studentAttendance,
    };
  }

  /**
   * 2. GET /api/dashboard/staff-attendance?date=YYYY-MM-DD&limit=5
   */
  static async getStaffAttendance(
    schoolId: string,
    requestedDate?: string,
    limit: number = 5
  ): Promise<DashboardStaffAttendanceResponse> {
    const { timezone, today } = await this.getSchoolTimezoneAndToday(schoolId);
    const date = requestedDate || today;

    if (date > today) {
      throw new BusinessRuleException(
        `Requested date '${date}' cannot be in the future (today is ${today})`,
        400,
        { requestedDate: date, serverToday: today },
        'VALIDATION_ERROR'
      );
    }

    const { dayType } = await this.resolveDayType(schoolId, date, timezone);

    // Counts
    const countsRes = await db.query(
      `SELECT
        COUNT(t.id)::int as total_active,
        COUNT(CASE WHEN sa.status = 'PRESENT' THEN 1 END)::int as present,
        COUNT(CASE WHEN sa.status = 'ABSENT' THEN 1 END)::int as absent,
        COUNT(CASE WHEN sa.status = 'ON_LEAVE' OR sa.status = 'HALF_DAY' THEN 1 END)::int as leave
       FROM teachers t
       LEFT JOIN staff_attendance sa ON t.id = sa.teacher_id AND sa.date = $2::date
       WHERE t.school_id = $1 AND t.status = 'ACTIVE' AND t.is_system = false`,
      [schoolId, date]
    );

    const totalActive = countsRes.rows[0]?.total_active || 0;
    const present = countsRes.rows[0]?.present || 0;
    const absent = countsRes.rows[0]?.absent || 0;
    const leave = countsRes.rows[0]?.leave || 0;
    const notMarked = Math.max(0, totalActive - (present + absent + leave));

    // Items ordered: absent -> notMarked -> leave -> present
    const itemsRes = await db.query(
      `SELECT
        t.id as "staffId",
        t.name,
        t.avatar_url as "avatarUrl",
        t.designation,
        d.name as "department",
        COALESCE(
          CASE
            WHEN sa.status = 'PRESENT' THEN 'present'
            WHEN sa.status = 'ABSENT' THEN 'absent'
            WHEN sa.status = 'ON_LEAVE' OR sa.status = 'HALF_DAY' THEN 'leave'
            ELSE NULL
          END,
          'notMarked'
        ) as status
       FROM teachers t
       LEFT JOIN staff_attendance sa ON t.id = sa.teacher_id AND sa.date = $2::date
       LEFT JOIN teacher_department_maps tdm ON t.id = tdm.teacher_id
       LEFT JOIN departments d ON tdm.department_id = d.id
       WHERE t.school_id = $1 AND t.status = 'ACTIVE' AND t.is_system = false
       ORDER BY
         CASE
           WHEN sa.status = 'ABSENT' THEN 1
           WHEN sa.status IS NULL THEN 2
           WHEN sa.status = 'ON_LEAVE' OR sa.status = 'HALF_DAY' THEN 3
           WHEN sa.status = 'PRESENT' THEN 4
           ELSE 5
         END ASC,
         t.name ASC
       LIMIT $3`,
      [schoolId, date, limit]
    );

    const items: StaffAttendanceItem[] = itemsRes.rows.map((r) => ({
      staffId: r.staffId,
      name: r.name,
      avatarUrl: r.avatarUrl || null,
      department: r.department || null,
      designation: r.designation || null,
      status: r.status as any,
    }));

    return {
      date,
      dayType,
      counts: {
        present,
        absent,
        leave,
        notMarked,
      },
      items,
    };
  }

  /**
   * 3. GET /api/dashboard/communication-balance
   */
  static async getCommunicationBalance(schoolId: string): Promise<DashboardCommunicationBalanceResponse> {
    const res = await db.query(
      `SELECT
        s.low_balance_threshold,
        p.sms_quota,
        p.whatsapp_quota
       FROM schools s
       LEFT JOIN school_subscriptions ss ON s.id = ss.school_id AND ss.status = 'ACTIVE'
       LEFT JOIN plans p ON ss.plan_id = p.id
       WHERE s.id = $1`,
      [schoolId]
    );

    const thresholdPercent = Number(res.rows[0]?.low_balance_threshold || 10);
    const smsQuota = Number(res.rows[0]?.sms_quota || 1000);
    const whatsappQuota = Number(res.rows[0]?.whatsapp_quota || 200);

    // Sum top-up packs
    const topUpRes = await db.query(
      `SELECT channel, COALESCE(SUM(credits_purchased), 0)::int as credits
       FROM top_up_packs
       WHERE school_id = $1
       GROUP BY channel`,
      [schoolId]
    );
    let topUpSms = 0;
    let topUpWhatsApp = 0;
    for (const r of topUpRes.rows) {
      if (r.channel === 'SMS') topUpSms = r.credits;
      if (r.channel === 'WHATSAPP') topUpWhatsApp = r.credits;
    }

    // Usage this month
    const ym = new Date().toISOString().slice(0, 7);
    const usageRes = await db.query(
      `SELECT channel, COALESCE(SUM(plan_credits_used + top_up_credits_used), 0)::int as used
       FROM usage_ledgers
       WHERE school_id = $1 AND year_month = $2
       GROUP BY channel`,
      [schoolId, ym]
    );
    let usedSms = 0;
    let usedWhatsApp = 0;
    for (const r of usageRes.rows) {
      if (r.channel === 'SMS') usedSms = r.used;
      if (r.channel === 'WHATSAPP') usedWhatsApp = r.used;
    }

    const totalSms = smsQuota + topUpSms;
    const remainingSms = Math.max(0, totalSms - usedSms);
    const lowSms = totalSms > 0 ? (remainingSms / totalSms) * 100 < thresholdPercent : false;

    const totalWhatsApp = whatsappQuota + topUpWhatsApp;
    const remainingWhatsApp = Math.max(0, totalWhatsApp - usedWhatsApp);
    const lowWhatsApp = totalWhatsApp > 0 ? (remainingWhatsApp / totalWhatsApp) * 100 < thresholdPercent : false;

    return {
      channels: [
        {
          type: 'sms',
          remaining: remainingSms,
          total: totalSms,
          lowBalance: lowSms,
        },
        {
          type: 'whatsapp',
          remaining: remainingWhatsApp,
          total: totalWhatsApp,
          lowBalance: lowWhatsApp,
        },
        {
          type: 'email',
          remaining: 9999,
          total: 10000,
          lowBalance: false,
        },
      ],
    };
  }

  /**
   * 4. GET /api/dashboard/pending-actions
   */
  static async getPendingActions(
    schoolId: string,
    sessionId: string | null
  ): Promise<DashboardPendingActionsResponse> {
    const { today } = await this.getSchoolTimezoneAndToday(schoolId);

    // Classes where student attendance has NOT been marked today
    const unmarkedClassesRes = await db.query(
      `SELECT
        s.id as "classId",
        CONCAT(g.name, ' - ', s.name) as name,
        s.capacity
       FROM sections s
       JOIN grades g ON s.grade_id = g.id
       WHERE s.school_id = $1
         AND ($2::uuid IS NULL OR s.academic_year_id = $2)
         AND NOT EXISTS (
           SELECT 1 FROM student_attendance sa
           WHERE sa.section_id = s.id AND sa.date = $3::date
         )`,
      [schoolId, sessionId, today]
    );

    const unmarkedClasses = unmarkedClassesRes.rows.map((r) => ({
      classId: r.classId,
      name: r.name,
    }));

    const studentsUnmarked = unmarkedClassesRes.rows.reduce(
      (acc, r) => acc + Number(r.capacity || 40),
      0
    );

    // Staff attendance not marked today
    const staffUnmarkedRes = await db.query(
      `SELECT COUNT(t.id)::int as count
       FROM teachers t
       WHERE t.school_id = $1 AND t.status = 'ACTIVE' AND t.is_system = false
         AND NOT EXISTS (
           SELECT 1 FROM staff_attendance sa
           WHERE sa.teacher_id = t.id AND sa.date = $2::date
         )`,
      [schoolId, today]
    );
    const staffUnmarked = staffUnmarkedRes.rows[0]?.count || 0;

    return {
      attendanceNotMarked: {
        students: studentsUnmarked,
        staff: staffUnmarked,
        classes: unmarkedClasses,
      },
      approvals: {
        leave: 0,
        feeConcession: 0,
        other: 0,
      },
    };
  }

  /**
   * 5. GET /api/dashboard/fee-trend?days=7|30
   */
  static async getFeeTrend(schoolId: string, days: number = 7): Promise<DashboardFeeTrendResponse> {
    const { today } = await this.getSchoolTimezoneAndToday(schoolId);

    // Daily collections for last `days` days
    const trendRes = await db.query(
      `WITH date_series AS (
         SELECT generate_series(
           $2::date - ($3::int - 1) * INTERVAL '1 day',
           $2::date,
           '1 day'::interval
         )::date AS day
       )
       SELECT
         TO_CHAR(ds.day, 'YYYY-MM-DD') as date,
         COALESCE(SUM(p.amount), 0)::numeric as collected
       FROM date_series ds
       LEFT JOIN payments p ON (p.school_id = $1 OR p.student_id IN (SELECT id FROM students WHERE school_id = $1))
                            AND p.paid_at::date = ds.day
                            AND p.status = 'SUCCESS'
       GROUP BY ds.day
       ORDER BY ds.day ASC`,
      [schoolId, today, days]
    );

    let periodTotalInr = 0;
    const points = trendRes.rows.map((r) => {
      const colNum = Number(r.collected);
      periodTotalInr += colNum;
      return {
        date: r.date,
        collected: Math.round(colNum * 100), // in paise
      };
    });

    // Previous period collections
    const prevRes = await db.query(
      `SELECT COALESCE(SUM(p.amount), 0)::numeric as prev_total
       FROM payments p
       WHERE (p.school_id = $1 OR p.student_id IN (SELECT id FROM students WHERE school_id = $1))
         AND p.paid_at::date >= ($2::date - ($3::int * 2 - 1) * INTERVAL '1 day')
         AND p.paid_at::date < ($2::date - ($3::int - 1) * INTERVAL '1 day')
         AND p.status = 'SUCCESS'`,
      [schoolId, today, days]
    );
    const prevTotalInr = Number(prevRes.rows[0]?.prev_total || 0);

    return {
      points,
      total: Math.round(periodTotalInr * 100),
      previousPeriodTotal: Math.round(prevTotalInr * 100),
    };
  }
}
