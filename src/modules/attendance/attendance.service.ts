import db from '../../config/database';
import { BusinessRuleException, NotFoundError } from '../../utils/response';
import { NotificationService } from '../notification/notification.service';
import { Logger } from '../../libs/logger';

export interface DailyAttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
  remarks?: string;
}

export interface SubjectWiseAttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export class AttendanceService {
  /**
   * 9.1 Daily Homeroom Attendance (Primary)
   * Recorded once each morning by class teacher for a section.
   * Auto-triggers parent absence notification when marked ABSENT.
   * Recalculates monthly attendance ledger.
   */
  static async recordDailyHomeroomAttendance(
    schoolId: string,
    recordedByTeacherId: string | null,
    sectionId: string,
    date: string, // YYYY-MM-DD
    records: DailyAttendanceRecord[]
  ) {
    if (!records || records.length === 0) {
      throw new BusinessRuleException('No attendance records provided');
    }

    // 1. Verify section exists and fetch active academic year & grade details
    const secRes = await db.query(
      `SELECT s.id, s.academic_year_id, s.name as section_name, g.name as grade_name, s.class_teacher_id
       FROM sections s
       JOIN grades g ON s.grade_id = g.id
       WHERE s.id = $1 AND s.school_id = $2`,
      [sectionId, schoolId]
    );

    const section = secRes.rows[0];
    if (!section) {
      throw new NotFoundError(`Section not found: ${sectionId}`);
    }

    const academicYearId = section.academic_year_id;
    const yearMonth = date.slice(0, 7); // e.g. '2026-10'

    let absentCount = 0;
    let presentCount = 0;
    let notificationsSent = 0;

    // 2. Process records in transaction
    await db.transaction(async (client) => {
      for (const rec of records) {
        // Upsert student attendance record for daily homeroom
        const existingRes = await client.query(
          `SELECT id, status FROM student_attendance
           WHERE school_id = $1 AND student_id = $2 AND date = $3::date AND attendance_type = 'DAILY_HOMEROOM'`,
          [schoolId, rec.studentId, date]
        );

        const isNewAbsent = rec.status === 'ABSENT' && (!existingRes.rows[0] || existingRes.rows[0].status !== 'ABSENT');

        if (existingRes.rows.length > 0) {
          await client.query(
            `UPDATE student_attendance
             SET status = $1, remarks = $2, recorded_by_teacher_id = $3, updated_at = NOW()
             WHERE id = $4`,
            [rec.status, rec.remarks || null, recordedByTeacherId, existingRes.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO student_attendance
             (id, school_id, student_id, section_id, academic_year_id, date, attendance_type, status, remarks, recorded_by_teacher_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::date, 'DAILY_HOMEROOM', $6, $7, $8)`,
            [schoolId, rec.studentId, sectionId, academicYearId, date, rec.status, rec.remarks || null, recordedByTeacherId]
          );
        }

        if (rec.status === 'ABSENT') {
          absentCount++;
          // Trigger HLD Section 9.3 parent absence alert
          if (isNewAbsent) {
            const studentInfoRes = await client.query(
              `SELECT st.name as student_name, pa.msisdn, pa.email
               FROM students st
               LEFT JOIN guardians g ON st.id = g.student_id AND g.is_primary = true
               LEFT JOIN parent_accounts pa ON g.parent_account_id = pa.id
               WHERE st.id = $1`,
              [rec.studentId]
            );

            const studentInfo = studentInfoRes.rows[0];
            if (studentInfo) {
              const gradeSectionLabel = `${section.grade_name} - ${section.section_name}`;
              await NotificationService.sendAbsenteeNotification({
                schoolId,
                studentName: studentInfo.student_name,
                gradeSection: gradeSectionLabel,
                date,
                parentPhone: studentInfo.msisdn,
                parentEmail: studentInfo.email,
                channel: 'SMS',
              });
              notificationsSent++;
            }
          }
        } else {
          presentCount++;
        }
      }

      // 3. Recalculate monthly attendance ledger for this section and month
      await this.recalculateMonthlyLedger(client, schoolId, sectionId, yearMonth);
    });

    return {
      message: 'Daily homeroom attendance recorded successfully',
      date,
      sectionId,
      totalStudents: records.length,
      presentCount,
      absentCount,
      notificationsSent,
    };
  }

  /**
   * 9.1 Period / Subject-Wise Attendance (Secondary)
   * Recorded for individual lecture slots by subject teachers.
   */
  static async recordSubjectWiseAttendance(
    schoolId: string,
    recordedByTeacherId: string | null,
    sectionId: string,
    subjectId: string,
    date: string,
    records: SubjectWiseAttendanceRecord[]
  ) {
    if (!records || records.length === 0) {
      throw new BusinessRuleException('No attendance records provided');
    }

    const secRes = await db.query(
      `SELECT s.id, s.academic_year_id FROM sections s WHERE s.id = $1 AND s.school_id = $2`,
      [sectionId, schoolId]
    );
    const section = secRes.rows[0];
    if (!section) throw new NotFoundError(`Section not found: ${sectionId}`);

    const subRes = await db.query(
      `SELECT id, name FROM subjects WHERE id = $1 AND school_id = $2`,
      [subjectId, schoolId]
    );
    if (!subRes.rows[0]) throw new NotFoundError(`Subject not found: ${subjectId}`);

    await db.transaction(async (client) => {
      for (const rec of records) {
        const existingRes = await client.query(
          `SELECT id FROM student_attendance
           WHERE school_id = $1 AND student_id = $2 AND date = $3::date
             AND attendance_type = 'SUBJECT_WISE' AND subject_id = $4`,
          [schoolId, rec.studentId, date, subjectId]
        );

        if (existingRes.rows.length > 0) {
          await client.query(
            `UPDATE student_attendance
             SET status = $1, remarks = $2, recorded_by_teacher_id = $3, updated_at = NOW()
             WHERE id = $4`,
            [rec.status, rec.remarks || null, recordedByTeacherId, existingRes.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO student_attendance
             (id, school_id, student_id, section_id, academic_year_id, date, attendance_type, subject_id, status, remarks, recorded_by_teacher_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::date, 'SUBJECT_WISE', $6, $7, $8, $9)`,
            [
              schoolId,
              rec.studentId,
              sectionId,
              section.academic_year_id,
              date,
              subjectId,
              rec.status,
              rec.remarks || null,
              recordedByTeacherId,
            ]
          );
        }
      }
    });

    return {
      message: 'Subject-wise attendance recorded successfully',
      date,
      sectionId,
      subjectId,
      recordsUpdated: records.length,
    };
  }

  /**
   * Get attendance for a section on a specific date
   */
  static async getSectionAttendance(
    schoolId: string,
    sectionId: string,
    date: string,
    attendanceType: string = 'DAILY_HOMEROOM',
    subjectId?: string
  ) {
    const res = await db.query(
      `SELECT
         st.id as student_id,
         st.student_code,
         st.name as student_name,
         e.roll_no,
         sa.id as attendance_id,
         COALESCE(sa.status, 'NOT_MARKED') as status,
         sa.remarks,
         sa.attendance_type,
         sa.date
       FROM enrollments e
       JOIN students st ON e.student_id = st.id
       LEFT JOIN student_attendance sa ON sa.student_id = st.id
         AND sa.date = $3::date
         AND sa.attendance_type = $4
         AND ($5::uuid IS NULL OR sa.subject_id = $5)
       WHERE e.section_id = $1 AND st.school_id = $2 AND e.status = 'ACTIVE'
       ORDER BY e.roll_no ASC NULLS LAST, st.name ASC`,
      [sectionId, schoolId, date, attendanceType, subjectId || null]
    );

    return res.rows;
  }

  /**
   * Recalculate monthly attendance ledger and calculate exam-eligibility percentage (HLD Section 9.1)
   */
  private static async recalculateMonthlyLedger(
    client: any,
    schoolId: string,
    sectionId: string,
    yearMonth: string
  ) {
    // 1. Get all students actively enrolled in section
    const studentsRes = await client.query(
      `SELECT student_id FROM enrollments WHERE section_id = $1 AND status = 'ACTIVE'`,
      [sectionId]
    );

    const startDate = `${yearMonth}-01`;

    for (const student of studentsRes.rows) {
      const studentId = student.student_id;

      // Calculate attendance statistics from daily homeroom records for the month
      const statsRes = await client.query(
        `SELECT
           COUNT(*)::int as total_working_days,
           COUNT(*) FILTER (WHERE status = 'PRESENT')::int as present_days,
           COUNT(*) FILTER (WHERE status = 'ABSENT')::int as absent_days,
           COUNT(*) FILTER (WHERE status = 'LATE')::int as late_days,
           COUNT(*) FILTER (WHERE status = 'HALF_DAY')::int as half_days,
           COUNT(*) FILTER (WHERE status = 'EXCUSED')::int as excused_days
         FROM student_attendance
         WHERE student_id = $1
           AND attendance_type = 'DAILY_HOMEROOM'
           AND TO_CHAR(date, 'YYYY-MM') = $2`,
        [studentId, yearMonth]
      );

      const stats = statsRes.rows[0];
      const totalWorkingDays = stats.total_working_days || 0;
      const presentDays = stats.present_days || 0;
      const absentDays = stats.absent_days || 0;
      const lateDays = stats.late_days || 0;
      const halfDays = stats.half_days || 0;
      const excusedDays = stats.excused_days || 0;

      // Effective present days: present + (half_days * 0.5) + excused_days
      const effectivePresent = presentDays + halfDays * 0.5 + excusedDays;
      const percentage = totalWorkingDays > 0 ? Number(((effectivePresent / totalWorkingDays) * 100).toFixed(2)) : 0.0;
      const examEligible = percentage >= 75.0 || totalWorkingDays === 0;

      await client.query(
        `INSERT INTO monthly_attendance_ledgers
         (id, school_id, student_id, section_id, year_month, total_working_days, present_days, absent_days, late_days, half_days, excused_days, percentage, exam_eligible, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (student_id, year_month) DO UPDATE
         SET total_working_days = EXCLUDED.total_working_days,
             present_days = EXCLUDED.present_days,
             absent_days = EXCLUDED.absent_days,
             late_days = EXCLUDED.late_days,
             half_days = EXCLUDED.half_days,
             excused_days = EXCLUDED.excused_days,
             percentage = EXCLUDED.percentage,
             exam_eligible = EXCLUDED.exam_eligible,
             updated_at = NOW()`,
        [
          schoolId,
          studentId,
          sectionId,
          yearMonth,
          totalWorkingDays,
          presentDays,
          absentDays,
          lateDays,
          halfDays,
          excusedDays,
          percentage,
          examEligible,
        ]
      );
    }
  }

  /**
   * Get student attendance summary and exam eligibility report (HLD Section 9.1)
   */
  static async getStudentAttendanceSummary(schoolId: string, studentId: string, yearMonth?: string) {
    const studentRes = await db.query(
      `SELECT s.id, s.name, s.student_code, sec.id as section_id, sec.name as section_name, g.name as grade_name
       FROM students s
       LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'ACTIVE'
       LEFT JOIN sections sec ON e.section_id = sec.id
       LEFT JOIN grades g ON sec.grade_id = g.id
       WHERE s.id = $1 AND s.school_id = $2`,
      [studentId, schoolId]
    );

    const student = studentRes.rows[0];
    if (!student) throw new NotFoundError(`Student not found: ${studentId}`);

    const ledgersRes = await db.query(
      `SELECT * FROM monthly_attendance_ledgers
       WHERE student_id = $1 AND school_id = $2
         AND ($3::varchar IS NULL OR year_month = $3)
       ORDER BY year_month DESC`,
      [studentId, schoolId, yearMonth || null]
    );

    // Calculate cumulative overall attendance
    const overallStatsRes = await db.query(
      `SELECT
         COUNT(*)::int as total_days,
         COUNT(*) FILTER (WHERE status = 'PRESENT')::int as present_days,
         COUNT(*) FILTER (WHERE status = 'ABSENT')::int as absent_days,
         COUNT(*) FILTER (WHERE status = 'LATE')::int as late_days,
         COUNT(*) FILTER (WHERE status = 'HALF_DAY')::int as half_days,
         COUNT(*) FILTER (WHERE status = 'EXCUSED')::int as excused_days
       FROM student_attendance
       WHERE student_id = $1 AND attendance_type = 'DAILY_HOMEROOM'`,
      [studentId]
    );

    const overall = overallStatsRes.rows[0];
    const totalDays = overall.total_days || 0;
    const effectivePresent =
      (overall.present_days || 0) + (overall.half_days || 0) * 0.5 + (overall.excused_days || 0);
    const cumulativePercentage = totalDays > 0 ? Number(((effectivePresent / totalDays) * 100).toFixed(2)) : 100.0;
    const examEligible = cumulativePercentage >= 75.0;

    return {
      student,
      cumulative: {
        totalDays,
        presentDays: overall.present_days || 0,
        absentDays: overall.absent_days || 0,
        lateDays: overall.late_days || 0,
        halfDays: overall.half_days || 0,
        excusedDays: overall.excused_days || 0,
        attendancePercentage: cumulativePercentage,
        examEligible,
      },
      monthlyBreakdown: ledgersRes.rows,
    };
  }

  /**
   * 9.2 Teacher and Staff Attendance
   * Integrates with biometric scanners, RFID swipe cards, mobile geofencing or manual.
   */
  static async recordStaffCheckIn(
    schoolId: string,
    teacherId: string,
    source: string = 'MANUAL',
    remarks?: string
  ) {
    const teacherRes = await db.query(
      `SELECT id, name, employee_code FROM teachers WHERE id = $1 AND school_id = $2`,
      [teacherId, schoolId]
    );
    if (!teacherRes.rows[0]) throw new NotFoundError(`Teacher/staff not found: ${teacherId}`);

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    const res = await db.query(
      `INSERT INTO staff_attendance (id, school_id, teacher_id, date, check_in_time, status, source, remarks)
       VALUES (gen_random_uuid(), $1, $2, $3::date, $4, 'PRESENT', $5, $6)
       ON CONFLICT (school_id, teacher_id, date) DO UPDATE
       SET check_in_time = COALESCE(staff_attendance.check_in_time, EXCLUDED.check_in_time),
           source = EXCLUDED.source,
           remarks = COALESCE(EXCLUDED.remarks, staff_attendance.remarks),
           updated_at = NOW()
       RETURNING *`,
      [schoolId, teacherId, today, now, source, remarks || null]
    );

    return res.rows[0];
  }

  static async recordStaffCheckOut(
    schoolId: string,
    teacherId: string,
    source: string = 'MANUAL',
    remarks?: string
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    const existingRes = await db.query(
      `SELECT * FROM staff_attendance WHERE school_id = $1 AND teacher_id = $2 AND date = $3::date`,
      [schoolId, teacherId, today]
    );

    const existing = existingRes.rows[0];
    if (!existing || !existing.check_in_time) {
      throw new BusinessRuleException('Cannot check out without an active check-in today');
    }

    const checkIn = new Date(existing.check_in_time);
    const hoursWorked = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    // Compute status: if less than 4 hours -> HALF_DAY, else PRESENT
    const status = hoursWorked < 4.0 ? 'HALF_DAY' : 'PRESENT';

    const res = await db.query(
      `UPDATE staff_attendance
       SET check_out_time = $1, status = $2, source = $3, remarks = COALESCE($4, remarks), updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [now, status, source, remarks || null, existing.id]
    );

    return {
      ...res.rows[0],
      hoursWorked: Number(hoursWorked.toFixed(2)),
    };
  }

  static async getStaffAttendance(schoolId: string, date?: string, yearMonth?: string) {
    const res = await db.query(
      `SELECT
         t.id as teacher_id,
         t.name as teacher_name,
         t.employee_code,
         t.designation,
         sa.id as attendance_id,
         sa.date,
         sa.check_in_time,
         sa.check_out_time,
         COALESCE(sa.status, 'NOT_MARKED') as status,
         sa.source,
         sa.remarks
       FROM teachers t
       LEFT JOIN staff_attendance sa ON t.id = sa.teacher_id
         AND ($3::date IS NULL OR sa.date = $3::date)
         AND ($4::varchar IS NULL OR TO_CHAR(sa.date, 'YYYY-MM') = $4)
       WHERE t.school_id = $1 AND t.status = 'ACTIVE'
       ORDER BY t.name ASC`,
      [schoolId, date || null, date || null, yearMonth || null]
    );

    return res.rows;
  }
}

export default AttendanceService;

