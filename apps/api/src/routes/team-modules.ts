import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

const MODULES = ['dashboard', 'users', 'teams', 'drive', 'channels', 'products', 'marketing', 'reports', 'customers', 'seo'];

export default async function (app: FastifyInstance) {
  // Get all modules with their team assignments
  app.get('/team-modules', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute(
      "SELECT tm.*, t.name as teamName FROM team_modules tm JOIN teams t ON t.id = tm.team_id ORDER BY t.name, tm.module_key"
    );
    reply.send(rows);
  });

  // Get modules for a specific team
  app.get('/team-modules/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const [rows] = await pool.execute("SELECT module_key FROM team_modules WHERE team_id = ?", [teamId]);
    reply.send((rows as any[]).map((r: any) => r.module_key));
  });

  // Check user's accessible modules
  app.get('/my-modules', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    if (req.user.role === 'admin') return reply.send(MODULES);
    const [rows] = await pool.execute(
      "SELECT tm.module_key FROM team_modules tm JOIN team_members tmb ON tmb.team_id = tm.team_id WHERE tmb.user_id = ?",
      [req.user.id]
    );
    const modules = (rows as any[]).map((r: any) => r.module_key);
    // Always include dashboard and reports
    ['dashboard', 'reports'].forEach(m => { if (!modules.includes(m)) modules.push(m); });
    reply.send(modules);
  });

  // Toggle a module for a team
  app.post('/team-modules/toggle', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { teamId, moduleKey, add } = req.body as any;
    if (add) {
      await pool.execute("INSERT IGNORE INTO team_modules (id, team_id, module_key) VALUES (?, ?, ?)", [uuid(), teamId, moduleKey]);
    } else {
      await pool.execute("DELETE FROM team_modules WHERE team_id = ? AND module_key = ?", [teamId, moduleKey]);
    }
    // Emit realtime event
    const io = (app as any).io;
    if (io) io.emit('modules:update', { teamId, moduleKey, add });
    reply.send({ success: true });
  });

  // Check if user has access to a module
  app.post('/check-module', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { moduleKey } = req.body as any;
    if (req.user.role === 'admin') return reply.send({ allowed: true });
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as cnt FROM team_modules tm JOIN team_members tmb ON tmb.team_id = tm.team_id WHERE tmb.user_id = ? AND tm.module_key = ?",
      [req.user.id, moduleKey]
    );
    const cnt = (rows as any[])[0]?.cnt || 0;
    reply.send({ allowed: cnt > 0 || ['dashboard', 'reports'].includes(moduleKey) });
  });
}