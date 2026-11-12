import db from '../../config/database';
import { UpdateTeacherDTO } from './teacher.dto';
import { BusinessRuleException, NotFoundError } from '../../utils/response';
import { DashboardCache } from '../../libs/cache';

export class TeacherService {
  static async getTeachers(schoolId: string, sectionId?: string) {
    if (sectionId) {
      const res = await db.query(
        `SELECT DISTINCT t.*
         FROM section_subject_teachers sst
         JOIN teachers t ON sst.teacher_id = t.id
         WHERE sst.section_id = $1
         ORDER BY t.name ASC`,
        [sectionId]
      );
      return res.rows;
    }

    const res = await db.query(
      `SELECT t.*, d.id as "departmentId", d.name as "departmentName"
       FROM teachers t
       LEFT JOIN teacher_department_maps tdm ON t.id = tdm.teacher_id
       LEFT JOIN departments d ON tdm.department_id = d.id
       WHERE t.school_id = $1
       ORDER BY t.name ASC`,
      [schoolId]
    );
    return res.rows;
  }

  static async getTeacherById(schoolId: string, id: string) {
    const res = await db.query(
      `SELECT t.*, d.id as "departmentId", d.name as "departmentName"
       FROM teachers t
       LEFT JOIN teacher_department_maps tdm ON t.id = tdm.teacher_id
       LEFT JOIN departments d ON tdm.department_id = d.id
       WHERE t.id = $1 AND t.school_id = $2`,
      [id, schoolId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Teacher not found with ID: ${id}`);
    }

    return res.rows[0];
  }

  static async updateTeacher(schoolId: string, id: string, data: UpdateTeacherDTO) {
    // 1. Verify existence
    const existingRes = await db.query(
      `SELECT * FROM teachers WHERE id = $1 AND school_id = $2`,
      [id, schoolId]
    );

    if (existingRes.rows.length === 0) {
      throw new NotFoundError(`Teacher not found with ID: ${id}`);
    }

    const existing = existingRes.rows[0];

    // 2. Uniqueness check for loginMsisdn if updated
    if (data.loginMsisdn && data.loginMsisdn !== existing.login_msisdn) {
      const duplicateRes = await db.query(
        `SELECT id FROM teachers WHERE school_id = $1 AND login_msisdn = $2 AND id != $3`,
        [schoolId, data.loginMsisdn, id]
      );
      if (duplicateRes.rows.length > 0) {
        throw new BusinessRuleException(
          `A teacher with mobile number '${data.loginMsisdn}' already exists in this school`,
          409
        );
      }
    }

    return await db.transaction(async (client) => {
      // 3. Build dynamic update query
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
      if (data.loginMsisdn !== undefined) {
        updates.push(`login_msisdn = $${idx++}`);
        values.push(data.loginMsisdn);
      }
      if (data.msisdns !== undefined) {
        updates.push(`msisdns = $${idx++}`);
        values.push(data.msisdns);
      }
      if (data.dob !== undefined) {
        updates.push(`dob = $${idx++}`);
        values.push(data.dob ? new Date(data.dob) : null);
      }
      if (data.gender !== undefined) {
        updates.push(`gender = $${idx++}`);
        values.push(data.gender);
      }
      if (data.address !== undefined) {
        updates.push(`address = $${idx++}`);
        values.push(data.address);
      }
      if (data.aadharNo !== undefined) {
        updates.push(`aadhar_no = $${idx++}`);
        values.push(data.aadharNo);
      }
      if (data.panNo !== undefined) {
        updates.push(`pan_no = $${idx++}`);
        values.push(data.panNo);
      }
      if (data.bankDetails !== undefined) {
        updates.push(`bank_details = $${idx++}`);
        values.push(data.bankDetails);
      }
      if (data.designation !== undefined) {
        updates.push(`designation = $${idx++}`);
        values.push(data.designation);
      }
      if (data.dateOfJoining !== undefined) {
        updates.push(`date_of_joining = $${idx++}`);
        values.push(data.dateOfJoining ? new Date(data.dateOfJoining) : null);
      }
      if (data.avatarUrl !== undefined) {
        updates.push(`avatar_url = $${idx++}`);
        values.push(data.avatarUrl);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${idx++}`);
        values.push(data.status);
      }

      let updatedTeacher = existing;
      if (updates.length > 0) {
        values.push(id, schoolId);
        const updateSql = `
          UPDATE teachers
          SET ${updates.join(', ')}
          WHERE id = $${idx++} AND school_id = $${idx++}
          RETURNING *
        `;
        const updateRes = await client.query(updateSql, values);
        updatedTeacher = updateRes.rows[0];
      }

      // 4. Update department mapping if provided
      if (data.departmentId !== undefined) {
        await client.query(`DELETE FROM teacher_department_maps WHERE teacher_id = $1`, [id]);
        if (data.departmentId) {
          // Resolve current session / academic year
          const yearRes = await client.query(
            `SELECT id FROM academic_sessions WHERE school_id = $1 AND is_current = true LIMIT 1`,
            [schoolId]
          );
          const academicYearId = yearRes.rows[0]?.id;
          if (academicYearId) {
            await client.query(
              `INSERT INTO teacher_department_maps (id, teacher_id, department_id, academic_year_id)
               VALUES (gen_random_uuid(), $1, $2, $3)
               ON CONFLICT (teacher_id, department_id, academic_year_id) DO NOTHING`,
              [id, data.departmentId, academicYearId]
            );
          }
        }
      }

      // 5. Invalidate dashboard cache
      DashboardCache.invalidate(schoolId, 'staff-attendance');
      DashboardCache.invalidate(schoolId, 'summary');

      return updatedTeacher;
    });
  }

  static async getSectionTeachers(sectionId: string) {
    const secRes = await db.query(
      `SELECT s.id as section_id, t.id as class_teacher_id, t.name as class_teacher_name
       FROM sections s
       LEFT JOIN teachers t ON s.class_teacher_id = t.id
       WHERE s.id = $1`,
      [sectionId]
    );

    const section = secRes.rows[0];

    const stRes = await db.query(
      `SELECT sst.teacher_id, t.name as teacher_name, sst.subject_id, sub.name as subject_name
       FROM section_subject_teachers sst
       JOIN teachers t ON sst.teacher_id = t.id
       JOIN subjects sub ON sst.subject_id = sub.id
       WHERE sst.section_id = $1`,
      [sectionId]
    );

    return {
      sectionId,
      classTeacher: section?.class_teacher_id
        ? { id: section.class_teacher_id, name: section.class_teacher_name }
        : null,
      subjectTeachers: stRes.rows.map((st) => ({
        teacherId: st.teacher_id,
        teacherName: st.teacher_name,
        subjectId: st.subject_id,
        subjectName: st.subject_name,
      })),
    };
  }
}
