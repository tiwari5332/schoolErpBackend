import { AuthService } from '../src/services/auth.service';
import db, { pool } from '../src/config/database';
import { PermissionCode } from '../src/config/constants';

async function seed() {
  console.log('🌱 Starting dummy school & RBAC permissions seed script...');

  // 1. Seed System Permissions
  const permissionCodes = Object.values(PermissionCode);
  for (const code of permissionCodes) {
    await db.query(
      `INSERT INTO permissions (id, code, description)
       VALUES (gen_random_uuid(), $1, $2)
       ON CONFLICT (code) DO NOTHING`,
      [code, `Permission for ${code}`]
    );
  }
  console.log(`✅ Seeded ${permissionCodes.length} system permissions in PostgreSQL.`);

  // 2. Seed Admin & School
  const msisdn = '8920147799';
  const password = 'Shubh321@';
  const email = 'admin.dps@schoolerp.com';
  const schoolName = 'Apex Global Academy';

  // Check if admin already exists
  const existingRes = await db.query(
    `SELECT * FROM admins WHERE email = $1 OR msisdn = $2 LIMIT 1`,
    [email, msisdn]
  );
  const existingAdmin = existingRes.rows[0];

  if (existingAdmin) {
    console.log(`⚠️ Admin with mobile ${msisdn} or email ${email} already exists! Updating password...`);
    const { HashUtils } = await import('../src/utils/hash');
    const passwordHash = await HashUtils.hashPassword(password);
    await db.query(
      `UPDATE admins SET password_hash = $1, status = 'ACTIVE' WHERE id = $2`,
      [passwordHash, existingAdmin.id]
    );
    console.log(`✅ Admin password updated to '${password}'. Admin ID: ${existingAdmin.id}, School ID: ${existingAdmin.school_id}`);
    return;
  }

  const result = await AuthService.registerSchool({
    schoolName,
    schoolAddress: '123 Education Lane, Knowledge Park, New Delhi',
    contactEmail: 'contact@apexglobal.edu.in',
    contactPhone: msisdn,
    adminName: 'Shubham Verma (Admin)',
    adminEmail: email,
    adminMsisdn: msisdn,
    adminPassword: password,
  });

  console.log('=======================================================');
  console.log('🎉 Dummy School & Admin created successfully in Neon DB!');
  console.log('=======================================================');
  console.log(`School ID:   ${result.schoolId}`);
  console.log(`Admin ID:    ${result.adminId}`);
  console.log(`Admin Email: ${result.email}`);
  console.log(`Admin Phone: ${msisdn}`);
  console.log(`Password:    ${password}`);
  console.log('=======================================================');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
