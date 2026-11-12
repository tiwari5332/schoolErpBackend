import assert from 'assert';
import http from 'http';
import app from '../src/app';
import { AuthService } from '../src/modules/auth/auth.service';
import { AcademicService } from '../src/modules/academic/academic.service';
import { OnboardingService } from '../src/modules/onboarding/onboarding.service';
import { initDatabaseSchema } from '../src/config/initDb';

async function runUpdateStaffStudentTests() {
  console.log('🚀 Starting Staff & Student Update APIs Integration Tests...');

  // Initialize DB schema
  await initDatabaseSchema();

  // Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✅ Test server running on ${baseUrl}`);

  try {
    // 1. Authenticate Admin
    const adminLogin = await AuthService.adminLogin('8920147799', 'Shubh321@');
    const adminToken = adminLogin.token;
    const schoolId = adminLogin.schoolId!;
    console.log(`✅ Admin authenticated. School ID: ${schoolId}`);

    // Ensure an active academic year and grade/section exist for testing
    let activeYear;
    try {
      activeYear = await AcademicService.getActiveAcademicYear(schoolId);
    } catch {
      activeYear = await AcademicService.createAcademicYear(schoolId, {
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      });
    }

    let grades = await AcademicService.getGrades(schoolId);
    let gradeId: string;
    if (grades.length === 0) {
      const g = await AcademicService.createGrade(schoolId, 'Grade 10', 10);
      gradeId = g.id;
    } else {
      gradeId = grades[0].id;
    }

    let sections = await AcademicService.getSections(schoolId, activeYear.id);
    let sectionId: string;
    if (sections.length === 0) {
      const s = await AcademicService.createSection(schoolId, gradeId, activeYear.id, 'Section A', 45);
      sectionId = s.id;
    } else {
      sectionId = sections[0].id;
    }

    let passed = 0;
    let total = 0;

    async function test(name: string, fn: () => Promise<void>) {
      total++;
      try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ❌ [FAIL] ${name}:`, err.message);
        throw err;
      }
    }

    // --- Part 1: Staff / Teacher Update Tests ---
    console.log('\n--- Part 1: Staff / Teacher Update API Tests ---');
    const uniqueEmpCode = `EMP-TEST-${Date.now().toString().slice(-4)}`;
    const initialMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    let teacherId: string = '';
    await test('Setup: Create a teacher for update testing', async () => {
      const t = await OnboardingService.onboardTeacher(schoolId, {
        employeeCode: uniqueEmpCode,
        name: 'Anita Sharma',
        email: `anita.${Date.now()}@schoolerp.com`,
        loginMsisdn: initialMobile,
        dateOfBirth: '1988-06-15',
        gender: 'FEMALE',
        address: '123 Faculty Colony, Delhi',
        designation: 'Assistant Teacher',
      });
      // Retrieve teacher by employee code
      const listRes = await fetch(`${baseUrl}/api/teachers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const listBody = await listRes.json();
      const created = listBody.result.find((row: any) => row.name === 'Anita Sharma');
      assert(created, 'Teacher must exist');
      teacherId = created.id;
    });

    await test('GET /api/teachers/:id returns single teacher details', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.id, teacherId);
      assert.strictEqual(body.result.name, 'Anita Sharma');
    });

    await test('PUT /api/teachers/:id updates teacher name, designation, address and status', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Dr. Anita Sharma',
          designation: 'Senior Faculty - Mathematics',
          address: '456 Professors Enclave, New Delhi',
          gender: 'FEMALE',
          status: 'ACTIVE',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.name, 'Dr. Anita Sharma');
      assert.strictEqual(body.result.designation, 'Senior Faculty - Mathematics');
      assert.strictEqual(body.result.address, '456 Professors Enclave, New Delhi');
    });

    await test('PATCH /api/teachers/:id partially updates teacher mobile number', async () => {
      const newMobile = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
      const res = await fetch(`${baseUrl}/api/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginMsisdn: newMobile,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.result.login_msisdn, newMobile);
    });

    await test('PUT /api/teachers/:id with non-existent UUID returns 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000999';
      const res = await fetch(`${baseUrl}/api/teachers/${fakeId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Ghost Teacher' }),
      });

      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.code, 'NOT_FOUND');
    });

    // --- Part 2: Student Update Tests ---
    console.log('\n--- Part 2: Student Update API Tests ---');
    const studentCode = `STU-TEST-${Date.now().toString().slice(-4)}`;
    let studentId: string = '';

    await test('Setup: Create a student for update testing', async () => {
      const parentMsisdn = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
      const s = await OnboardingService.onboardStudent(schoolId, {
        studentCode,
        name: 'Rohan Gupta',
        email: `rohan.${Date.now()}@student.com`,
        phone: '9876500001',
        dob: '2010-08-20',
        sectionId,
        rollNo: 15,
        parentName: 'Sanjay Gupta',
        parentMsisdn,
        parentEmail: 'sanjay.gupta@parent.com',
        relation: 'FATHER',
      });
      studentId = s.student.id;
      assert(studentId, 'Student must be created');
    });

    await test('GET /api/students/:id returns single student with enrollment and guardian details', async () => {
      const res = await fetch(`${baseUrl}/api/students/${studentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.id, studentId);
      assert.strictEqual(body.result.name, 'Rohan Gupta');
      assert.strictEqual(body.result.parentName, 'Sanjay Gupta');
      assert.strictEqual(body.result.rollNo, 15);
    });

    await test('PUT /api/students/:id updates student personal details', async () => {
      const res = await fetch(`${baseUrl}/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Rohan S. Gupta',
          address: 'Flat 302, Green Valley Apts, Delhi',
          bloodGroup: 'B+',
          previousSchool: 'St. Mary School',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.name, 'Rohan S. Gupta');
      assert.strictEqual(body.result.bloodGroup, 'B+');
      assert.strictEqual(body.result.previousSchool, 'St. Mary School');
      assert.strictEqual(body.result.address, 'Flat 302, Green Valley Apts, Delhi');
    });

    await test('PUT /api/students/:id updates student roll number and parent info', async () => {
      const res = await fetch(`${baseUrl}/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rollNo: 21,
          parentName: 'Sanjay Kumar Gupta',
          parentEmail: 'sanjay.updated@parent.com',
          guardianOccupation: 'Software Architect',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.rollNo, 21);
      assert.strictEqual(body.result.parentName, 'Sanjay Kumar Gupta');
      assert.strictEqual(body.result.parentEmail, 'sanjay.updated@parent.com');
      assert.strictEqual(body.result.guardianOccupation, 'Software Architect');
    });

    await test('GET /api/students lists students with search filter', async () => {
      const res = await fetch(`${baseUrl}/api/students?search=Rohan`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result.items));
      assert(body.result.items.some((st: any) => st.id === studentId));
    });

    await test('PUT /api/students/:id with non-existent UUID returns 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000999';
      const res = await fetch(`${baseUrl}/api/students/${fakeId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Ghost Student' }),
      });

      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.code, 'NOT_FOUND');
    });

    console.log(`\n🎉 All ${passed}/${total} Staff & Student Update Tests Passed Successfully!`);
  } finally {
    server.close();
  }
}

runUpdateStaffStudentTests()
  .then(() => {
    console.log('\n✅ Staff and Student update test execution complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Update test failed:', err);
    process.exit(1);
  });
