import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index';
import { adCosts, teams } from '../db/schema';
import { eq, between } from 'drizzle-orm';

export default async function (app: FastifyInstance) {
  app.get('/ad-costs', async (req, reply) => {
    const q = req.query as any;
    const conds = [];
    if (q.teamId) conds.push(eq(adCosts.teamId, q.teamId));
    if (q.from && q.to) conds.push(between(adCosts.date, q.from, q.to));
    const list = await db.select().from(adCosts).orderBy(db.sql`date DESC`);
    reply.send(list);
  });
  app.post('/ad-costs', async (req, reply) => {
    const { teamId, date, platform, amount, description } = req.body as any;
    const id = uuid();
    await db.insert(adCosts).values({ id, teamId, date, platform, amount, description });
    reply.send({ id, success: true });
  });
}