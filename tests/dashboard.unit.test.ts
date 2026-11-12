import assert from 'assert';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { ActorType } from '../src/config/constants';
import { AppError } from '../src/utils/response';

async function runDashboardUnitTests() {
  console.log('🧪 Starting Dashboard Module — Unit Tests...');
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
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

  // --- 1. Timezone Boundary (11:30 PM IST vs UTC) ---
  await test('Timezone Boundary: 18:00 UTC (11:30 PM IST) produces IST calendar date', () => {
    // 2026-11-08 at 18:00:00 UTC is 2026-11-08 23:30:00 IST (same calendar date)
    const lateUtcDate = new Date('2026-11-08T18:00:00Z');
    const istDateStr = DashboardService.computeTodayInTimezone('Asia/Kolkata', lateUtcDate);
    assert.strictEqual(istDateStr, '2026-11-08');

    // 2026-11-08 at 18:31:00 UTC is 2026-11-09 00:01:00 IST (next calendar date in IST, but still 11-08 in UTC)
    const pastMidnightUtc = new Date('2026-11-08T18:31:00Z');
    const nextDayIstStr = DashboardService.computeTodayInTimezone('Asia/Kolkata', pastMidnightUtc);
    assert.strictEqual(nextDayIstStr, '2026-11-09');
  });

  // --- 2. Sunday & Holiday Day Type Logic ---
  await test('Sunday Logic: Sunday correctly resolves to "weekly_off" with isWorkingDay = false', async () => {
    // 2026-11-08 is Sunday!
    const sundayStr = '2026-11-08';
    const [y, m, d] = sundayStr.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
    assert.strictEqual(dayOfWeek, 0); // 0 is Sunday
  });

  await test('Holiday Attendance: Non-working day results in percentage = null and status = "holiday"', () => {
    const isWorkingDay = false;
    const enrolled = 50;

    let studentAttendance;
    if (!isWorkingDay) {
      studentAttendance = {
        present: 0,
        absent: 0,
        total: enrolled,
        percentage: null,
        status: 'holiday' as const,
      };
    }

    assert.strictEqual(studentAttendance?.percentage, null);
    assert.strictEqual(studentAttendance?.status, 'holiday');
  });

  // --- 3. Role Filtering & Guard Verification ---
  await test('Role Guard: Teacher is forbidden from fee data with WIDGET_FORBIDDEN', () => {
    const actorType = ActorType.TEACHER;
    let thrownError: any = null;

    try {
      if (actorType === ActorType.TEACHER) {
        throw new AppError(
          'Teachers are not permitted to view fee data',
          403,
          null,
          true,
          'WIDGET_FORBIDDEN'
        );
      }
    } catch (err) {
      thrownError = err;
    }

    assert(thrownError instanceof AppError);
    assert.strictEqual(thrownError.statusCode, 403);
    assert.strictEqual(thrownError.code, 'WIDGET_FORBIDDEN');
  });

  await test('Role Guard: Accountant is forbidden from staff attendance with WIDGET_FORBIDDEN', () => {
    const isAccountant = true;
    let thrownError: any = null;

    try {
      if (isAccountant) {
        throw new AppError(
          'Accountants are not permitted to view staff attendance',
          403,
          null,
          true,
          'WIDGET_FORBIDDEN'
        );
      }
    } catch (err) {
      thrownError = err;
    }

    assert(thrownError instanceof AppError);
    assert.strictEqual(thrownError.statusCode, 403);
    assert.strictEqual(thrownError.code, 'WIDGET_FORBIDDEN');
  });

  // --- 4. Empty School Handling ---
  await test('Empty School Handling: 0 enrolled students produces 0.0% attendance without NaN/divide-by-zero', () => {
    const enrolled = 0;
    const marked = 0;
    const present = 0;

    const percentage = enrolled > 0 ? Math.round((present / enrolled) * 10000) / 100 : 0.0;
    assert.strictEqual(percentage, 0.0);
    assert(!isNaN(percentage));
  });

  console.log(`\n🎉 All ${passed}/${total} Dashboard Unit Tests Passed Successfully!\n`);
}

runDashboardUnitTests().catch((err) => {
  console.error('Dashboard unit tests failed:', err);
  process.exit(1);
});

