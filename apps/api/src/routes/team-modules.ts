import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

const MODULES = ['dashboard', 'users', 'teams', 'drive', 'channels', 'products', 'marketing', 'reports', 'customers', 'seo'];
const ALL_TABLES = ['b1','b2','b3','b4'];

export default async function (app: FastifyInstance) {
  const io = (app as any).io;

  const logActivity = async (userId: string | null, action: string, module: string, entity: string, detail: string) => {
    try {
      const [users] = await pool.execute("SELECT name FROM users WHERE id = ?", [userId]);
      const uname = (users as any[])[0]?.name || '';
      const [result] = await pool.execute(
        "INSERT INTO activity_logs (id, user_id, user_name, action, module, entity, detail) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [uuid(), userId, uname, action, module, entity, detail.slice(0, 1000)]
      );
      if (io) io.emit('activity:new', { id: (result as any).insertId, userId, user_name: uname, action, module, entity, detail: detail.slice(0, 1000), created_at: new Date() });
    } catch {}
  };

  // ========== TEAM MODULES ==========
  app.get('/team-modules', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute(
      "SELECT tm.*, t.name as teamName FROM team_modules tm JOIN teams t ON t.id = tm.team_id ORDER BY t.name, tm.module_key"
    );
    reply.send(rows);
  });

  app.post('/team-modules/toggle', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { teamId, moduleKey, add } = req.body as any;
    const [teams] = await pool.execute("SELECT name FROM teams WHERE id = ?", [teamId]);
    const teamName = (teams as any[])[0]?.name || teamId;
    if (add) {
      await pool.execute("INSERT IGNORE INTO team_modules (id, team_id, module_key) VALUES (?, ?, ?)", [uuid(), teamId, moduleKey]);
      await logActivity(req.user.id, 'grant', 'team', teamName, 'Cấp module ' + moduleKey);
    } else {
      await pool.execute("DELETE FROM team_modules WHERE team_id = ? AND module_key = ?", [teamId, moduleKey]);
      await logActivity(req.user.id, 'revoke', 'team', teamName, 'Thu hồi module ' + moduleKey);
    }
    if (io) io.emit('modules:update', { teamId, moduleKey, add });
    reply.send({ success: true });
  });

  // ========== USER MODULES (per-person) ==========
  app.get('/user-modules', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    const moduleKey = q.moduleKey || '';
    let sql = "SELECT um.*, u.name as userName FROM user_modules um JOIN users u ON u.id = um.user_id";
    const params: any[] = [];
    if (moduleKey) { sql += " WHERE um.module_key = ?"; params.push(moduleKey); }
    sql += " ORDER BY u.name, um.module_key";
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/user-modules/toggle', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { userId, moduleKey, add } = req.body as any;
    if (add) {
      await pool.execute("INSERT IGNORE INTO user_modules (id, user_id, module_key) VALUES (?, ?, ?)", [uuid(), userId, moduleKey]);
    } else {
      await pool.execute("DELETE FROM user_modules WHERE user_id = ? AND module_key = ?", [userId, moduleKey]);
    }
    if (io) io.emit('modules:update', { userId, moduleKey, add });
    reply.send({ success: true });
  });

  // ========== MY MODULES ==========
  app.get('/my-modules', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    if (req.user.role === 'admin') return reply.send(MODULES);
    // Settings check: which modules are enabled globally
    const [settings] = await pool.execute("SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE '%_enabled'");
    const sMap: Record<string, string> = {};
    (settings as any[]).forEach((s: any) => sMap[s.setting_key] = s.setting_value);
    const isEnabled = (m: string) => sMap[m + '_enabled'] !== 'false';

    const [teamRows] = await pool.execute(
      "SELECT DISTINCT tm.module_key FROM team_modules tm JOIN team_members tmb ON tmb.team_id = tm.team_id WHERE tmb.user_id = ?",
      [req.user.id]
    );
    const [userRows] = await pool.execute("SELECT module_key FROM user_modules WHERE user_id = ?", [req.user.id]);
    const modules = new Set((teamRows as any[]).map((r: any) => r.module_key));
    (userRows as any[]).forEach((r: any) => modules.add(r.module_key));
    ['dashboard', 'reports'].forEach(m => modules.add(m));
    const result = MODULES.filter(m => modules.has(m) && isEnabled(m));
    reply.send(result);
  });

  // ========== ACTIVITY LOGS ==========
  app.get('/activity-logs', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const limit = Math.min(Number((req.query as any).limit) || 50, 200);
    const [rows] = await pool.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?", [limit]);
    reply.send(rows);
  });

  // ========== SYSTEM SETTINGS ==========
  app.get('/settings', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute("SELECT * FROM system_settings ORDER BY setting_key");
    reply.send(rows);
  });

  app.put('/settings/:key', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { key } = req.params as any;
    const { value } = req.body as any;
    await pool.execute("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [key, String(value)]);
    await logActivity(req.user.id, 'update', 'settings', key, 'Đổi ' + key + ' = ' + value);
    if (io) io.emit('settings:update', { key, value });
    reply.send({ success: true });
  });

  // ========== TEAM TABLE PERMS (B1-B4) ==========
  app.get('/team-table-perms', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute(
      "SELECT tp.*, t.name as teamName FROM team_table_perms tp JOIN teams t ON t.id = tp.team_id ORDER BY t.name, tp.table_key"
    );
    reply.send(rows);
  });

  app.post('/team-table-perms/toggle', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { teamId, tableKey, add } = req.body as any;
    const [teams] = await pool.execute("SELECT name FROM teams WHERE id = ?", [teamId]);
    const teamName = (teams as any[])[0]?.name || teamId;
    if (add) {
      await pool.execute("INSERT IGNORE INTO team_table_perms (id, team_id, table_key) VALUES (?, ?, ?)", [uuid(), teamId, tableKey]);
      await logActivity(req.user.id, 'grant', 'table', teamName + ' ' + tableKey, 'Cấp quyền sửa ' + tableKey);
    } else {
      await pool.execute("DELETE FROM team_table_perms WHERE team_id = ? AND table_key = ?", [teamId, tableKey]);
      await logActivity(req.user.id, 'revoke', 'table', teamName + ' ' + tableKey, 'Thu hồi quyền sửa ' + tableKey);
    }
    if (io) io.emit('modules:update', { teamId, tableKey, add, kind: 'table' });
    reply.send({ success: true });
  });

  app.get('/my-table-perms', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    if (req.user.role === 'admin') return reply.send(['b1','b2','b3','b4']);
    // Hợp: team perms ∪ user perms (user được cấp thêm riêng)
    const [teamRows] = await pool.execute(
      "SELECT DISTINCT tp.table_key FROM team_table_perms tp JOIN team_members tmb ON tmb.team_id = tp.team_id WHERE tmb.user_id = ?",
      [req.user.id]
    );
    const [userRows] = await pool.execute("SELECT table_key FROM user_table_perms WHERE user_id = ?", [req.user.id]);
    const tables = new Set((teamRows as any[]).map((r: any) => r.table_key));
    (userRows as any[]).forEach((r: any) => tables.add(r.table_key));
    reply.send(ALL_TABLES.filter(t => tables.has(t)));
  });

  // ========== USER TABLE PERMS (B1-B4 per person) ==========
  app.get('/user-table-perms', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute(
      "SELECT up.*, u.name as userName FROM user_table_perms up JOIN users u ON u.id = up.user_id ORDER BY u.name, up.table_key"
    );
    reply.send(rows);
  });

  app.post('/user-table-perms/toggle', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { userId, tableKey, add } = req.body as any;
    if (add) {
      await pool.execute("INSERT IGNORE INTO user_table_perms (id, user_id, table_key) VALUES (?, ?, ?)", [uuid(), userId, tableKey]);
    } else {
      await pool.execute("DELETE FROM user_table_perms WHERE user_id = ? AND table_key = ?", [userId, tableKey]);
    }
    if (io) io.emit('modules:update', { userId, tableKey, add, kind: 'userTable' });
    reply.send({ success: true });
  });
}

