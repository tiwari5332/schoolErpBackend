import db, { pool } from '../src/config/database';
import { AuthService } from '../src/modules/auth/auth.service';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import { CommunicationService } from '../src/modules/communication/communication.service';
import { AcademicService } from '../src/modules/academic/academic.service';
import { initDatabaseSchema } from '../src/config/initDb';

async function main() {
  console.log('🚀 Starting End-to-End Features Verification against Neon PostgreSQL...');

  // 1. Initialize schema & seed verification
  console.log('\n--- Step 1: Initialize Database Schema & Templates ---');
  await initDatabaseSchema();
  console.log('✅ DB Schema & Templates initialized.');

  // 2. Admin Login
  console.log('\n--- Step 2: Test Admin Login ---');
  const loginRes = await AuthService.adminLogin('8920147799', 'Shubh321@');
  console.log(`✅ Admin logged in successfully!`);
  console.log(`   Admin ID:  ${loginRes.actorId}`);
  console.log(`   School ID: ${loginRes.schoolId}`);
  const schoolId = loginRes.schoolId!;

  // 3. Academic Year & Structure
  console.log('\n--- Step 3: Verify / Setup Academic Session & Section ---');
  let activeYear;
  try {
    activeYear = await AcademicService.getActiveAcademicYear(schoolId);
    console.log(`✅ Found active academic year: ${activeYear.name} (${activeYear.id})`);
  } catch {
    activeYear = await AcademicService.createAcademicYear(schoolId, {
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
    });
    console.log(`✅ Created active academic year: ${activeYear.name} (${activeYear.id})`);
  }

  // Verify/create Grade
  let grades = await AcademicService.getGrades(schoolId);
  let gradeId: string;
  if (grades.length === 0) {
    const newGrade = await AcademicService.createGrade(schoolId, 'Grade 10', 10);
    gradeId = newGrade.id;
    console.log(`✅ Created grade: Grade 10 (${gradeId})`);
  } else {
    gradeId = grades[0].id;
    console.log(`✅ Using existing grade: ${grades[0].name} (${gradeId})`);
  }

  // Verify/create Section
  let sections = await AcademicService.getSections(schoolId, activeYear.id);
  let sectionId: string;
  if (sections.length === 0) {
    const newSec = await AcademicService.createSection(schoolId, gradeId, activeYear.id, 'Section A', 40);
    sectionId = newSec.id;
    console.log(`✅ Created section: Section A (${sectionId})`);
  } else {
    sectionId = sections[0].id;
    console.log(`✅ Using existing section: ${sections[0].name} (${sectionId})`);
  }

  // 4. Verify / Create Student & Parent
  console.log('\n--- Step 4: Verify Student & Guardian Enrollment ---');
  const stuRes = await db.query(
    `SELECT st.id, st.name FROM students st
     JOIN enrollments e ON st.id = e.student_id AND e.status = 'ACTIVE'
     WHERE st.school_id = $1 AND e.section_id = $2 LIMIT 1`,
    [schoolId, sectionId]
  );

  let studentId: string;
  if (stuRes.rows.length === 0) {
    const newStu = await db.transaction(async (client) => {
      const s = await client.query(
        `INSERT INTO students (id, school_id, student_code, name, email, phone)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         RETURNING *`,
        [schoolId, 'STU-VERIFY-001', 'Rohan Verma', 'rohan@test.com', '9876543211']
      );
      await client.query(
        `INSERT INTO enrollments (id, student_id, section_id, roll_no, status)
         VALUES (gen_random_uuid(), $1, $2, 1, 'ACTIVE')`,
        [s.rows[0].id, sectionId]
      );
      const pa = await client.query(
        `INSERT INTO parent_accounts (id, school_id, msisdn, name, email, password_set, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, false, 'ACTIVE')
         ON CONFLICT (school_id, msisdn) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [schoolId, '9876543210', 'Shubham Verma', 'parent@test.com']
      );
      await client.query(
        `INSERT INTO guardians (id, parent_account_id, student_id, relation, is_primary)
         VALUES (gen_random_uuid(), $1, $2, 'FATHER', true)
         ON CONFLICT (parent_account_id, student_id) DO NOTHING`,
        [pa.rows[0].id, s.rows[0].id]
      );
      return s.rows[0];
    });
    studentId = newStu.id;
    console.log(`✅ Onboarded test student: ${newStu.name} (${studentId})`);
  } else {
    studentId = stuRes.rows[0].id;
    console.log(`✅ Using student: ${stuRes.rows[0].name} (${studentId})`);
  }

  // 5. Test Attendance Engine
  console.log('\n--- Step 5: Test Attendance Engine (Homeroom + Parent Absentee Alert) ---');
  const today = new Date().toISOString().slice(0, 10);
  const attRes = await AttendanceService.recordDailyHomeroomAttendance(
    schoolId,
    null,
    sectionId,
    today,
    [{ studentId, status: 'ABSENT', remarks: 'E2E automated test absent verification' }]
  );
  console.log(`✅ Attendance recorded:`, attRes);

  const sectionAtt = await AttendanceService.getSectionAttendance(schoolId, sectionId, today);
  console.log(`✅ Section attendance fetched. Records count: ${sectionAtt.length}`);

  const summary = await AttendanceService.getStudentAttendanceSummary(schoolId, studentId);
  console.log(`✅ Student Attendance Summary:`, {
    totalDays: summary.cumulative.totalDays,
    absentDays: summary.cumulative.absentDays,
    attendancePercentage: `${summary.cumulative.attendancePercentage}%`,
    examEligible: summary.cumulative.examEligible,
  });

  // 6. Test Staff Attendance
  console.log('\n--- Step 6: Test Staff Attendance (Check-In & Check-Out) ---');
  // Find or create test teacher
  let teacherRes = await db.query(`SELECT id, name FROM teachers WHERE school_id = $1 LIMIT 1`, [schoolId]);
  let teacherId: string;
  if (teacherRes.rows.length === 0) {
    const newT = await db.query(
      `INSERT INTO teachers (id, school_id, employee_code, name, login_msisdn, status)
       VALUES (gen_random_uuid(), $1, 'EMP-TEST-001', 'Sunil Kumar', '8920147790', 'ACTIVE')
       RETURNING *`,
      [schoolId]
    );
    teacherId = newT.rows[0].id;
    console.log(`✅ Created test teacher: Sunil Kumar (${teacherId})`);
  } else {
    teacherId = teacherRes.rows[0].id;
    console.log(`✅ Using teacher: ${teacherRes.rows[0].name} (${teacherId})`);
  }

  const checkIn = await AttendanceService.recordStaffCheckIn(schoolId, teacherId, 'BIOMETRIC', 'Terminal A');
  console.log(`✅ Staff check-in recorded:`, {
    teacherId,
    checkInTime: checkIn.check_in_time,
    status: checkIn.status,
  });

  const checkOut = await AttendanceService.recordStaffCheckOut(schoolId, teacherId, 'BIOMETRIC', 'Terminal A checkout');
  console.log(`✅ Staff check-out recorded:`, {
    teacherId,
    checkOutTime: checkOut.check_out_time,
    hoursWorked: checkOut.hoursWorked,
    status: checkOut.status,
  });

  // 7. Test Communication Hub Broadcast
  console.log('\n--- Step 7: Test Communication Hub Broadcast ---');
  const broadcastRes = await CommunicationService.sendBroadcast({
    schoolId,
    actorType: 'ADMIN',
    channel: 'IN_APP',
    sectionIds: [sectionId],
    messageBody: 'E2E Automated Verification: School ERP platform operational test.',
  });
  console.log(`✅ Broadcast dispatched:`, {
    id: broadcastRes.broadcast.id,
    recipientCount: broadcastRes.recipientCount,
    status: broadcastRes.broadcast.status,
  });

  const history = await CommunicationService.getBroadCastList(schoolId);
  console.log(`✅ Broadcast list fetched. Total recorded broadcasts: ${history.length}`);

  console.log('\n=======================================================');
  console.log('🎉 ALL END-TO-END FEATURES VERIFIED SUCCESSFULLY ON NEON DB!');
  console.log('=======================================================');
}

main()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

