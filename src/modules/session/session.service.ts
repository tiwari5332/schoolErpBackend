import db from '../../config/database';
import { CreateSessionDTO, UpdateSessionDTO, SessionStatus, AcademicSessionResponse } from './session.dto';
import { BusinessRuleException, NotFoundError } from '../../utils/response';
import { Logger } from '../../libs/logger';

export class SessionService {
  /**
   * Helper to format Date / ISO string to YYYY-MM-DD
   */
  static formatDate(val: string | Date): string {
    if (val instanceof Date) {
      return val.toISOString().slice(0, 10);
    }
    return String(val).slice(0, 10);
  }

  /**
   * Auto-generate session name from start and end dates (e.g. "2027-28")
   */
  static generateSessionName(startDate: string, endDate: string): string {
    const startYear = parseInt(startDate.slice(0, 4), 10);
    const endYear = parseInt(endDate.slice(0, 4), 10);
    if (!isNaN(startYear) && !isNaN(endYear)) {
      if (endYear > startYear) {
        return `${startYear}-${String(endYear).slice(-2)}`;
      }
      return `${startYear}`;
    }
    return `${startDate.slice(0, 4)}-${endDate.slice(0, 4)}`;
  }

  /**
   * Check for overlapping date ranges within the same school.
   * Throws 409 Conflict if an overlap exists.
   */
  static async checkOverlap(
    schoolId: string,
    startDate: string,
    endDate: string,
    excludeSessionId?: string,
    client: any = db
  ): Promise<void> {
    const query = `
      SELECT id, name, TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate"
      FROM academic_sessions
      WHERE school_id = $1
        AND ($2::uuid IS NULL OR id != $2)
        AND start_date <= $3::date
        AND end_date >= $4::date
      LIMIT 1
    `;
    const res = await client.query(query, [
      schoolId,
      excludeSessionId || null,
      endDate,
      startDate,
    ]);

    if (res.rows.length > 0) {
      const conflicting = res.rows[0];
      throw new BusinessRuleException(
        `Academic session date range (${startDate} to ${endDate}) overlaps with existing session '${conflicting.name}' (${conflicting.startDate} to ${conflicting.endDate})`,
        409,
        { conflictingSessionId: conflicting.id, conflictingName: conflicting.name },
        'CONFLICT'
      );
    }
  }

  /**
   * Check for duplicate session name within the same school.
   * Throws 409 Conflict if duplicate exists.
   */
  static async checkDuplicateName(
    schoolId: string,
    name: string,
    excludeSessionId?: string,
    client: any = db
  ): Promise<void> {
    const query = `
      SELECT id FROM academic_sessions
      WHERE school_id = $1
        AND LOWER(name) = LOWER($2)
        AND ($3::uuid IS NULL OR id != $3)
      LIMIT 1
    `;
    const res = await client.query(query, [schoolId, name, excludeSessionId || null]);
    if (res.rows.length > 0) {
      throw new BusinessRuleException(
        `An academic session with name '${name}' already exists in this school`,
        409,
        { duplicateName: name },
        'CONFLICT'
      );
    }
  }

