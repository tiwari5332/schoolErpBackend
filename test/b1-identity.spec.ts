import { describe, it, expect, beforeEach, vi } from 'vitest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { TokenService } from '../src/modules/auth/token.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { OnboardingService, DEFAULT_PLANS } from '../src/modules/onboarding/onboarding.service';
import { SubscriptionService } from '../src/modules/subscription/subscription.service';
import { PlatformService } from '../src/modules/platform/platform.service';
import { RolesService } from '../src/modules/roles/roles.service';
import { UsersService } from '../src/modules/users/users.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { env } from '../src/config/env.config';
import { DomainError } from '../src/common/domain.error';

describe('Phase B1: Identity & SaaS Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();

  // In-memory mock DB state
  let mockUsers: any[] = [];
  let mockTenants: any[] = [];
  let mockRoles: any[] = [];
  let mockSubscriptions: any[] = [];
  let mockPlans: any[] = [];
  let mockRefreshTokens: any[] = [];
  let mockPasswordResets: any[] = [];
  let mockUserInvites: any[] = [];
  let mockPaymentOrders: any[] = [];
  let mockInvoices: any[] = [];
  let mockAcademicSessions: any[] = [];

  const createMockPrisma = () => {
    return {
      user: {
        findUnique: vi.fn(async ({ where }: any) => mockUsers.find((u) => u.id === where.id)),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockUsers.find((u) => {
            if (where.id && u.id !== where.id) return false;
            if (where.tenantId && u.tenantId !== where.tenantId) return false;
            if (where.email && u.email !== where.email) return false;
            if (where.OR) {
              const matched = where.OR.some((clause: any) => {
                if (clause.email && u.email === clause.email) return true;
                if (clause.phone && u.phone === clause.phone) return true;
                return false;
              });
              if (!matched) return false;
            }
            return true;
          });
        }),
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          let res = mockUsers.filter((u) => {
            if (where?.tenantId && u.tenantId !== where.tenantId) return false;
            if (where?.roleId && u.roleId !== where.roleId) return false;
            if (where?.status && u.status !== where.status) return false;
            return true;
          });
          return res.slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockUsers.filter((u) => {
            if (where?.tenantId && u.tenantId !== where.tenantId) return false;
            if (where?.roleKey && u.roleKey !== where.roleKey) return false;
            if (where?.status && u.status !== where.status) return false;
            return true;
          }).length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const user = { ...data, createdAt: new Date(), updatedAt: new Date(), role: mockRoles.find((r) => r.id === data.roleId) };
          mockUsers.push(user);
          return user;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockUsers.findIndex((u) => u.id === where.id);
          if (idx !== -1) {
            mockUsers[idx] = { ...mockUsers[idx], ...data, updatedAt: new Date() };
            return mockUsers[idx];
          }
          return null;
        }),
        groupBy: vi.fn(async () => []),
      },
      tenant: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockTenants.find((t) => t.id === where.id || t.slug === where.slug);
        }),
        findMany: vi.fn(async ({ skip = 0, take = 50 }: any) => mockTenants.slice(skip, skip + take)),
        count: vi.fn(async (args: any = {}) => {
          const where = args?.where;
          if (!where?.status) return mockTenants.length;
          return mockTenants.filter((t) => t.status === where.status).length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const tenant = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockTenants.push(tenant);
          return tenant;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTenants.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            mockTenants[idx] = { ...mockTenants[idx], ...data, updatedAt: new Date() };
            return mockTenants[idx];
          }
          return null;
        }),
      },
      tenantRole: {
        findFirst: vi.fn(async ({ where }: any) => mockRoles.find((r) => r.id === where.id)),
        findMany: vi.fn(async () => mockRoles),
        create: vi.fn(async ({ data }: any) => {
          const role = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockRoles.push(role);
          return role;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockRoles.findIndex((r) => r.id === where.id);
          if (idx !== -1) {
            mockRoles[idx] = { ...mockRoles[idx], ...data, updatedAt: new Date() };
            return mockRoles[idx];
          }
          return null;
        }),
        delete: vi.fn(async ({ where }: any) => {
          mockRoles = mockRoles.filter((r) => r.id !== where.id);
        }),
      },
      saasPlan: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockPlans.find((p) => p.id === where.id || p.code === where.code);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockPlans.find((p) => {
            if (where.code && p.code !== where.code) return false;
            if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
            return true;
          });
        }),
        findMany: vi.fn(async () => mockPlans),
        create: vi.fn(async ({ data }: any) => {
          const plan = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockPlans.push(plan);
          return plan;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockPlans.findIndex((p) => p.id === where.id);
          if (idx !== -1) {
            mockPlans[idx] = { ...mockPlans[idx], ...data, updatedAt: new Date() };
            return mockPlans[idx];
          }
          return null;
        }),
      },
      subscription: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockSubscriptions.filter((s) => s.tenantId === where.tenantId).pop();
        }),
        findMany: vi.fn(async ({ where }: any) => {
          return mockSubscriptions.filter((s) => !where?.status || s.status === where.status);
        }),
        create: vi.fn(async ({ data }: any) => {
          const sub = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockSubscriptions.push(sub);
          return sub;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockSubscriptions.findIndex((s) => s.id === where.id);
          if (idx !== -1) {
            mockSubscriptions[idx] = { ...mockSubscriptions[idx], ...data, updatedAt: new Date() };
            return mockSubscriptions[idx];
          }
          return null;
        }),
      },
      refreshToken: {
        findUnique: vi.fn(async ({ where }: any) => {
          const rt = mockRefreshTokens.find((t) => t.tokenHash === where.tokenHash);
          if (rt) {
            const user = mockUsers.find((u) => u.id === rt.userId);
            return { ...rt, user };
          }
          return null;
        }),
        create: vi.fn(async ({ data }: any) => {
          mockRefreshTokens.push({ ...data });
          return data;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockRefreshTokens.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            mockRefreshTokens[idx] = { ...mockRefreshTokens[idx], ...data };
            return mockRefreshTokens[idx];
          }
          return null;
        }),
        updateMany: vi.fn(async ({ where, data }: any) => {
          for (const rt of mockRefreshTokens) {
            if (where.familyId && rt.familyId === where.familyId) {
              Object.assign(rt, data);
            }
            if (where.tokenHash && rt.tokenHash === where.tokenHash) {
              Object.assign(rt, data);
            }
            if (where.userId && rt.userId === where.userId) {
              Object.assign(rt, data);
            }
          }
        }),
      },
      passwordReset: {
        findUnique: vi.fn(async ({ where }: any) => mockPasswordResets.find((p) => p.tokenHash === where.tokenHash)),
        create: vi.fn(async ({ data }: any) => {
          mockPasswordResets.push(data);
          return data;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockPasswordResets.findIndex((p) => p.id === where.id);
          if (idx !== -1) {
            mockPasswordResets[idx] = { ...mockPasswordResets[idx], ...data };
            return mockPasswordResets[idx];
          }
          return null;
        }),
      },
      userInvite: {
        findUnique: vi.fn(async ({ where }: any) => mockUserInvites.find((i) => i.tokenHash === where.tokenHash)),
        create: vi.fn(async ({ data }: any) => {
          mockUserInvites.push(data);
          return data;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockUserInvites.findIndex((i) => i.id === where.id);
          if (idx !== -1) {
            mockUserInvites[idx] = { ...mockUserInvites[idx], ...data };
            return mockUserInvites[idx];
          }
          return null;
        }),
      },
      paymentOrder: {
        findUnique: vi.fn(async ({ where }: any) => mockPaymentOrders.find((o) => o.orderId === where.orderId)),
        create: vi.fn(async ({ data }: any) => {
          mockPaymentOrders.push(data);
          return data;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockPaymentOrders.findIndex((o) => o.id === where.id);
          if (idx !== -1) {
            mockPaymentOrders[idx] = { ...mockPaymentOrders[idx], ...data };
            return mockPaymentOrders[idx];
          }
          return null;
        }),
      },
      subscriptionInvoice: {
        findMany: vi.fn(async () => mockInvoices),
        count: vi.fn(async () => mockInvoices.length),
        create: vi.fn(async ({ data }: any) => {
          mockInvoices.push(data);
          return data;
        }),
      },
      academicSession: {
        findFirst: vi.fn(async () => mockAcademicSessions[0] || null),
        count: vi.fn(async () => mockAcademicSessions.length),
        create: vi.fn(async ({ data }: any) => {
          mockAcademicSessions.push(data);
          return data;
        }),
      },
      $transaction: vi.fn(async (cb: any) => cb(createMockPrisma())),
    } as any;
  };

  beforeEach(() => {
    mockUsers = [];
    mockTenants = [];
    mockRoles = [];
    mockSubscriptions = [];
    mockPlans = [...DEFAULT_PLANS];
    mockRefreshTokens = [];
    mockPasswordResets = [];
    mockUserInvites = [];
    mockPaymentOrders = [];
    mockInvoices = [];
    mockAcademicSessions = [];
  });

  describe('TokenService (JWT & Refresh Token Family Rotation)', () => {
    it('should generate valid 15-minute access token with expected claims', () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);

      const user = {
        id: 'usr_test_01',
        tenantId: 'ten_test_01',
        roleKey: 'SUPER_ADMIN',
        permissions: ['students.view', 'attendance.student.mark'],
      };

      const token = tokenService.generateAccessToken(user);
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      expect(decoded.sub).toBe(user.id);
      expect(decoded.tenantId).toBe(user.tenantId);
      expect(decoded.roleKey).toBe('SUPER_ADMIN');
      expect(decoded.permissions).toEqual(user.permissions);
    });

    it('should create token pair and rotate refresh tokens with family tracking', async () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);

      const role = { id: 'rol_admin', key: 'ADMIN', name: 'Admin', permissions: ['dashboard.view'] };
      mockRoles.push(role);
      const user = { id: 'usr_01', tenantId: 'ten_01', roleId: role.id, roleKey: 'ADMIN', role, roleName: 'Admin', permissions: ['dashboard.view'] };
      mockUsers.push(user);

      const pair = await tokenService.createTokenPair(user);
      expect(pair.accessToken).toBeDefined();
      expect(pair.refreshToken).toBeDefined();
      expect(pair.expiresIn).toBe(900);
      expect(mockRefreshTokens.length).toBe(1);

      // Rotate token
      const nextPair = await tokenService.rotateRefreshToken(pair.refreshToken);
      expect(nextPair.accessToken).toBeDefined();
      expect(nextPair.refreshToken).toBeDefined();
      expect(nextPair.refreshToken).not.toBe(pair.refreshToken);

      // Previous token should be marked revoked
      expect(mockRefreshTokens[0].isRevoked).toBe(true);
      expect(mockRefreshTokens[1].isRevoked).toBe(false);
    });

    it('should trigger family reuse detection when an already revoked token is submitted', async () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);

      const role = { id: 'rol_admin', key: 'ADMIN', name: 'Admin', permissions: [] };
      mockRoles.push(role);
      const user = { id: 'usr_01', tenantId: 'ten_01', roleId: role.id, roleKey: 'ADMIN', role, roleName: 'Admin', permissions: [] };
      mockUsers.push(user);

      const pair = await tokenService.createTokenPair(user);
      await tokenService.rotateRefreshToken(pair.refreshToken);

      // Attacker or client attempts to reuse old token
      await expect(tokenService.rotateRefreshToken(pair.refreshToken)).rejects.toThrow(
        'Refresh token reuse detected',
      );

      // All tokens in family should now be revoked
      expect(mockRefreshTokens.every((t) => t.isRevoked)).toBe(true);
    });
  });

  describe('AuthService (Login, Password Reset & Profile)', () => {
    it('should authenticate valid user with argon2id and return contract envelope', async () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);
      const authRepo = {
        findTenantBySlug: vi.fn(async () => mockTenants[0]),
        findTenantById: vi.fn(async () => mockTenants[0]),
        findUserByIdentifier: vi.fn(async () => mockUsers[0]),
        findUserById: vi.fn(async () => mockUsers[0]),
        updateLastLogin: vi.fn(),
        getLatestSubscription: vi.fn(async () => mockSubscriptions[0]),
        getActiveSession: vi.fn(async () => null),
      } as any;

      const authService = new AuthService(authRepo, tokenService, clock, idGen);

      const passwordHash = await argon2.hash('Secret@123', { type: argon2.argon2id });
      const tenant = {
        id: 'ten_sunrise',
        name: 'Sunrise School',
        slug: 'sunrise',
        status: 'ACTIVE',
        email: 'info@sunrise.edu',
        createdAt: new Date(),
      };
      mockTenants.push(tenant);

      const role = { id: 'rol_super', key: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['dashboard.view'] };
      mockRoles.push(role);

      const user = {
        id: 'usr_admin',
        tenantId: tenant.id,
        name: 'Shubham',
        email: 'admin@sunrise.edu',
        phone: '+919876543210',
        passwordHash,
        roleId: role.id,
        roleKey: 'SUPER_ADMIN',
        roleName: 'Super Admin',
        role,
        status: 'ACTIVE',
        mustChangePassword: false,
        createdAt: new Date(),
      };
      mockUsers.push(user);

      const res = await authService.login({
        identifier: 'admin@sunrise.edu',
        password: 'Secret@123',
        tenantSlug: 'sunrise',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.user.email).toBe('admin@sunrise.edu');
      expect(res.tenant?.slug).toBe('sunrise');
      expect(res.permissions).toContain('dashboard.view');
    });

    it('should reject invalid password with UNAUTHENTICATED', async () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);
      const authRepo = {
        findTenantBySlug: vi.fn(async () => mockTenants[0]),
        findTenantById: vi.fn(async () => mockTenants[0]),
        findUserByIdentifier: vi.fn(async () => mockUsers[0]),
      } as any;

      const authService = new AuthService(authRepo, tokenService, clock, idGen);
      const passwordHash = await argon2.hash('Secret@123', { type: argon2.argon2id });

      mockUsers.push({
        id: 'usr_admin',
        tenantId: 'ten_01',
        email: 'admin@sunrise.edu',
        passwordHash,
        status: 'ACTIVE',
        role: { permissions: [] },
      });

      await expect(
        authService.login({
          identifier: 'admin@sunrise.edu',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe('Onboarding & Tenant Registration Flow', () => {
    it('should atomically register new school tenant, super admin user, default roles, trial subscription, and session', async () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);
      const onboardingService = new OnboardingService(mockPrisma, tokenService, idGen);

      const res = await onboardingService.registerSchool({
        schoolName: 'Sunrise Public School',
        city: 'Prayagraj',
        state: 'Uttar Pradesh',
        adminName: 'Shubham Tiwari',
        email: 'admin@sunrise.edu',
        phone: '+919876543210',
        password: 'Password@123',
        planCode: 'GROWTH',
        billingCycle: 'YEARLY',
        acceptTerms: true,
      });

      expect(res.tenant.name).toBe('Sunrise Public School');
      expect(res.tenant.status).toBe('TRIAL');
      expect(res.user.email).toBe('admin@sunrise.edu');
      expect(res.user.roleKey).toBe('SUPER_ADMIN');
      expect(res.subscription.status).toBe('TRIAL');
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();

      // Verify that default system roles were created
      expect(mockRoles.length).toBeGreaterThanOrEqual(8);
      expect(mockRoles.some((r) => r.key === 'SUPER_ADMIN')).toBe(true);
      expect(mockRoles.some((r) => r.key === 'TEACHER')).toBe(true);
      expect(mockRoles.some((r) => r.key === 'ACCOUNTANT')).toBe(true);

      // Verify academic session created
      expect(mockAcademicSessions.length).toBe(1);
      expect(mockAcademicSessions[0].isCurrent).toBe(true);
    });
  });

  describe('Subscription & Plan Management', () => {
    it('should generate gateway order on checkout and activate plan on confirm', async () => {
      const mockPrisma = createMockPrisma();
      const subService = new SubscriptionService(mockPrisma, idGen);

      const plan = mockPlans.find((p) => p.code === 'GROWTH');
      const tenantId = 'ten_test';
      mockTenants.push({ id: tenantId, status: 'TRIAL' });

      // Checkout
      const checkoutRes = await subService.checkout(tenantId, {
        planCode: 'GROWTH',
        billingCycle: 'YEARLY',
        couponCode: 'WELCOME10', // 10% discount
      });

      expect(checkoutRes.orderId).toBeDefined();
      expect(checkoutRes.amount).toBe(Math.round(plan.priceYearly * 0.9));
      expect(checkoutRes.gateway).toBe('RAZORPAY');

      // Confirm
      const confirmRes = await subService.confirm(tenantId, {
        orderId: checkoutRes.orderId,
        paymentId: 'pay_rzp_123',
        signature: 'sig_valid_hash',
      });

      expect(confirmRes.status).toBe('ACTIVE');
      expect(confirmRes.planName).toBe(plan.name);

      // Verify invoice generated
      expect(mockInvoices.length).toBe(1);
      expect(mockInvoices[0].status).toBe('PAID');
    });

    it('should reject plan downgrade if current student count exceeds new plan limit', async () => {
      const mockPrisma = createMockPrisma();
      const subService = new SubscriptionService(mockPrisma, idGen);
      const tenantId = 'ten_large';

      // Current tenant has 800 students
      mockSubscriptions.push({
        id: 'sub_large',
        tenantId,
        planId: 'pln_pro',
        planName: 'Pro',
        status: 'ACTIVE',
        billingCycle: 'YEARLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        usage: { students: 800, staff: 50 },
        limits: { students: 3000, staff: 300 },
      });

      // Attempt downgrade to STARTER (limit: 300 students)
      await expect(
        subService.changePlan(tenantId, {
          planCode: 'STARTER',
          billingCycle: 'MONTHLY',
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe('Platform Owner Capabilities', () => {
    it('should calculate platform metrics and update tenant status', async () => {
      const mockPrisma = createMockPrisma();
      const platformService = new PlatformService(mockPrisma, idGen);

      mockTenants.push(
        { id: 'ten_01', status: 'ACTIVE' },
        { id: 'ten_02', status: 'TRIAL' },
      );

      const metrics = await platformService.getMetrics();
      expect(metrics.totalSchools).toBe(2);
      expect(metrics.activeSchools).toBe(1);
      expect(metrics.trialSchools).toBe(1);

      // Suspend tenant
      const updatedTenant = await platformService.updateTenantStatus('ten_01', {
        status: 'SUSPENDED',
        reason: 'Payment defaulted',
      });

      expect(updatedTenant.status).toBe('SUSPENDED');
    });
  });

  describe('RBAC Roles & Users Administration', () => {
    it('should create custom role and prevent deleting system roles', async () => {
      const mockPrisma = createMockPrisma();
      const rolesService = new RolesService(mockPrisma, idGen);
      const tenantId = 'ten_rbac';

      const systemRole = {
        id: 'rol_sys_01',
        tenantId,
        key: 'SUPER_ADMIN',
        name: 'Super Admin',
        isSystem: true,
        permissions: ['roles.manage'],
      };
      mockRoles.push(systemRole);

      // Create custom role
      const customRole = await rolesService.createRole(tenantId, {
        name: 'Front Desk Coordinator',
        description: 'Front desk reception desk',
        permissions: ['students.view', 'fees.collect'],
      });

      expect(customRole.name).toBe('Front Desk Coordinator');
      expect(customRole.isSystem).toBe(false);

      // Attempt deleting system role should be forbidden
      await expect(rolesService.deleteRole(tenantId, systemRole.id)).rejects.toThrow(
        'System roles cannot be deleted',
      );

      // Deleting custom role succeeds
      await rolesService.deleteRole(tenantId, customRole.id);
      expect(mockRoles.some((r) => r.id === customRole.id)).toBe(false);
    });

    it('should invite user, prevent deactivating last Super Admin, and accept invite', async () => {
      const mockPrisma = createMockPrisma();
      const tokenService = new TokenService(mockPrisma, idGen);
      const usersService = new UsersService(mockPrisma, tokenService, idGen);
      const tenantId = 'ten_usr_test';

      const teacherRole = {
        id: 'rol_teacher',
        tenantId,
        key: 'TEACHER',
        name: 'Teacher',
        permissions: ['students.view', 'attendance.student.mark'],
      };
      const superAdminRole = {
        id: 'rol_sa',
        tenantId,
        key: 'SUPER_ADMIN',
        name: 'Super Admin',
        permissions: ['roles.manage'],
      };
      mockRoles.push(teacherRole, superAdminRole);

      // Primary Super Admin
      const saUser = {
        id: 'usr_sa',
        tenantId,
        email: 'sa@school.edu',
        roleId: superAdminRole.id,
        roleKey: 'SUPER_ADMIN',
        status: 'ACTIVE',
      };
      mockUsers.push(saUser);

      // Try deactivating the only active super admin -> forbidden
      await expect(
        usersService.updateUserStatus(tenantId, saUser.id, { status: 'INACTIVE' }),
      ).rejects.toThrow('Cannot deactivate the only active Super Admin');

      // Invite teacher
      const inviteRes = await usersService.inviteUser(tenantId, {
        email: 'teacher@school.edu',
        name: 'Amit Sharma',
        roleId: teacherRole.id,
      });

      expect(inviteRes.user.status).toBe('INVITED');
      expect(inviteRes.inviteLink).toContain('https://app.edutrio.com/accept-invite?token=');

      // Extract raw token from invite link and accept invite
      const token = inviteRes.inviteLink.split('token=')[1];
      const acceptRes = await usersService.acceptInvite({
        token,
        password: 'NewTeacherPassword@123',
      });

      expect(acceptRes.accessToken).toBeDefined();
      expect(acceptRes.refreshToken).toBeDefined();

      const activatedUser = mockUsers.find((u) => u.email === 'teacher@school.edu');
      expect(activatedUser.status).toBe('ACTIVE');
    });
  });
});
