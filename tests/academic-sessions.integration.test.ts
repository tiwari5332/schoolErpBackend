import assert from 'assert';
import http from 'http';
import app from '../src/app';
import db from '../src/config/database';
import { initDatabaseSchema } from '../src/config/initDb';
import { JwtUtils } from '../src/utils/jwt';
import { ActorType, PlanCode } from '../src/config/constants';
import { AuthService } from '../src/modules/auth/auth.service';

async function runIntegrationTests() {
  console.log('🚀 Starting Academic Sessions Module — End-to-End Integration Tests...');

  // 1. Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✅ Test server running on ${baseUrl}`);

  try {
    // 3. Obtain Admin & Super Admin Tokens
    console.log('\n--- Step 2: Authenticate Admin & Super Admin ---');
    const adminLogin = await AuthService.adminLogin('8920147799', 'Shubh321@');
    const adminToken = adminLogin.token;
    const schoolId = adminLogin.schoolId!;
    const adminId = adminLogin.actorId;
    console.log(`✅ Admin authenticated. School ID: ${schoolId}`);

    // Generate Super Admin Token
    const superAdminToken = JwtUtils.generateLoginToken({
      actorId: '00000000-0000-0000-0000-000000000001',
      actorType: ActorType.SUPER_ADMIN,
      schoolId: null,
      planCode: PlanCode.ENTERPRISE,
      features: ['ACADEMIC_SETUP'],
    });
    console.log('✅ Super Admin token generated.');

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

    // --- Endpoint 1: GET /api/academic-sessions ---
    console.log('\n--- Step 3: Test Endpoint 1 — GET /api/academic-sessions ---');
    let etagHeader: string = '';
    await test('GET /api/academic-sessions returns list with Cache-Control and ETag', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('cache-control'), 'private, max-age=300');
      etagHeader = res.headers.get('etag') || '';
      assert(etagHeader.length > 0, 'ETag must be present');

      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result));
      if (body.result.length > 0) {
        const first = body.result[0];
        assert('id' in first);
        assert('name' in first);
        assert('startDate' in first);
        assert('endDate' in first);
        assert('status' in first);
        assert('isCurrent' in first);
      }
    });

    await test('GET /api/academic-sessions with matching If-None-Match returns 304 Not Modified', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'If-None-Match': etagHeader,
        },
      });

      assert.strictEqual(res.status, 304);
    });

    // --- Endpoint 2: POST /api/academic-sessions ---
    console.log('\n--- Step 4: Test Endpoint 2 — POST /api/academic-sessions ---');
    await test('POST /api/academic-sessions rejected with 403 for non-Super Admin (Admin)', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2030-04-01',
          endDate: '2031-03-31',
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.code, 'FORBIDDEN');
    });

    let createdSessionId: string = '';
    await test('POST /api/academic-sessions succeeds for Super Admin with auto-generated name', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2030-04-01',
          endDate: '2031-03-31',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.name, '2030-31');
      assert.strictEqual(body.result.status, 'upcoming');
      assert.strictEqual(body.result.isCurrent, false);
      createdSessionId = body.result.id;
    });

    await test('POST /api/academic-sessions rejects overlapping date ranges with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2030-08-01',
          endDate: '2031-06-30',
        }),
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.strictEqual(body.code, 'CONFLICT');
      assert(body.message.includes('overlaps'));
    });

    // --- Endpoint 3: PUT /api/academic-sessions/:id ---
    console.log('\n--- Step 5: Test Endpoint 3 — PUT /api/academic-sessions/:id ---');
    await test('PUT /api/academic-sessions/:id updates name and dates for upcoming session', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions/${createdSessionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '2030-2031 Advanced',
          startDate: '2030-05-01',
          endDate: '2031-04-30',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.result.name, '2030-2031 Advanced');
      assert.strictEqual(body.result.startDate, '2030-05-01');
      assert.strictEqual(body.result.endDate, '2031-04-30');
    });

    // --- Endpoint 4: PATCH /api/academic-sessions/:id/set-current ---
    console.log('\n--- Step 6: Test Endpoint 4 — PATCH /api/academic-sessions/:id/set-current ---');
    await test('PATCH /api/academic-sessions/:id/set-current atomically activates session & marks previous closed', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions/${createdSessionId}/set-current`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
        },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.result.id, createdSessionId);
      assert.strictEqual(body.result.status, 'current');
      assert.strictEqual(body.result.isCurrent, true);

      // Verify audit log entry was written
      const auditRes = await db.query(
        `SELECT * FROM academic_session_audit_logs WHERE session_id = $1 AND action = 'SET_CURRENT'`,
        [createdSessionId]
      );
      assert(auditRes.rows.length > 0, 'Audit log entry must be recorded');
    });

    // Create another session to test setting current again and closing previous
    let nextSessionId: string = '';
    await test('Create next session and set current, verifying previous is now closed', async () => {
      const createRes = await fetch(`${baseUrl}/api/academic-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2032-04-01',
          endDate: '2033-03-31',
        }),
      });
      assert.strictEqual(createRes.status, 201);
      const createBody = await createRes.json();
      nextSessionId = createBody.result.id;

      const setRes = await fetch(`${baseUrl}/api/academic-sessions/${nextSessionId}/set-current`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
        },
      });
      assert.strictEqual(setRes.status, 200);
      const setBody = await setRes.json();
      assert.strictEqual(setBody.result.isCurrent, true);

      // Verify createdSessionId is now closed
      const checkRes = await db.query(`SELECT status, is_current FROM academic_sessions WHERE id = $1`, [createdSessionId]);
      assert.strictEqual(checkRes.rows[0].status, 'closed');
      assert.strictEqual(checkRes.rows[0].is_current, false);
    });

    await test('Reject setting a closed session as current with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions/${createdSessionId}/set-current`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
        },
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.strictEqual(body.code, 'CONFLICT');
      assert(body.message.includes('already closed'));
    });

    await test('Reject date edits on closed session with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions/${createdSessionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2030-06-01',
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert(body.message.includes('Date edits are not permitted on closed sessions'));
    });

    // --- Endpoint 5: GET /api/me ---
    console.log('\n--- Step 7: Test Endpoint 5 — GET /api/me ---');
    await test('GET /api/me returns user profile with selectedSessionId fallback to current session', async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.actorId, adminId);
      assert.strictEqual(body.result.actorType, 'ADMIN');
      assert.strictEqual(body.result.schoolId, schoolId);
      assert.strictEqual(body.result.selectedSessionId, nextSessionId);
      // Ensure session list is NOT embedded in the profile response
      assert.strictEqual(body.result.sessions, undefined);
      assert.strictEqual(body.result.academicSessions, undefined);
    });

    // --- Endpoint 6: PUT /api/me/preferences ---
    console.log('\n--- Step 8: Test Endpoint 6 — PUT /api/me/preferences ---');
    await test('PUT /api/me/preferences rejects session from non-existent / other school with 400', async () => {
      const randomSessionId = '00000000-0000-0000-0000-999999999999';
      const res = await fetch(`${baseUrl}/api/me/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSessionId: randomSessionId,
        }),
      });

      assert.strictEqual(res.status, 400);
    });

    await test('PUT /api/me/preferences updates user preference successfully', async () => {
      const res = await fetch(`${baseUrl}/api/me/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSessionId: createdSessionId, // valid session belonging to this school
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.selectedSessionId, createdSessionId);

      // Now GET /api/me must return the newly stored preference instead of fallback!
      const meRes = await fetch(`${baseUrl}/api/me`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const meBody = await meRes.json();
      assert.strictEqual(meBody.result.selectedSessionId, createdSessionId);
    });

    // --- Endpoint 2b: POST /api/academic-sessions with copyFromSessionId ---
    console.log('\n--- Step 9: Test Session Cloning with copyFromSessionId ---');
    await test('POST /api/academic-sessions with copyFromSessionId copies sections and mappings', async () => {
      const res = await fetch(`${baseUrl}/api/academic-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-School-Id': schoolId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2034-04-01',
          endDate: '2035-03-31',
          copyFromSessionId: nextSessionId,
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.name, '2034-35');
      assert.strictEqual(body.result.status, 'upcoming');
    });

    // --- Shared Middleware: X-Session-Id Header Resolution ---
    console.log('\n--- Step 10: Test Shared Middleware Session Resolution ---');
    await test('Shared middleware resolves session from X-Session-Id header', async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'X-Session-Id': nextSessionId,
        },
      });

      assert.strictEqual(res.status, 200);
    });

    console.log(`\n🎉 All ${passed}/${total} End-to-End Integration Tests Passed Successfully!`);
  } finally {
    server.close();
  }
}

runIntegrationTests()
  .then(() => {
    console.log('\n✅ Integration test suite execution complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Integration test suite failed:', err);
    process.exit(1);
  });
