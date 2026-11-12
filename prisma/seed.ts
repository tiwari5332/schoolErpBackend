import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import { DEFAULT_PLANS } from '../src/modules/onboarding/onboarding.service';
import { DEFAULT_SYSTEM_ROLES } from '../src/modules/roles/default-roles';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting EduTrio ERP database seeding...');

  // 1. Seed SaaS Subscription Plans
  console.log('📦 Seeding SaaS Plans...');
  for (const plan of DEFAULT_PLANS) {
    await prisma.saasPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        trialDays: plan.trialDays,
        limits: plan.limits,
        features: plan.features,
        isActive: plan.isActive,
      },
      create: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        trialDays: plan.trialDays,
        limits: plan.limits,
        features: plan.features,
        isActive: plan.isActive,
      },
    });
  }
  console.log(`✅ Seeded ${DEFAULT_PLANS.length} SaaS plans.`);

  // 2. Seed Global System Roles
  console.log('🛡️  Seeding System Roles...');
  for (const role of DEFAULT_SYSTEM_ROLES) {
    const existing = await prisma.tenantRole.findFirst({
      where: { key: role.key, tenantId: null },
    });

    if (existing) {
      await prisma.tenantRole.update({
        where: { id: existing.id },
        data: {
          name: role.name,
          description: role.description,
          permissions: role.permissions as any,
        },
      });
    } else {
      await prisma.tenantRole.create({
        data: {
          id: `rol_sys_${role.key.toLowerCase()}`,
          tenantId: null,
          key: role.key,
          name: role.name,
          description: role.description,
          isSystem: true,
          permissions: role.permissions as any,
        },
      });
    }
  }
  console.log(`✅ Seeded ${DEFAULT_SYSTEM_ROLES.length} global system roles.`);

  // 3. Seed Platform Owner
  console.log('👑 Seeding Platform Owner...');
  const ownerEmail = 'owner@edutrio.com';
  const ownerPassword = 'Password123!';
  const ownerPasswordHash = await argon2.hash(ownerPassword, { type: argon2.argon2id });

  let superAdminRole = await prisma.tenantRole.findFirst({
    where: { key: 'SUPER_ADMIN', tenantId: null },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.tenantRole.create({
      data: {
        id: 'rol_sys_super_admin',
        tenantId: null,
        key: 'SUPER_ADMIN',
        name: 'Super Admin',
        isSystem: true,
        permissions: ['*'],
      },
    });
  }

  const existingOwner = await prisma.user.findFirst({
    where: { email: ownerEmail, tenantId: null },
  });

  if (existingOwner) {
    await prisma.user.update({
      where: { id: existingOwner.id },
      data: {
        passwordHash: ownerPasswordHash,
        status: 'ACTIVE',
        roleId: superAdminRole.id,
      },
    });
    console.log(`✅ Updated Platform Owner credentials (${ownerEmail}).`);
  } else {
    await prisma.user.create({
      data: {
        id: 'usr_platform_owner',
        tenantId: null,
        name: 'Platform Owner',
        email: ownerEmail,
        phone: '9999999999',
        passwordHash: ownerPasswordHash,
        roleId: superAdminRole.id,
        roleKey: 'PLATFORM_OWNER',
        roleName: 'Platform Owner',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created Platform Owner (${ownerEmail} / ${ownerPassword}).`);
  }

  // 4. Seed Demo Tenant (School)
  console.log('🏫 Seeding Demo School: Apex Global Academy...');
  const tenantSlug = 'apex-global';
  const adminEmail = 'admin.dps@schoolerp.com';
  const adminPhone = '8920147799';
  const adminPassword = 'Shubh321@';
  const adminPasswordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {
      name: 'Apex Global Academy',
      email: adminEmail,
      phone: adminPhone,
      status: 'ACTIVE',
    },
    create: {
      id: 'ten_apex_global',
      name: 'Apex Global Academy',
      slug: tenantSlug,
      email: adminEmail,
      phone: adminPhone,
      brandColor: '#4F46E5',
      board: 'CBSE',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
  });

  // Seed School-scoped Roles
  let schoolAdminRole = await prisma.tenantRole.findFirst({
    where: { tenantId: tenant.id, key: 'ADMIN' },
  });

  if (!schoolAdminRole) {
    schoolAdminRole = await prisma.tenantRole.create({
      data: {
        id: `rol_${tenant.id}_admin`,
        tenantId: tenant.id,
        key: 'ADMIN',
        name: 'Administrator',
        description: 'School Administrator Role',
        isSystem: true,
        permissions: DEFAULT_SYSTEM_ROLES.find((r) => r.key === 'ADMIN')?.permissions || [],
      },
    });
  }

  // Seed School Admin User
  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail, tenantId: tenant.id },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: 'Shubham Verma (Admin)',
        phone: adminPhone,
        passwordHash: adminPasswordHash,
        status: 'ACTIVE',
        roleId: schoolAdminRole.id,
        roleKey: 'ADMIN',
        roleName: 'Administrator',
      },
    });
    console.log(`✅ Updated Demo School Admin credentials.`);
  } else {
    await prisma.user.create({
      data: {
        id: `usr_${tenant.id}_admin`,
        tenantId: tenant.id,
        name: 'Shubham Verma (Admin)',
        email: adminEmail,
        phone: adminPhone,
        passwordHash: adminPasswordHash,
        roleId: schoolAdminRole.id,
        roleKey: 'ADMIN',
        roleName: 'Administrator',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created Demo School Admin.`);
  }

  // 5. Seed School Active Subscription
  const growthPlan = await prisma.saasPlan.findUnique({ where: { code: 'GROWTH' } });
  if (growthPlan) {
    const existingSub = await prisma.subscription.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          id: `sub_${tenant.id}`,
          tenantId: tenant.id,
          planId: growthPlan.id,
          planName: growthPlan.name,
          status: 'ACTIVE',
          billingCycle: 'YEARLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          limits: (growthPlan.limits ?? {}) as any,
        },
      });
      console.log(`✅ Created Growth Subscription for ${tenant.name}.`);
    }
  }

  // 6. Seed Academic Session
  const sessionName = '2026-27';
  const existingSession = await prisma.saasAcademicSession.findFirst({
    where: { tenantId: tenant.id, name: sessionName },
  });

  if (!existingSession) {
    await prisma.saasAcademicSession.create({
      data: {
        id: `ses_${tenant.id}_2026_27`,
        tenantId: tenant.id,
        name: sessionName,
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        isActive: true,
        isLocked: false,
      },
    });
    console.log(`✅ Created Academic Session '${sessionName}' for ${tenant.name}.`);
  }

  console.log('\n=============================================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('=============================================================');
  console.log('Platform Owner Login:');
  console.log(`  Email:    ${ownerEmail}`);
  console.log(`  Password: ${ownerPassword}`);
  console.log('School Admin Login:');
  console.log(`  School:   ${tenant.name} (${tenant.slug})`);
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Mobile:   ${adminPhone}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
