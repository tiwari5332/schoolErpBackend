import db from '../../config/database';

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
      `SELECT * FROM teachers
       WHERE school_id = $1
       ORDER BY name ASC`,
      [schoolId]
    );
    return res.rows;
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
