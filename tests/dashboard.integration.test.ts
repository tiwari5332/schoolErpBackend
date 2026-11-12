import assert from 'assert';
import http from 'http';
import app from '../src/app';
import { initDatabaseSchema } from '../src/config/initDb';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtUtils } from '../src/utils/jwt';
import { ActorType, PlanCode } from '../src/config/constants';

async function runDashboardIntegrationTests() {
  console.log('🚀 Starting Dashboard & Widgets Integration Tests...');

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

    // 2. Generate Teacher token
    const teacherToken = JwtUtils.generateLoginToken({
      actorId: '00000000-0000-0000-0000-000000000002',
      actorType: ActorType.TEACHER,
      schoolId,
      planCode: PlanCode.BASIC,
      features: ['ACADEMIC_SETUP'],
    });

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

    // 1. GET /api/dashboard/summary
    await test('GET /api/dashboard/summary returns executive summary with 60s cache header', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('cache-control'), 'private, max-age=60');
      assert(res.headers.get('etag'), 'ETag must be present');

      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert('date' in body.result);
      assert('isWorkingDay' in body.result);
      assert('dayType' in body.result);
      assert('students' in body.result);
      assert('staff' in body.result);
      assert('fees' in body.result);
      assert('studentAttendance' in body.result);
    });

    // 2. GET /api/dashboard/summary for Teacher (fees hidden / null)
    await test('GET /api/dashboard/summary hides fees for Teacher', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.result.fees, null);
    });

    // 3. GET /api/dashboard/staff-attendance
    await test('GET /api/dashboard/staff-attendance returns active staff counts & items', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/staff-attendance?limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert('counts' in body.result);
      assert('items' in body.result);
      assert(Array.isArray(body.result.items));
    });

    // 4. GET /api/dashboard/staff-attendance with future date rejected with 400
    await test('GET /api/dashboard/staff-attendance rejects future date with 400', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/staff-attendance?date=2099-01-01`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.code, 'VALIDATION_ERROR');
    });

    // 5. GET /api/dashboard/communication-balance
    await test('GET /api/dashboard/communication-balance returns channel quotas with 5 min cache', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/communication-balance`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('cache-control'), 'private, max-age=300');
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result.channels));
    });

    // 6. GET /api/dashboard/pending-actions
    await test('GET /api/dashboard/pending-actions returns attendance and approvals backlog', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/pending-actions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert('attendanceNotMarked' in body.result);
      assert('approvals' in body.result);
    });

    // 7. GET /api/dashboard/fee-trend
    await test('GET /api/dashboard/fee-trend returns daily points and sums in paise', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/fee-trend?days=7`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result.points));
      assert.strictEqual(body.result.points.length, 7);
      assert('total' in body.result);
      assert('previousPeriodTotal' in body.result);
    });

    // 8. GET /api/dashboard/fee-trend returns 403 WIDGET_FORBIDDEN for Teacher
    await test('GET /api/dashboard/fee-trend rejects Teacher with 403 WIDGET_FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/fee-trend?days=7`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.code, 'WIDGET_FORBIDDEN');
    });

    // 9. Calendar & Events endpoints
    await test('POST /api/calendar/events creates a calendar holiday event', async () => {
      const res = await fetch(`${baseUrl}/api/calendar/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Republic Day Celebration',
          type: 'holiday',
          date: '2027-01-26',
          description: 'National holiday celebration',
          notifyUsers: true,
        }),
      });
      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert.strictEqual(body.result.title, 'Republic Day Celebration');
    });

    await test('GET /api/calendar/events returns range events including Sunday weekly offs', async () => {
      const res = await fetch(`${baseUrl}/api/calendar/events?from=2027-01-01&to=2027-01-31`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result));
      const hasSunday = body.result.some((e: any) => e.title.includes('Sunday'));
      assert(hasSunday, 'Sundays must be included in calendar events');
    });

    await test('GET /api/events/upcoming returns next 30 days events', async () => {
      const res = await fetch(`${baseUrl}/api/events/upcoming?days=30&limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result));
    });

    // 10. GET /api/notifications/unread-count
    await test('GET /api/notifications/unread-count returns unread count for actor', async () => {
      const res = await fetch(`${baseUrl}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert('count' in body.result);
    });

    // 11. GET /api/me/quick-actions
    await test('GET /api/me/quick-actions returns RBAC-permitted quick actions', async () => {
      const res = await fetch(`${baseUrl}/api/me/quick-actions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'success');
      assert(Array.isArray(body.result.actions));
      assert(body.result.actions.length > 0);
      assert(body.result.actions.some((a: any) => a.id === 'mark_attendance'));
    });

    console.log(`\n🎉 All ${passed}/${total} Dashboard Integration Tests Passed Successfully!`);
  } finally {
    server.close();
  }
}

runDashboardIntegrationTests()
  .then(() => {
    console.log('\n✅ Dashboard integration test execution complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Dashboard integration test failed:', err);
    process.exit(1);
  });
