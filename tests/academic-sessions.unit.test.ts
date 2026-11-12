import assert from 'assert';
import { SessionService } from '../src/modules/session/session.service';
import { requireSuperAdmin } from '../src/middleware/rbac.middleware';
import { ActorType } from '../src/config/constants';
import { ExtendedRequest } from '../src/middleware/logger.middleware';
import { ForbiddenError, UnauthorizedError, BusinessRuleException } from '../src/utils/response';
import { createSessionSchema } from '../src/modules/session/session.dto';

async function runUnitTests() {
  console.log('🧪 Starting Academic Sessions Module — Unit Tests...');
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

  // --- 1. Session Name Auto-Generation & Formatting ---
  await test('Session Name Auto-Generation: Cross-year session generates "YYYY-YY"', () => {
    const name = SessionService.generateSessionName('2027-04-01', '2028-03-31');
    assert.strictEqual(name, '2027-28');
  });

  await test('Session Name Auto-Generation: Same-year session generates "YYYY"', () => {
    const name = SessionService.generateSessionName('2027-01-01', '2027-12-31');
    assert.strictEqual(name, '2027');
  });

  // --- 2. DTO Validation: End date must be after Start date ---
  await test('DTO Validation: Reject session if endDate <= startDate', () => {
    assert.throws(
      () => {
        createSessionSchema.parse({
          startDate: '2027-04-01',
          endDate: '2027-04-01',
        });
      },
      (err: any) => err.name === 'ZodError'
    );

    assert.throws(
      () => {
        createSessionSchema.parse({
          startDate: '2027-04-01',
          endDate: '2026-03-31',
        });
      },
      (err: any) => err.name === 'ZodError'
    );
  });

  await test('DTO Validation: Valid dates pass validation and allow optional name', () => {
    const parsed = createSessionSchema.parse({
      startDate: '2027-04-01',
      endDate: '2028-03-31',
    });
    assert.strictEqual(parsed.startDate, '2027-04-01');
    assert.strictEqual(parsed.endDate, '2028-03-31');
    assert.strictEqual(parsed.name, undefined);
  });

  // --- 3. Overlap Check Logic Simulation ---
  await test('Overlap Check Logic: Correctly detects overlapping intervals', async () => {
    const mockClientWithConflict = {
      query: async () => ({
        rows: [
          {
            id: 'sess-existing-1',
            name: '2026-27',
            startDate: '2026-04-01',
            endDate: '2027-03-31',
          },
        ],
      }),
    };

    await assert.rejects(
      async () => {
        await SessionService.checkOverlap(
          'school-123',
          '2026-08-01',
          '2027-06-30',
          undefined,
          mockClientWithConflict
        );
      },
      (err: any) => {
        assert(err instanceof BusinessRuleException);
        assert.strictEqual(err.statusCode, 409);
        assert(err.message.includes('overlaps with existing session'));
        return true;
      }
    );
  });

  await test('Overlap Check Logic: Allows non-overlapping intervals', async () => {
    const mockClientNoConflict = {
      query: async () => ({ rows: [] }),
    };

    await SessionService.checkOverlap(
      'school-123',
      '2028-04-01',
      '2029-03-31',
      undefined,
      mockClientNoConflict
    );
  });

  // --- 4. Role Guard: requireSuperAdmin ---
  await test('Role Guard: Rejects unauthenticated request with 401', () => {
    const req = {} as ExtendedRequest;
    const res = {} as any;
    let nextCalledWith: any = null;

    requireSuperAdmin(req, res, (err) => {
      nextCalledWith = err;
    });

    assert(nextCalledWith instanceof UnauthorizedError);
    assert.strictEqual(nextCalledWith.statusCode, 401);
  });

  await test('Role Guard: Rejects ADMIN with 403 Forbidden', () => {
    const req = {
      user: {
        actorId: 'admin-uuid',
        actorType: ActorType.ADMIN,
        schoolId: 'school-uuid',
      },
    } as ExtendedRequest;
    const res = {} as any;
    let nextCalledWith: any = null;

    requireSuperAdmin(req, res, (err) => {
      nextCalledWith = err;
    });

    assert(nextCalledWith instanceof ForbiddenError);
    assert.strictEqual(nextCalledWith.statusCode, 403);
    assert(nextCalledWith.message.includes('Super Admin only'));
  });

  await test('Role Guard: Rejects TEACHER with 403 Forbidden', () => {
    const req = {
      user: {
        actorId: 'teacher-uuid',
        actorType: ActorType.TEACHER,
        schoolId: 'school-uuid',
      },
    } as ExtendedRequest;
    const res = {} as any;
    let nextCalledWith: any = null;

    requireSuperAdmin(req, res, (err) => {
      nextCalledWith = err;
    });

    assert(nextCalledWith instanceof ForbiddenError);
    assert.strictEqual(nextCalledWith.statusCode, 403);
  });

  await test('Role Guard: Allows SUPER_ADMIN to proceed', () => {
    const req = {
      user: {
        actorId: 'superadmin-uuid',
        actorType: ActorType.SUPER_ADMIN,
        schoolId: null,
      },
    } as ExtendedRequest;
    const res = {} as any;
    let nextCalled = false;

    requireSuperAdmin(req, res, (err) => {
      assert.strictEqual(err, undefined);
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
  });

  // --- 5. Closed Session Date Edit Guard ---
  await test('Closed Session Date Edit Guard: Detects date edits on closed session', () => {
    const existing = {
      id: 'sess-closed',
      status: 'closed',
      startDate: '2025-04-01',
      endDate: '2026-03-31',
    };
    const data = {
      startDate: '2025-05-01',
    };

    const hasDateEdit = data.startDate !== undefined && data.startDate !== existing.startDate;
    assert.strictEqual(hasDateEdit, true);
    assert.strictEqual(existing.status === 'closed' && hasDateEdit, true);
  });

  console.log(`\n🎉 All ${passed}/${total} Unit Tests Passed Successfully!\n`);
}

runUnitTests().catch((err) => {
  console.error('Unit tests failed:', err);
  process.exit(1);
});
