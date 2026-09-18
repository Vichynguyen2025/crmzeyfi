import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index';
import { tasks, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  app.get('/tasks', async (req, reply) => {
    const q = req.query as any;
    const conds = [];
    if (q.teamId) conds.push(eq(tasks.teamId, q.teamId));
    if (q.status) conds.push(eq(tasks.status, q.status));
    const list = await db.select({
      id: tasks.id, title: tasks.title, description: tasks.description,
      teamId: tasks.teamId, assigneeId: tasks.assigneeId,
      status: tasks.status, priority: tasks.priority, dueDate: tasks.dueDate,
      position: tasks.position, assigneeName: users.name,
    }).from(tasks).leftJoin(users, eq(users.id, tasks.assigneeId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(tasks.position);
    reply.send(list);
  });

  app.post('/tasks', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { title, teamId, assigneeId, status, priority, dueDate } = req.body as any;
    const id = uuid();
    const tid = teamId || null;
    await db.insert(tasks).values({ id, title, teamId: tid, assigneeId, status: status || 'todo', priority: priority || 'medium', dueDate, createdBy: req.user.id });
    io.emit('task:new', { id, title, teamId, status });
    reply.send({ id, success: true });
  });

  app.put('/tasks/:id/status', async (req, reply) => {
    const { id } = req.params as any;
    const { status, position } = req.body as any;
    await db.update(tasks).set({ status, position }).where(eq(tasks.id, id));
    io.emit('task:updated', { id, status, position });
    reply.send({ success: true });
  });

  app.put('/tasks/:id', async (req, reply) => {
    const { id } = req.params as any;
    await db.update(tasks).set(req.body as any).where(eq(tasks.id, id));
    io.emit('task:updated', { id, ...req.body });
    reply.send({ success: true });
  });

  app.delete('/tasks/:id', async (req, reply) => {
    const { id } = req.params as any;
    await db.delete(tasks).where(eq(tasks.id, id));
    io.emit('task:deleted', { id });
    reply.send({ success: true });
  });
}