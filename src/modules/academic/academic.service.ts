import db from '../../config/database';
import { BusinessRuleException, NotFoundError } from '../../utils/response';

export class AcademicService {
  // --- Academic Years ---

  static async getAcademicYears(schoolId: string) {
    const res = await db.query(
      `SELECT * FROM academic_years WHERE school_id = $1 ORDER BY start_date DESC`,
      [schoolId]
    );
    return res.rows;
  }

  static async getActiveAcademicYear(schoolId: string) {
    const res = await db.query(
      `SELECT * FROM academic_years WHERE school_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [schoolId]
    );
    const activeYear = res.rows[0];
    if (!activeYear) {
      throw new NotFoundError('No active academic year found for school');
    }
    return activeYear;
  }

  static async getAcademicYearById(schoolId: string, id: string) {
    const res = await db.query(
      `SELECT * FROM academic_years WHERE id = $1 AND school_id = $2 LIMIT 1`,
      [id, schoolId]
    );
    const year = res.rows[0];
    if (!year) throw new NotFoundError(`Academic year not found: ${id}`);
    return year;
  }

  static async createAcademicYear(schoolId: string, data: { name: string; startDate: Date; endDate: Date; status?: string }) {
    const status = data.status || 'ACTIVE';
    return db.transaction(async (client) => {
      if (status === 'ACTIVE') {
        await client.query(
          `UPDATE academic_years SET status = 'COMPLETED' WHERE school_id = $1 AND status = 'ACTIVE'`,
          [schoolId]
        );
      }

      const res = await client.query(
        `INSERT INTO academic_years (id, school_id, name, start_date, end_date, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         RETURNING *`,
        [schoolId, data.name, data.startDate, data.endDate, status]
      );
      return res.rows[0];
    });
  }

  static async updateAcademicYear(schoolId: string, id: string, data: { name?: string; startDate?: Date; endDate?: Date; status?: string }) {
    const existing = await this.getAcademicYearById(schoolId, id);
    if (data.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      await db.query(
        `UPDATE academic_years SET status = 'COMPLETED' WHERE school_id = $1 AND status = 'ACTIVE'`,
        [schoolId]
      );
    }

    const name = data.name !== undefined ? data.name : existing.name;
    const startDate = data.startDate !== undefined ? data.startDate : existing.start_date;
    const endDate = data.endDate !== undefined ? data.endDate : existing.end_date;
    const status = data.status !== undefined ? data.status : existing.status;

    const res = await db.query(
      `UPDATE academic_years
       SET name = $1, start_date = $2, end_date = $3, status = $4
       WHERE id = $5 AND school_id = $6
       RETURNING *`,
      [name, startDate, endDate, status, id, schoolId]
    );
    return res.rows[0];
  }

  static async activateAcademicYear(schoolId: string, id: string) {
    return this.updateAcademicYear(schoolId, id, { status: 'ACTIVE' });
  }

  static async closeAcademicYear(schoolId: string, id: string) {
    return this.updateAcademicYear(schoolId, id, { status: 'COMPLETED' });
  }

  // --- Grades / Classes ---

  static async getGrades(schoolId: string) {
    const res = await db.query(
      `SELECT * FROM grades WHERE school_id = $1 ORDER BY sequence_order ASC`,
      [schoolId]
    );
    return res.rows;
  }

  static async createGrade(schoolId: string, name: string, sequenceOrder: number) {
    const existingRes = await db.query(
      `SELECT id FROM grades WHERE school_id = $1 AND name = $2`,
      [schoolId, name]
    );
    if (existingRes.rows.length > 0) throw new BusinessRuleException(`Grade '${name}' already exists`);

    const res = await db.query(
      `INSERT INTO grades (id, school_id, name, sequence_order)
       VALUES (gen_random_uuid(), $1, $2, $3)
       RETURNING *`,
      [schoolId, name, sequenceOrder]
    );
    return res.rows[0];
  }

  static async updateGrade(schoolId: string, id: string, name: string, sequenceOrder: number) {
    const res = await db.query(
      `UPDATE grades SET name = $1, sequence_order = $2 WHERE id = $3 AND school_id = $4 RETURNING *`,
      [name, sequenceOrder, id, schoolId]
    );
    return res.rows[0];
  }

  // --- Departments ---

  static async getDepartments(schoolId: string, academicYearId?: string) {
    const res = await db.query(
      `SELECT d.id, d.name, d.code, d.hod_teacher_id as "hodTeacherId",
              COUNT(tdm.teacher_id)::int as "facultyCount"
       FROM departments d
       LEFT JOIN teacher_department_maps tdm ON d.id = tdm.department_id
         AND ($2::uuid IS NULL OR tdm.academic_year_id = $2::uuid)
       WHERE d.school_id = $1
       GROUP BY d.id`,
      [schoolId, academicYearId || null]
    );
    return res.rows;
  }

  static async createDepartment(schoolId: string, name: string, code: string, hodTeacherId?: string) {
    const res = await db.query(
      `INSERT INTO departments (id, school_id, name, code, hod_teacher_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [schoolId, name, code, hodTeacherId || null]
    );
    return res.rows[0];
  }

  static async updateDepartment(schoolId: string, id: string, name?: string, code?: string, hodTeacherId?: string) {
    const deptRes = await db.query(`SELECT * FROM departments WHERE id = $1 AND school_id = $2`, [id, schoolId]);
    const existing = deptRes.rows[0];
    if (!existing) throw new NotFoundError(`Department not found: ${id}`);

    const newName = name !== undefined ? name : existing.name;
    const newCode = code !== undefined ? code : existing.code;
    const newHod = hodTeacherId !== undefined ? hodTeacherId : existing.hod_teacher_id;

    const res = await db.query(
      `UPDATE departments SET name = $1, code = $2, hod_teacher_id = $3 WHERE id = $4 RETURNING *`,
      [newName, newCode, newHod, id]
    );
    return res.rows[0];
  }

  static async deleteDepartment(schoolId: string, id: string) {
    const res = await db.query(`DELETE FROM departments WHERE id = $1 AND school_id = $2 RETURNING *`, [id, schoolId]);
    return res.rows[0];
  }

  static async assignFacultyToDepartment(departmentId: string, academicYearId: string, teacherIds: string[]) {
    await db.query(
      `DELETE FROM teacher_department_maps WHERE department_id = $1 AND academic_year_id = $2`,
      [departmentId, academicYearId]
    );

    for (const teacherId of teacherIds) {
      await db.query(
        `INSERT INTO teacher_department_maps (id, department_id, academic_year_id, teacher_id)
         VALUES (gen_random_uuid(), $1, $2, $3)
         ON CONFLICT (teacher_id, department_id, academic_year_id) DO NOTHING`,
        [departmentId, academicYearId, teacherId]
      );
    }

    return { departmentId, academicYearId, assignedCount: teacherIds.length };
  }

  // --- Sections ---

  static async getSections(schoolId: string, academicYearId?: string) {
    const res = await db.query(
      `SELECT s.*,
              row_to_json(g.*) as grade,
              row_to_json(ay.*) as "academicYear",
              row_to_json(t.*) as "classTeacher"
       FROM sections s
       JOIN grades g ON s.grade_id = g.id
       JOIN academic_years ay ON s.academic_year_id = ay.id
       LEFT JOIN teachers t ON s.class_teacher_id = t.id
       WHERE s.school_id = $1 AND ($2::uuid IS NULL OR s.academic_year_id = $2::uuid)`,
      [schoolId, academicYearId || null]
    );
    return res.rows;
  }

  static async createSection(schoolId: string, gradeId: string, academicYearId: string, name: string, capacity?: number, classTeacherId?: string) {
    const res = await db.query(
      `INSERT INTO sections (id, school_id, grade_id, academic_year_id, name, capacity, class_teacher_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [schoolId, gradeId, academicYearId, name, capacity || 40, classTeacherId || null]
    );
    return res.rows[0];
  }

  static async updateSection(schoolId: string, id: string, name?: string, capacity?: number, classTeacherId?: string) {
    const secRes = await db.query(`SELECT * FROM sections WHERE id = $1 AND school_id = $2`, [id, schoolId]);
    const existing = secRes.rows[0];
    if (!existing) throw new NotFoundError(`Section not found: ${id}`);

    const newName = name !== undefined ? name : existing.name;
    const newCapacity = capacity !== undefined ? capacity : existing.capacity;
    const newClassTeacher = classTeacherId !== undefined ? classTeacherId : existing.class_teacher_id;

    const res = await db.query(
      `UPDATE sections SET name = $1, capacity = $2, class_teacher_id = $3 WHERE id = $4 RETURNING *`,
      [newName, newCapacity, newClassTeacher, id]
    );
    return res.rows[0];
  }

  static async setClassTeacher(schoolId: string, sectionId: string, teacherId: string) {
    const res = await db.query(
      `UPDATE sections SET class_teacher_id = $1 WHERE id = $2 AND school_id = $3 RETURNING *`,
      [teacherId, sectionId, schoolId]
    );
    return res.rows[0];
  }

  // --- Subjects & Subject Types ---

  static async getSubjectTypes(schoolId: string) {
    const res = await db.query(`SELECT * FROM subject_types WHERE school_id = $1`, [schoolId]);
    return res.rows;
  }

  static async createSubjectType(schoolId: string, name: string, code: string, description?: string) {
    const res = await db.query(
      `INSERT INTO subject_types (id, school_id, name, code, description)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [schoolId, name, code, description || null]
    );
    return res.rows[0];
  }

  static async updateSubjectType(schoolId: string, id: string, name?: string, code?: string, description?: string) {
    const stRes = await db.query(`SELECT * FROM subject_types WHERE id = $1 AND school_id = $2`, [id, schoolId]);
    const existing = stRes.rows[0];
    if (!existing) throw new NotFoundError(`SubjectType not found: ${id}`);

    const newName = name !== undefined ? name : existing.name;
    const newCode = code !== undefined ? code : existing.code;
    const newDesc = description !== undefined ? description : existing.description;

    const res = await db.query(
      `UPDATE subject_types SET name = $1, code = $2, description = $3 WHERE id = $4 RETURNING *`,
      [newName, newCode, newDesc, id]
    );
    return res.rows[0];
  }

  static async deleteSubjectType(schoolId: string, id: string) {
    const res = await db.query(`DELETE FROM subject_types WHERE id = $1 AND school_id = $2 RETURNING *`, [id, schoolId]);
    return res.rows[0];
  }

  static async getSubjects(schoolId: string) {
    const res = await db.query(
      `SELECT s.*, row_to_json(st.*) as "subjectType"
       FROM subjects s
       JOIN subject_types st ON s.subject_type_id = st.id
       WHERE s.school_id = $1`,
      [schoolId]
    );
    return res.rows;
  }

  static async createSubject(schoolId: string, name: string, code: string, subjectTypeId: string) {
    const res = await db.query(
      `INSERT INTO subjects (id, school_id, name, code, subject_type_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [schoolId, name, code, subjectTypeId]
    );
    return res.rows[0];
  }

  static async getSectionSubjects(sectionId: string) {
    const res = await db.query(
      `SELECT s.*, row_to_json(st.*) as "subjectType"
       FROM section_subject_maps ssm
       JOIN subjects s ON ssm.subject_id = s.id
       JOIN subject_types st ON s.subject_type_id = st.id
       WHERE ssm.section_id = $1`,
      [sectionId]
    );
    return res.rows;
  }

  static async mapSubjectsToSection(sectionId: string, subjectIds: string[]) {
    await db.query(`DELETE FROM section_subject_maps WHERE section_id = $1`, [sectionId]);

    for (const subjectId of subjectIds) {
      await db.query(
        `INSERT INTO section_subject_maps (id, section_id, subject_id)
         VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT (section_id, subject_id) DO NOTHING`,
        [sectionId, subjectId]
      );
    }
    return subjectIds;
  }

  static async assignSubjectTeacher(sectionId: string, subjectId: string, teacherId: string) {
    const res = await db.query(
      `INSERT INTO section_subject_teachers (id, section_id, subject_id, teacher_id)
       VALUES (gen_random_uuid(), $1, $2, $3)
       ON CONFLICT (section_id, subject_id, teacher_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
       RETURNING *`,
      [sectionId, subjectId, teacherId]
    );
    return res.rows[0];
  }

  // --- Academic Rollover ---

  static async rolloverAcademicYear(schoolId: string, fromAcademicYearId: string, toAcademicYearId: string) {
    const fromSectionsRes = await db.query(
      `SELECT s.*, array_agg(ssm.subject_id) FILTER (WHERE ssm.subject_id IS NOT NULL) as subject_ids
       FROM sections s
       LEFT JOIN section_subject_maps ssm ON s.id = ssm.section_id
       WHERE s.school_id = $1 AND s.academic_year_id = $2
       GROUP BY s.id`,
      [schoolId, fromAcademicYearId]
    );

    let clonedSectionsCount = 0;
    let clonedSubjectsCount = 0;

    for (const section of fromSectionsRes.rows) {
      const newSecRes = await db.query(
        `INSERT INTO sections (id, school_id, grade_id, academic_year_id, name, capacity)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         RETURNING id`,
        [schoolId, section.grade_id, toAcademicYearId, section.name, section.capacity]
      );
      const newSectionId = newSecRes.rows[0].id;
      clonedSectionsCount++;

      const subjectIds: string[] = section.subject_ids || [];
      if (subjectIds.length > 0) {
        for (const subjectId of subjectIds) {
          await db.query(
            `INSERT INTO section_subject_maps (id, section_id, subject_id)
             VALUES (gen_random_uuid(), $1, $2)
             ON CONFLICT (section_id, subject_id) DO NOTHING`,
            [newSectionId, subjectId]
          );
          clonedSubjectsCount++;
        }
      }
    }

    return {
      fromAcademicYearId,
      toAcademicYearId,
      clonedSectionsCount,
      clonedSubjectsCount,
    };
  }
}
