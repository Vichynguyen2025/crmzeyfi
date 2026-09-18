import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index';
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
    const query = req.query as any;
    const conds = [];
    if (query.teamId) conds.push(eq(dailyReports.teamId, query.teamId));
    if (query.from && query.to) conds.push(between(dailyReports.date, query.from, query.to));
    if (query.date) conds.push(eq(dailyReports.date, query.date));
    const list = await db.select().from(dailyReports).where(conds.length ? and(...conds) : undefined)
      .orderBy(sql`date DESC, created_at DESC`);
    reply.send(list);
  });

  app.post('/reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { date, teamId, data } = req.body as any;
    const id = uuid();
    const tid = teamId || null;
    await db.insert(dailyReports).values({ id, userId: req.user.id, teamId: tid, date, data });
    io.emit('report:new', { id, userId: req.user.id, teamId, date, data });
    reply.send({ id, success: true });
  });
}