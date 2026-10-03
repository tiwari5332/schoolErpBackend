import db from '../../config/database';
import { RbacService as RbacCache } from '../../middleware/rbac.middleware';
import { BusinessRuleException, NotFoundError } from '../../utils/response';

export class RoleService {
  static async getSchoolCustomRoles(schoolId: string) {
    const res = await db.query(
      `SELECT r.*,
              coalesce(
                json_agg(
                  json_build_object('id', rp.id, 'permission', row_to_json(p.*))
                ) FILTER (WHERE rp.id IS NOT NULL), '[]'
              ) as "rolePermissions"
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE r.school_id = $1
       GROUP BY r.id`,
      [schoolId]
    );
    return res.rows;
  }

  static async createCustomRole(schoolId: string, name: string, description: string | undefined, permissionCodes: string[]) {
    const existingRes = await db.query(
      `SELECT id FROM roles WHERE school_id = $1 AND name = $2`,
      [schoolId, name]
    );
    if (existingRes.rows.length > 0) {
      throw new BusinessRuleException(`Role with name '${name}' already exists in school`);
    }

    const permsRes = await db.query(
      `SELECT id FROM permissions WHERE code = ANY($1)`,
      [permissionCodes]
    );

    return db.transaction(async (client) => {
      const roleRes = await client.query(
        `INSERT INTO roles (id, school_id, name, description)
         VALUES (gen_random_uuid(), $1, $2, $3)
         RETURNING *`,
        [schoolId, name, description || null]
      );
      const role = roleRes.rows[0];

      for (const p of permsRes.rows) {
        await client.query(
          `INSERT INTO role_permissions (id, role_id, permission_id)
           VALUES (gen_random_uuid(), $1, $2)`,
          [role.id, p.id]
        );
      }

      return role;
    });
  }

  static async assignRole(actorType: string, actorId: string, roleId: string) {
    const roleRes = await db.query(`SELECT id FROM roles WHERE id = $1`, [roleId]);
    if (roleRes.rows.length === 0) {
      throw new NotFoundError(`Role not found: ${roleId}`);
    }

    const res = await db.query(
      `INSERT INTO actor_role_assignments (id, actor_type, actor_id, role_id)
       VALUES (gen_random_uuid(), $1, $2, $3)
       ON CONFLICT (actor_type, actor_id, role_id) DO UPDATE SET role_id = EXCLUDED.role_id
       RETURNING *`,
      [actorType, actorId, roleId]
    );

    RbacCache.evictCache(actorType, actorId);
    return res.rows[0];
  }

  static async getRolePermissions(roleId: string) {
    const roleRes = await db.query(`SELECT id FROM roles WHERE id = $1`, [roleId]);
    if (roleRes.rows.length === 0) {
      throw new NotFoundError(`Role not found: ${roleId}`);
    }

    const res = await db.query(
      `SELECT p.*
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    return res.rows;
  }

  static async getRolePermissionsByName(schoolId: string, roleName: string) {
    const roleRes = await db.query(
      `SELECT id FROM roles WHERE (school_id = $1 OR school_id IS NULL) AND name = $2 LIMIT 1`,
      [schoolId, roleName]
    );
    const role = roleRes.rows[0];
    if (!role) {
      throw new NotFoundError(`Role '${roleName}' not found`);
    }

    const res = await db.query(
      `SELECT p.*
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [role.id]
    );
    return res.rows;
  }
}
