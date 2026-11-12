import db from '../../config/database';
import { CalendarEventCreateDTO, CalendarEventItem } from '../dashboard/dashboard.dto';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardCache } from '../../libs/cache';

export class CalendarService {
  /**
   * 6. GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Returns events, holidays and weekly offs for the range (max 62 days).
   */
  static async getEvents(
    schoolId: string,
    from: string,
    to: string
  ): Promise<CalendarEventItem[]> {
    const { timezone } = await DashboardService.getSchoolTimezoneAndToday(schoolId);

    // 1. Fetch calendar_events within range
    const eventsRes = await db.query(
      `SELECT
        id,
        title,
        type,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
        all_day as "allDay"
       FROM calendar_events
       WHERE school_id = $1
         AND date <= $3::date
         AND (end_date IS NULL OR end_date >= $2::date)
       ORDER BY date ASC`,
      [schoolId, from, to]
    );

    const items: CalendarEventItem[] = eventsRes.rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      date: r.date,
      endDate: r.endDate || null,
      allDay: Boolean(r.allDay),
    }));

    // 2. Generate Sunday weekly offs for days in range not already covered by holidays
    const holidayDates = new Set<string>();
    for (const it of items) {
      if (it.type === 'holiday' || it.type === 'vacation') {
        holidayDates.add(it.date);
      }
    }

    const cur = new Date(from + 'T00:00:00Z');
    const end = new Date(to + 'T00:00:00Z');

    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10);
      const dayOfWeek = cur.getUTCDay();

      if (dayOfWeek === 0 && !holidayDates.has(dateStr)) {
        items.push({
          id: `weekly-off-${dateStr}`,
          title: 'Sunday (Weekly Off)',
          type: 'holiday',
          date: dateStr,
          endDate: null,
          allDay: true,
        });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // 3. Fee Due Dates within range
    const feeRes = await db.query(
      `SELECT
        TO_CHAR(fi.due_date, 'YYYY-MM-DD') as due_date,
        COUNT(fi.id)::int as count
       FROM fee_invoices fi
       JOIN enrollments e ON fi.enrollment_id = e.id
       JOIN sections s ON e.section_id = s.id
       WHERE s.school_id = $1
         AND fi.due_date >= $2::date AND fi.due_date <= $3::date
         AND fi.status IN ('PENDING', 'OVERDUE')
       GROUP BY fi.due_date`,
      [schoolId, from, to]
    );

    for (const r of feeRes.rows) {
      items.push({
        id: `fee-due-${r.due_date}`,
        title: `Fee Due (${r.count} invoices)`,
        type: 'fee_due',
        date: r.due_date,
        endDate: null,
        allDay: true,
      });
    }

    // Sort by date ascending
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }

  /**
   * 7. GET /api/events/upcoming?days=30&limit=5
   * Next 30 days from the server's today, not only the current month.
   */
  static async getUpcomingEvents(
    schoolId: string,
    days: number = 30,
    limit: number = 5
  ): Promise<CalendarEventItem[]> {
    const { today } = await DashboardService.getSchoolTimezoneAndToday(schoolId);

    const res = await db.query(
      `SELECT
        id,
        title,
        type,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
        all_day as "allDay"
       FROM calendar_events
       WHERE school_id = $1
         AND date >= $2::date
         AND date <= ($2::date + ($3::int * INTERVAL '1 day'))
       ORDER BY date ASC
       LIMIT $4`,
      [schoolId, today, days, limit]
    );

    return res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      date: r.date,
      endDate: r.endDate || null,
      allDay: Boolean(r.allDay),
    }));
  }

  /**
   * 8. POST /api/calendar/events (Super Admin / EVENT_CREATE)
   */
  static async createEvent(
    schoolId: string,
    data: CalendarEventCreateDTO,
    createdBy?: string
  ): Promise<CalendarEventItem> {
    const res = await db.query(
      `INSERT INTO calendar_events (
        id, school_id, title, type, date, end_date, description, all_day, notify_users, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4::date, $5::date, $6, true, $7, $8, NOW(), NOW()
      ) RETURNING
        id,
        title,
        type,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
        all_day as "allDay"`,
      [
        schoolId,
        data.title,
        data.type,
        data.date,
        data.endDate || null,
        data.description || null,
        data.notifyUsers || false,
        createdBy || null,
      ]
    );

    // Invalidate dashboard caches when a new event/holiday is added
    DashboardCache.invalidate(schoolId, 'summary');

    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      date: row.date,
      endDate: row.endDate || null,
      allDay: Boolean(row.allDay),
    };
  }
}