  /**
   * 1. GET /api/academic-sessions
   * Returns list of sessions sorted by start_date DESC.
   */
  static async getSessions(schoolId: string, status?: SessionStatus): Promise<AcademicSessionResponse[]> {
    let query = `
      SELECT
        id,
        name,
        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
        TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
        status,
        is_current as "isCurrent"
      FROM academic_sessions
      WHERE school_id = $1
    `;
    const params: any[] = [schoolId];

    if (status) {
      params.push(status);
      query += ` AND status = $2`;
    }

    query += ` ORDER BY start_date DESC`;

    const res = await db.query(query, params);
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status as SessionStatus,
      isCurrent: Boolean(r.isCurrent),
    }));
  }

  /**
   * Get session by ID
   */
  static async getSessionById(schoolId: string, id: string): Promise<AcademicSessionResponse> {
    const res = await db.query(
      `SELECT
        id,
        name,
        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
        TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
        status,
        is_current as "isCurrent"
      FROM academic_sessions
      WHERE school_id = $1 AND id = $2`,
      [schoolId, id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Academic session not found: ${id}`);
    }

    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status as SessionStatus,
      isCurrent: Boolean(r.isCurrent),
    };
  }

  /**
   * 2. POST /api/academic-sessions (Super Admin only)
   * Auto-generate name if omitted.
   * New sessions are always created as 'upcoming' with is_current = false.
   * If copyFromSessionId is given, copies classes, sections, subjects and fee structures inside the same DB transaction.
   */
  static async createSession(
    schoolId: string,
    data: CreateSessionDTO,
    createdBy?: string
  ): Promise<AcademicSessionResponse & { copiedCounts?: any }> {
    const startDate = this.formatDate(data.startDate);
    const endDate = this.formatDate(data.endDate);
    const name = data.name && data.name.trim().length > 0 ? data.name.trim() : this.generateSessionName(startDate, endDate);

    return await db.transaction(async (client) => {
      // 1. Overlap check
      await this.checkOverlap(schoolId, startDate, endDate, undefined, client);

      // 2. Duplicate name check
      await this.checkDuplicateName(schoolId, name, undefined, client);

      let copiedCounts: any = undefined;

      // 3. If copyFromSessionId is given, validate source session exists
      if (data.copyFromSessionId) {
        const srcRes = await client.query(
          `SELECT id, name FROM academic_sessions WHERE id = $1 AND school_id = $2`,
          [data.copyFromSessionId, schoolId]
        );
        if (srcRes.rows.length === 0) {
          throw new NotFoundError(`Source session to copy from not found: ${data.copyFromSessionId}`);
        }
      }

      // 4. Insert new academic session (always 'upcoming' and is_current = false)
      const insertRes = await client.query(
        `INSERT INTO academic_sessions (
          id, school_id, name, start_date, end_date, status, is_current, created_by, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3::date, $4::date, 'upcoming', false, $5, NOW(), NOW()
        ) RETURNING
          id,
          name,
          TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
          TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
          status,
          is_current as "isCurrent"`,
        [schoolId, name, startDate, endDate, createdBy || null]
      );
      const newSession = insertRes.rows[0];

      // 5. Keep academic_years table in sync for foreign key integrity in legacy modules
      await client.query(
        `INSERT INTO academic_years (id, school_id, name, start_date, end_date, status, created_at)
         VALUES ($1, $2, $3, $4::date, $5::date, 'UPCOMING', NOW())
         ON CONFLICT (id) DO NOTHING`,
        [newSession.id, schoolId, name, startDate, endDate]
      );

      // 6. If copyFromSessionId is provided, copy sections, subject maps, and fee structures
      if (data.copyFromSessionId) {
        // Fetch sections from source session (matching source session id as academic_year_id)
        const srcSectionsRes = await client.query(
          `SELECT id, grade_id, name, capacity, class_teacher_id
           FROM sections
           WHERE school_id = $1 AND academic_year_id = $2`,
          [schoolId, data.copyFromSessionId]
        );

        let sectionsCopied = 0;
        let subjectsCopied = 0;
        let feesCopied = 0;

        for (const sec of srcSectionsRes.rows) {
          // Clone section
          const newSecRes = await client.query(
            `INSERT INTO sections (id, school_id, grade_id, academic_year_id, name, capacity, class_teacher_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [schoolId, sec.grade_id, newSession.id, sec.name, sec.capacity, sec.class_teacher_id]
          );
          const newSecId = newSecRes.rows[0].id;
          sectionsCopied++;

          // Copy subject mappings for this section
          const subMapRes = await client.query(
            `INSERT INTO section_subject_maps (id, section_id, subject_id)
             SELECT gen_random_uuid(), $1, subject_id
             FROM section_subject_maps
             WHERE section_id = $2
             RETURNING id`,
            [newSecId, sec.id]
          );
          subjectsCopied += subMapRes.rowCount || 0;

          // Copy fee structures for this section
          const feeRes = await client.query(
            `INSERT INTO section_fee_structures (id, section_id, fee_component_id, amount, frequency)
             SELECT gen_random_uuid(), $1, fee_component_id, amount, frequency
             FROM section_fee_structures
             WHERE section_id = $2
             RETURNING id`,
            [newSecId, sec.id]
          );
          feesCopied += feeRes.rowCount || 0;
        }

        copiedCounts = { sectionsCopied, subjectsCopied, feesCopied };
      }

      // 7. Write audit log
      await client.query(
        `INSERT INTO academic_session_audit_logs (id, school_id, session_id, action, performed_by, details)
         VALUES (gen_random_uuid(), $1, $2, 'CREATE_SESSION', $3, $4)`,
        [
          schoolId,
          newSession.id,
          createdBy || null,
          JSON.stringify({
            name,
            startDate,
            endDate,
            copyFromSessionId: data.copyFromSessionId || null,
            copiedCounts,
          }),
        ]
      );

      Logger.info(`[AcademicSession] Created session '${name}' (${newSession.id}) for school ${schoolId}`, {
        schoolId,
        sessionId: newSession.id,
        copiedCounts,
      });

      return {
        id: newSession.id,
        name: newSession.name,
        startDate: newSession.startDate,
        endDate: newSession.endDate,
        status: newSession.status as SessionStatus,
        isCurrent: Boolean(newSession.isCurrent),
        ...(copiedCounts ? { copiedCounts } : {}),
      };
    });
  }

  /**
   * 3. PUT /api/academic-sessions/:id (Super Admin only)
   * Editable: name, dates. Block date edits on closed sessions.
   */
  static async updateSession(
    schoolId: string,
    id: string,
    data: UpdateSessionDTO,
    performedBy?: string
  ): Promise<AcademicSessionResponse> {
    return await db.transaction(async (client) => {
      // 1. Fetch current session
      const existingRes = await client.query(
        `SELECT
          id,
          name,
          TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
          TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
          status,
          is_current as "isCurrent"
        FROM academic_sessions
        WHERE school_id = $1 AND id = $2
        FOR UPDATE`,
        [schoolId, id]
      );

      if (existingRes.rows.length === 0) {
        throw new NotFoundError(`Academic session not found: ${id}`);
      }

      const existing = existingRes.rows[0];

      // 2. Block date edits on closed sessions
      const hasDateEdit =
        (data.startDate !== undefined && data.startDate !== existing.startDate) ||
        (data.endDate !== undefined && data.endDate !== existing.endDate);

      if (existing.status === 'closed' && hasDateEdit) {
        throw new BusinessRuleException(
          'Date edits are not permitted on closed sessions',
          400,
          { status: existing.status },
          'VALIDATION_ERROR'
        );
      }

      const finalStartDate = data.startDate ? this.formatDate(data.startDate) : existing.startDate;
      const finalEndDate = data.endDate ? this.formatDate(data.endDate) : existing.endDate;
      const finalName = data.name !== undefined ? data.name.trim() : existing.name;

      // 3. Validate endDate > startDate
      if (new Date(finalEndDate) <= new Date(finalStartDate)) {
        throw new BusinessRuleException('endDate must be after startDate', 400, null, 'VALIDATION_ERROR');
      }

      // 4. Overlap check if dates changed
      if (finalStartDate !== existing.startDate || finalEndDate !== existing.endDate) {
        await this.checkOverlap(schoolId, finalStartDate, finalEndDate, id, client);
      }

      // 5. Duplicate name check if name changed
      if (finalName.toLowerCase() !== existing.name.toLowerCase()) {
        await this.checkDuplicateName(schoolId, finalName, id, client);
      }

      // 6. Update session
      const updateRes = await client.query(
        `UPDATE academic_sessions
         SET name = $1, start_date = $2::date, end_date = $3::date, updated_at = NOW()
         WHERE id = $4
         RETURNING
           id,
           name,
           TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
           TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
           status,
           is_current as "isCurrent"`,
        [finalName, finalStartDate, finalEndDate, id]
      );
      const updated = updateRes.rows[0];

      // Update academic_years if present
      await client.query(
        `UPDATE academic_years
         SET name = $1, start_date = $2::date, end_date = $3::date
         WHERE id = $4`,
        [finalName, finalStartDate, finalEndDate, id]
      );

      // Audit log
      await client.query(
        `INSERT INTO academic_session_audit_logs (id, school_id, session_id, action, performed_by, details)
         VALUES (gen_random_uuid(), $1, $2, 'UPDATE_SESSION', $3, $4)`,
        [
          schoolId,
          id,
          performedBy || null,
          JSON.stringify({ previous: existing, updated: { name: finalName, startDate: finalStartDate, endDate: finalEndDate } }),
        ]
      );

      return {
        id: updated.id,
        name: updated.name,
        startDate: updated.startDate,
        endDate: updated.endDate,
        status: updated.status as SessionStatus,
        isCurrent: Boolean(updated.isCurrent),
      };
    });
  }

  /**
   * 4. PATCH /api/academic-sessions/:id/set-current (Super Admin only)
   * In ONE transaction:
   * - Reject if the target is 'closed'
   * - Mark the old current session 'closed' and is_current = false
   * - Set this one 'current' and is_current = true
   * - Write an audit-log entry
   */
  static async setCurrentSession(
    schoolId: string,
    id: string,
    performedBy?: string
  ): Promise<AcademicSessionResponse> {
    return await db.transaction(async (client) => {
      // 1. Fetch and lock target session
      const targetRes = await client.query(
        `SELECT
          id,
          name,
          TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
          TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
          status,
          is_current as "isCurrent"
        FROM academic_sessions
        WHERE school_id = $1 AND id = $2
        FOR UPDATE`,
        [schoolId, id]
      );

      if (targetRes.rows.length === 0) {
        throw new NotFoundError(`Academic session not found: ${id}`);
      }

      const target = targetRes.rows[0];

      // 2. Reject if the target is 'closed'
      if (target.status === 'closed') {
        throw new BusinessRuleException(
          `Cannot set a closed session as current. Target session '${target.name}' is already closed.`,
          409,
          { targetSessionId: id, currentStatus: target.status },
          'CONFLICT'
        );
      }

      // 3. Fetch previous current session (if any)
      const prevRes = await client.query(
        `SELECT id, name FROM academic_sessions
         WHERE school_id = $1 AND is_current = true AND id != $2
         FOR UPDATE`,
        [schoolId, id]
      );
      const previousSession = prevRes.rows[0] || null;

      // 4. Mark old current session as 'closed' and is_current = false
      if (previousSession) {
        await client.query(
          `UPDATE academic_sessions
           SET status = 'closed', is_current = false, updated_at = NOW()
           WHERE school_id = $1 AND is_current = true AND id != $2`,
          [schoolId, id]
        );
      }

      // 5. Set target session to 'current' and is_current = true
      const updateRes = await client.query(
        `UPDATE academic_sessions
         SET status = 'current', is_current = true, updated_at = NOW()
         WHERE id = $1
         RETURNING
           id,
           name,
           TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate",
           TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate",
           status,
           is_current as "isCurrent"`,
        [id]
      );
      const updatedTarget = updateRes.rows[0];

      // 6. Sync academic_years table for legacy compatibility
      if (previousSession) {
        await client.query(
          `UPDATE academic_years SET status = 'COMPLETED' WHERE school_id = $1 AND id = $2`,
          [schoolId, previousSession.id]
        );
      }
      await client.query(
        `UPDATE academic_years SET status = 'ACTIVE' WHERE school_id = $1 AND id = $2`,
        [schoolId, id]
      );

      // 7. Write audit log entry
      await client.query(
        `INSERT INTO academic_session_audit_logs (id, school_id, session_id, action, performed_by, details)
         VALUES (gen_random_uuid(), $1, $2, 'SET_CURRENT', $3, $4)`,
        [
          schoolId,
          id,
          performedBy || null,
          JSON.stringify({
            previousCurrentSessionId: previousSession?.id || null,
            previousCurrentSessionName: previousSession?.name || null,
            newCurrentSessionId: updatedTarget.id,
            newCurrentSessionName: updatedTarget.name,
          }),
        ]
      );

      Logger.info(`[AcademicSession] Set session '${updatedTarget.name}' (${updatedTarget.id}) as CURRENT for school ${schoolId}`, {
        schoolId,
        previousSessionId: previousSession?.id,
        currentSessionId: updatedTarget.id,
      });

      return {
        id: updatedTarget.id,
        name: updatedTarget.name,
        startDate: updatedTarget.startDate,
        endDate: updatedTarget.endDate,
        status: updatedTarget.status as SessionStatus,
        isCurrent: Boolean(updatedTarget.isCurrent),
      };
    });
  }

  /**
   * Resolve user's selected session preference, falling back to the current session's ID.
   */
  static async getUserSelectedSessionId(
    actorType: string,
    actorId: string,
    schoolId: string | null
  ): Promise<string | null> {
    // 1. Check user_preferences
    const prefRes = await db.query(
      `SELECT selected_session_id
       FROM user_preferences
       WHERE actor_type = $1 AND actor_id = $2`,
      [actorType, actorId]
    );

    if (prefRes.rows.length > 0 && prefRes.rows[0].selected_session_id) {
      const prefSessionId = prefRes.rows[0].selected_session_id;
      // If schoolId is provided, verify it belongs to this school
      if (schoolId) {
        const verifyRes = await db.query(
          `SELECT id FROM academic_sessions WHERE id = $1 AND school_id = $2`,
          [prefSessionId, schoolId]
        );
        if (verifyRes.rows.length > 0) {
          return prefSessionId;
        }
      } else {
        return prefSessionId;
      }
    }

    // 2. Fallback to current session for this school
    if (schoolId) {
      const currentRes = await db.query(
        `SELECT id FROM academic_sessions WHERE school_id = $1 AND is_current = true LIMIT 1`,
        [schoolId]
      );
      if (currentRes.rows.length > 0) {
        return currentRes.rows[0].id;
      }
    }

    return null;
  }

  /**
   * 6. PUT /api/me/preferences -> { selectedSessionId }
   * Validates that the session belongs to the user's school.
   */
  static async setUserPreference(
    actorType: string,
    actorId: string,
    schoolId: string | null,
    selectedSessionId: string
  ): Promise<{ actorType: string; actorId: string; selectedSessionId: string }> {
    // Validate session existence and school ownership
    if (schoolId) {
      const sessionRes = await db.query(
        `SELECT id, name FROM academic_sessions WHERE id = $1 AND school_id = $2`,
        [selectedSessionId, schoolId]
      );
      if (sessionRes.rows.length === 0) {
        throw new BusinessRuleException(
          `Academic session '${selectedSessionId}' does not exist or does not belong to your school`,
          400,
          { selectedSessionId },
          'VALIDATION_ERROR'
        );
      }
    } else {
      const sessionRes = await db.query(
        `SELECT id FROM academic_sessions WHERE id = $1`,
        [selectedSessionId]
      );
      if (sessionRes.rows.length === 0) {
        throw new NotFoundError(`Academic session '${selectedSessionId}' not found`);
      }
    }

    // Upsert into user_preferences
    await db.query(
      `INSERT INTO user_preferences (id, actor_type, actor_id, selected_session_id, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT (actor_type, actor_id)
       DO UPDATE SET selected_session_id = EXCLUDED.selected_session_id, updated_at = NOW()`,
      [actorType, actorId, selectedSessionId]
    );

    return {
      actorType,
      actorId,
      selectedSessionId,
    };
  }
}
