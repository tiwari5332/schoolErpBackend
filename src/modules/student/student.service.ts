import db from '../../config/database';
import { UpdateStudentDTO, QueryStudentsDTO } from './student.dto';
import { BusinessRuleException, NotFoundError } from '../../utils/response';
import { DashboardCache } from '../../libs/cache';

export class StudentService {
  /**
   * List students with filtering and pagination
   */
  static async getStudents(schoolId: string, query: QueryStudentsDTO) {
    let sql = `
      SELECT
        s.id,
        s.student_code as "studentCode",
        s.name,
        s.email,
        s.phone,
        TO_CHAR(s.dob, 'YYYY-MM-DD') as dob,
        s.address,
        s.aadhar_no as "aadharNo",
        s.blood_group as "bloodGroup",
        TO_CHAR(s.date_of_admission, 'YYYY-MM-DD') as "dateOfAdmission",
        s.previous_school as "previousSchool",
        e.id as "enrollmentId",
        e.section_id as "sectionId",
        sec.name as "sectionName",
        g.name as "gradeName",
        e.roll_no as "rollNo",
        e.status as "enrollmentStatus",
        pa.id as "parentAccountId",
        pa.name as "parentName",
        pa.msisdn as "parentMsisdn",
        pa.email as "parentEmail",
        grd.relation as "relation"
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'ACTIVE'
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN grades g ON sec.grade_id = g.id
      LEFT JOIN guardians grd ON s.id = grd.student_id AND grd.is_primary = true
      LEFT JOIN parent_accounts pa ON grd.parent_account_id = pa.id
      WHERE s.school_id = $1
    `;
    const params: any[] = [schoolId];
    let idx = 2;

    if (query.sectionId) {
      sql += ` AND e.section_id = $${idx++}`;
      params.push(query.sectionId);
    }

    if (query.academicYearId) {
      sql += ` AND sec.academic_year_id = $${idx++}`;
      params.push(query.academicYearId);
    }

    if (query.search) {
      sql += ` AND (LOWER(s.name) LIKE $${idx} OR LOWER(s.student_code) LIKE $${idx} OR s.phone LIKE $${idx})`;
      params.push(`%${query.search.toLowerCase()}%`);
      idx++;
    }

    sql += ` ORDER BY e.roll_no ASC NULLS LAST, s.name ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(query.limit, query.offset);

    const res = await db.query(sql, params);

    const countRes = await db.query(
      `SELECT COUNT(*)::int as total FROM students WHERE school_id = $1`,
      [schoolId]
    );

    return {
      items: res.rows,
      total: countRes.rows[0]?.total || 0,
      limit: query.limit,
      offset: query.offset,
    };
  }

  /**
   * Get single student by ID
   */
  static async getStudentById(schoolId: string, id: string) {
    const res = await db.query(
      `SELECT
        s.id,
        s.student_code as "studentCode",
        s.name,
        s.email,
        s.phone,
        TO_CHAR(s.dob, 'YYYY-MM-DD') as dob,
        s.address,
        s.aadhar_no as "aadharNo",
        s.blood_group as "bloodGroup",
        TO_CHAR(s.date_of_admission, 'YYYY-MM-DD') as "dateOfAdmission",
        s.previous_school as "previousSchool",
        e.id as "enrollmentId",
        e.section_id as "sectionId",
        sec.name as "sectionName",
        g.name as "gradeName",
        e.roll_no as "rollNo",
        e.status as "enrollmentStatus",
        pa.id as "parentAccountId",
        pa.name as "parentName",
        pa.msisdn as "parentMsisdn",
        pa.email as "parentEmail",
        grd.relation as "relation",
        grd.occupation as "guardianOccupation",
        grd.address as "guardianAddress"
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'ACTIVE'
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN grades g ON sec.grade_id = g.id
      LEFT JOIN guardians grd ON s.id = grd.student_id AND grd.is_primary = true
      LEFT JOIN parent_accounts pa ON grd.parent_account_id = pa.id
      WHERE s.id = $1 AND s.school_id = $2`,
      [id, schoolId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Student not found with ID: ${id}`);
    }

    return res.rows[0];
  }

  /**
   * Update student details, enrollment, and parent/guardian info atomically
   */
  static async updateStudent(schoolId: string, id: string, data: UpdateStudentDTO) {
    // 1. Verify existence
    const existingRes = await db.query(
      `SELECT * FROM students WHERE id = $1 AND school_id = $2`,
      [id, schoolId]
    );

    if (existingRes.rows.length === 0) {
      throw new NotFoundError(`Student not found with ID: ${id}`);
    }

    const existing = existingRes.rows[0];

    // 2. If sectionId is provided, verify it belongs to this school
    if (data.sectionId) {
      const secRes = await db.query(
        `SELECT id FROM sections WHERE id = $1 AND school_id = $2`,
        [data.sectionId, schoolId]
      );
      if (secRes.rows.length === 0) {
        throw new BusinessRuleException(
          `Section '${data.sectionId}' does not belong to your school`,
          400
        );
      }
    }

    return await db.transaction(async (client) => {
      // 3. Build dynamic student update query
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(data.name);
      }
      if (data.email !== undefined) {
        updates.push(`email = $${idx++}`);
        values.push(data.email);
      }
      if (data.phone !== undefined) {
        updates.push(`phone = $${idx++}`);
        values.push(data.phone);
      }
      if (data.dob !== undefined) {
        updates.push(`dob = $${idx++}`);
        values.push(data.dob ? new Date(data.dob) : null);
      }
      if (data.address !== undefined) {
        updates.push(`address = $${idx++}`);
        values.push(data.address);
      }
      if (data.aadharNo !== undefined) {
        updates.push(`aadhar_no = $${idx++}`);
        values.push(data.aadharNo);
      }
      if (data.bloodGroup !== undefined) {
        updates.push(`blood_group = $${idx++}`);
        values.push(data.bloodGroup);
      }
      if (data.dateOfAdmission !== undefined) {
        updates.push(`date_of_admission = $${idx++}`);
        values.push(data.dateOfAdmission ? new Date(data.dateOfAdmission) : null);
      }
      if (data.previousSchool !== undefined) {
        updates.push(`previous_school = $${idx++}`);
        values.push(data.previousSchool);
      }

      if (updates.length > 0) {
        values.push(id, schoolId);
        const updateSql = `
          UPDATE students
          SET ${updates.join(', ')}
          WHERE id = $${idx++} AND school_id = $${idx++}
        `;
        await client.query(updateSql, values);
      }

      // 4. Update active enrollment if sectionId or rollNo provided
      if (data.sectionId !== undefined || data.rollNo !== undefined) {
        const enrRes = await client.query(
          `SELECT id, section_id, roll_no FROM enrollments WHERE student_id = $1 AND status = 'ACTIVE' LIMIT 1`,
          [id]
        );

        if (enrRes.rows.length > 0) {
          const currentEnr = enrRes.rows[0];
          const newSectionId = data.sectionId !== undefined ? data.sectionId : currentEnr.section_id;
          const newRollNo = data.rollNo !== undefined ? data.rollNo : currentEnr.roll_no;

          await client.query(
            `UPDATE enrollments SET section_id = $1, roll_no = $2 WHERE id = $3`,
            [newSectionId, newRollNo, currentEnr.id]
          );
        } else if (data.sectionId) {
          // If no active enrollment exists, create one
          await client.query(
            `INSERT INTO enrollments (id, student_id, section_id, roll_no, status)
             VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE')`,
            [id, data.sectionId, data.rollNo || null]
          );
        }
      }

      // 5. Update Guardian / Parent Account if provided
      const hasParentUpdate =
        data.parentName !== undefined ||
        data.parentMsisdn !== undefined ||
        data.parentEmail !== undefined ||
        data.relation !== undefined ||
        data.guardianOccupation !== undefined ||
        data.guardianAddress !== undefined;

      if (hasParentUpdate) {
        const grdRes = await client.query(
          `SELECT g.id as "guardianId", g.parent_account_id as "parentAccountId"
           FROM guardians g
           WHERE g.student_id = $1 AND g.is_primary = true
           LIMIT 1`,
          [id]
        );

        if (grdRes.rows.length > 0) {
          const { guardianId, parentAccountId } = grdRes.rows[0];

          // Update parent_accounts
          const paUpdates: string[] = [];
          const paValues: any[] = [];
          let paIdx = 1;

          if (data.parentName !== undefined) {
            paUpdates.push(`name = $${paIdx++}`);
            paValues.push(data.parentName);
          }
          if (data.parentMsisdn !== undefined) {
            paUpdates.push(`msisdn = $${paIdx++}`);
            paValues.push(data.parentMsisdn);
          }
          if (data.parentEmail !== undefined) {
            paUpdates.push(`email = $${paIdx++}`);
            paValues.push(data.parentEmail);
          }

          if (paUpdates.length > 0) {
            paValues.push(parentAccountId, schoolId);
            await client.query(
              `UPDATE parent_accounts SET ${paUpdates.join(', ')} WHERE id = $${paIdx++} AND school_id = $${paIdx++}`,
              paValues
            );
          }

          // Update guardians
          const gUpdates: string[] = [];
          const gValues: any[] = [];
          let gIdx = 1;

          if (data.relation !== undefined) {
            gUpdates.push(`relation = $${gIdx++}`);
            gValues.push(data.relation);
          }
          if (data.guardianOccupation !== undefined) {
            gUpdates.push(`occupation = $${gIdx++}`);
            gValues.push(data.guardianOccupation);
          }
          if (data.guardianAddress !== undefined) {
            gUpdates.push(`address = $${gIdx++}`);
            gValues.push(data.guardianAddress);
          }

          if (gUpdates.length > 0) {
            gValues.push(guardianId);
            await client.query(
              `UPDATE guardians SET ${gUpdates.join(', ')} WHERE id = $${gIdx++}`,
              gValues
            );
          }
        } else if (data.parentMsisdn && data.parentName) {
          // Create new parent account & guardian link if none existed
          let paRes = await client.query(
            `SELECT id FROM parent_accounts WHERE school_id = $1 AND msisdn = $2`,
            [schoolId, data.parentMsisdn]
          );
          let parentId = paRes.rows[0]?.id;

          if (!parentId) {
            const newPa = await client.query(
              `INSERT INTO parent_accounts (id, school_id, name, msisdn, email)
               VALUES (gen_random_uuid(), $1, $2, $3, $4)
               RETURNING id`,
              [schoolId, data.parentName, data.parentMsisdn, data.parentEmail || null]
            );
            parentId = newPa.rows[0].id;
          }

          await client.query(
            `INSERT INTO guardians (id, parent_account_id, student_id, relation, occupation, address, is_primary)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true)`,
            [
              parentId,
              id,
              data.relation || 'PARENT',
              data.guardianOccupation || null,
              data.guardianAddress || null,
            ]
          );
        }
      }

      // 6. Invalidate dashboard summary cache
      DashboardCache.invalidate(schoolId, 'summary');

      // 7. Return refreshed student record
      const refreshedRes = await client.query(
        `SELECT
          s.id,
          s.student_code as "studentCode",
          s.name,
          s.email,
          s.phone,
          TO_CHAR(s.dob, 'YYYY-MM-DD') as dob,
          s.address,
          s.aadhar_no as "aadharNo",
          s.blood_group as "bloodGroup",
          TO_CHAR(s.date_of_admission, 'YYYY-MM-DD') as "dateOfAdmission",
          s.previous_school as "previousSchool",
          e.id as "enrollmentId",
          e.section_id as "sectionId",
          sec.name as "sectionName",
          g.name as "gradeName",
          e.roll_no as "rollNo",
          e.status as "enrollmentStatus",
          pa.id as "parentAccountId",
          pa.name as "parentName",
          pa.msisdn as "parentMsisdn",
          pa.email as "parentEmail",
          grd.relation as "relation",
          grd.occupation as "guardianOccupation",
          grd.address as "guardianAddress"
        FROM students s
        LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'ACTIVE'
        LEFT JOIN sections sec ON e.section_id = sec.id
        LEFT JOIN grades g ON sec.grade_id = g.id
        LEFT JOIN guardians grd ON s.id = grd.student_id AND grd.is_primary = true
        LEFT JOIN parent_accounts pa ON grd.parent_account_id = pa.id
        WHERE s.id = $1 AND s.school_id = $2`,
        [id, schoolId]
      );

      return refreshedRes.rows[0];
    });
  }
}

