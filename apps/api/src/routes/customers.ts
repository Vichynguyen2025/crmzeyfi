import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index';
import { customers, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  app.get('/customers', async (req, reply) => {
    const q = req.query as any;
    const conds = q.teamId ? [eq(customers.teamId, q.teamId)] : [];
    const list = await db.select({
      id: customers.id, name: customers.name, phone: customers.email,
      contactCount: customers.contactCount, status: customers.status,
      assigneeName: users.name,
    }).from(customers).leftJoin(users, eq(users.id, customers.assigneeId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(sql`contact_count DESC`);
    reply.send(list);
  });

  app.post('/customers', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, phone, teamId } = req.body as any;
    const id = uuid();
    await db.insert(customers).values({ id, name, phone, teamId, assigneeId: req.user.id });
    io.emit('customer:new', { id, name });
    reply.send({ id, success: true });
  });

  app.put('/customers/:id/contact', async (req, reply) => {
    const { id } = req.params as any;
    const { note } = req.body as any;
    const [c] = await db.select({ count: customers.contactCount }).from(customers).where(eq(customers.id, id));
    const cnt = (c?.count || 0) + 1;
    await db.update(customers).set({ contactCount: cnt, lastContact: new Date(), lastContactNote: note || '' }).where(eq(customers.id, id));
    io.emit('customer:updated', { id, contactCount: cnt });
    reply.send({ success: true, contactCount: cnt });
  });
}