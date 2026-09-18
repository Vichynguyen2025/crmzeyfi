import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { teams, dailyReports, tasks, customers, adCosts, teamMembers } from '../db/schema';
import { eq, between, and, sql, count } from 'drizzle-orm';

export default async function (app: FastifyInstance) {
  app.get('/dashboard', async (req, reply) => {
    const q = req.query as any;
    const from = q.from || '2024-01-01';
    const to = q.to || '2099-12-31';

    const teamList = await db.select().from(teams);
    const result = [];
    for (const team of teamList) {
      const [rc] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(dailyReports)
        .where(and(eq(dailyReports.teamId, team.id), between(dailyReports.date, from, to)));
      const taskRows = await db.select({ status: tasks.status, count: sql`COUNT(*)`.mapWith(Number) })
        .from(tasks).where(eq(tasks.teamId, team.id)).groupBy(tasks.status);
      const [cc] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(customers).where(eq(customers.teamId, team.id));
      const [ac] = await db.select({ total: sql`COALESCE(SUM(amount),0)`.mapWith(Number) }).from(adCosts)
        .where(and(eq(adCosts.teamId, team.id), between(adCosts.date, from, to)));
      const [mc] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(teamMembers).where(eq(teamMembers.teamId, team.id));
      result.push({
        id: team.id, name: team.name, color: team.color,
        reportCount: rc.count,
        tasks: Object.fromEntries(taskRows.map((t: any) => [t.status, t.count])),
        customerCount: cc.count,
        adCostTotal: ac.total,
        memberCount: mc.count,
      });
    }
    const [tr] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(dailyReports).where(between(dailyReports.date, from, to));
    const [tc] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(customers);
    const [ta] = await db.select({ total: sql`COALESCE(SUM(amount),0)`.mapWith(Number) }).from(adCosts).where(between(adCosts.date, from, to));
    reply.send({ teams: result, overall: { reportCount: tr.count, customerCount: tc.count, adCostTotal: ta.total } });
  });
}