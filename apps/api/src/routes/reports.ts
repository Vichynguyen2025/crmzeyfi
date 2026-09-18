import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db, pool } from '../db/index';
import { reportColumns, dailyReports } from '../db/schema';
import { eq, between, and, sql } from 'drizzle-orm';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  // Columns CRUD (admin realtime)
  app.get('/reports/columns', async (req, reply) => {
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    reply.send(cols);
  });

  app.post('/reports/columns', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { name, type, position } = req.body as any;
    const id = uuid();
    await db.insert(reportColumns).values({ id, name, type: type || 'text', position: position || 0 });
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    io.emit('columns:updated', cols);
    reply.send({ id, ...req.body });
  });

  app.put('/reports/columns/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    const { name, type, position } = req.body as any;
    await db.update(reportColumns).set({ name, type, position }).where(eq(reportColumns.id, id));
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    io.emit('columns:updated', cols);
    reply.send(cols);
  });

  app.delete('/reports/columns/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await db.delete(reportColumns).where(eq(reportColumns.id, id));
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    io.emit('columns:updated', cols);
    reply.send(cols);
  });

  // Daily reports
  app.get('/reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const query = req.query as any;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
    
    // Admin sees all, member sees only own reports
    const [rows] = await pool.execute(
      "SELECT dr.*, u.name as user_name, u.avatar as user_avatar FROM daily_reports dr JOIN users u ON u.id = dr.user_id " +
      (isAdmin ? "" : "WHERE dr.user_id = ? ") +
      "ORDER BY dr.date DESC, dr.created_at DESC",
      isAdmin ? [] : [req.user.id]
    );
    reply.send(rows);
  });

  app.post('/reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { date, teamId, data } = req.body as any;
    const id = uuid();
    const tid = teamId || null;
    await db.insert(dailyReports).values({ id, userId: req.user.id, teamId: tid, date, data });
    
    // Get user info for realtime broadcast
    const [u] = await pool.execute("SELECT name, avatar FROM users WHERE id = ?", [req.user.id]);
    const user = (u as any[])[0] || { name: req.user.email };
    io.emit('report:new', { id, userId: req.user.id, teamId, date, data, userName: user.name });
    reply.send({ id, success: true });
  });
  app.delete('/reports/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await db.delete(dailyReports).where(eq(dailyReports.id, id));
    io.emit('report:deleted', { id });
    reply.send({ success: true });
  });
}