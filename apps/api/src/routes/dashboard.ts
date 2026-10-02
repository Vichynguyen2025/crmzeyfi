import { FastifyInstance } from 'fastify';
import { db, pool } from '../db/index';
import { teams, dailyReports, tasks, customers, adCosts, teamMembers, teamActuals, teamKpis } from '../db/schema';
import { eq, between, and, sql } from 'drizzle-orm';

export default async function (app: FastifyInstance) {
  app.get('/dashboard', async (req, reply) => {
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const date = q.date || '';
    // Derive from/to from month or date
    const from = date ? date : month + '-01';
    const to = date ? date : (() => {
      const d = new Date(month + '-01');
      d.setMonth(d.getMonth() + 1);
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0,10);
    })();

    // Total users
    const [totalUsers] = await pool.execute("SELECT COUNT(*) as c FROM users");
    const userCount = (totalUsers as any[])[0]?.c || 0;

    // Team list with dashboard data
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
      // Actual orders from team_actuals
      const [actualOrders] = await pool.execute("SELECT COALESCE(SUM(actual_orders),0) as o FROM team_actuals WHERE team_id = ? AND actual_orders > 0 AND month = ?", [team.id, month]);
      const [actualCosts] = await pool.execute("SELECT COALESCE(SUM(fixed_cost),0) as c FROM team_actuals WHERE team_id = ? AND month = ?", [team.id, month]);
      // KPI target orders
      const [kpiOrders] = await pool.execute("SELECT COALESCE(SUM(monthly_orders),0) as o FROM team_kpis WHERE team_id = ? AND month = ?", [team.id, month]);
      result.push({
        id: team.id, name: team.name, color: team.color,
        reportCount: (rc as any).count,
        tasks: Object.fromEntries(taskRows.map((t: any) => [t.status, t.count])),
        customerCount: (cc as any).count,
        adCostTotal: (ac as any).total,
        memberCount: (mc as any).count,
        actualOrders: (actualOrders as any[])[0]?.o || 0,
        actualCosts: (actualCosts as any[])[0]?.c || 0,
        kpiOrders: (kpiOrders as any[])[0]?.o || 0,
      });
    }

    // Overall stats
    const [tr] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(dailyReports).where(between(dailyReports.date, from, to));
    const [tc] = await db.select({ count: sql`COUNT(*)`.mapWith(Number) }).from(customers);
    const [ta] = await db.select({ total: sql`COALESCE(SUM(amount),0)`.mapWith(Number) }).from(adCosts).where(between(adCosts.date, from, to));
    const [totalActualOrders] = await pool.execute("SELECT COALESCE(SUM(actual_orders),0) as o FROM team_actuals WHERE actual_orders > 0 AND month = ?", [month]);
    const [totalKpi] = await pool.execute("SELECT COALESCE(SUM(monthly_orders),0) as o FROM team_kpis WHERE month = ?", [month]);
    const [productCount] = await pool.execute("SELECT COUNT(*) as c FROM products");
    const [channelCount] = await pool.execute("SELECT COUNT(*) as c FROM media_channels");
    const [totalCostActual] = await pool.execute("SELECT COALESCE(SUM(fixed_cost),0) as c FROM team_actuals WHERE month = ?", [month]);

    // Daily-perf totals for selected date or month
    let cardQuery, cardParams: any[];
    if (date) {
      cardQuery = "SELECT COALESCE(SUM(orders),0) as o, COALESCE(SUM(total_cost),0) as c, COALESCE(SUM(messages),0) as m, COALESCE(SUM(reach),0) as r, COALESCE(SUM(clicks),0) as cl, COALESCE(SUM(cancelled_orders),0) as co FROM team_daily_perf WHERE date = ?";
      cardParams = [date];
    } else {
      cardQuery = "SELECT COALESCE(SUM(orders),0) as o, COALESCE(SUM(total_cost),0) as c, COALESCE(SUM(messages),0) as m, COALESCE(SUM(reach),0) as r, COALESCE(SUM(clicks),0) as cl, COALESCE(SUM(cancelled_orders),0) as co FROM team_daily_perf WHERE month = ?";
      cardParams = [month];
    }
    const [tdOrders] = await pool.execute(cardQuery, cardParams);
    // Activity log (last 10)
    const [logs] = await pool.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10");

    reply.send({ 
      teams: result, 
      overall: { 
        reportCount: (tr as any).count, 
        customerCount: (tc as any).count, 
        adCostTotal: (ta as any).total,
        userCount,
        actualOrders: (totalActualOrders as any[])[0]?.o || 0,
        kpiOrders: (totalKpi as any[])[0]?.o || 0,
        kpiPct: (totalKpi as any[])[0]?.o > 0 ? Math.round((totalActualOrders as any[])[0]?.o / (totalKpi as any[])[0]?.o * 100) : 0,
        actualCosts: (totalCostActual as any[])[0]?.c || 0,
        productCount: (productCount as any[])[0]?.c || 0,
        channelCount: (channelCount as any[])[0]?.c || 0,
        todayOrders: (tdOrders as any[])[0]?.o || 0,
        todayCost: (tdOrders as any[])[0]?.c || 0,
        todayMessages: (tdOrders as any[])[0]?.m || 0,
        todayReach: (tdOrders as any[])[0]?.r || 0,
        todayClicks: (tdOrders as any[])[0]?.cl || 0,
        todayCancelled: (tdOrders as any[])[0]?.co || 0,
      },
      activityLogs: (logs as any[]).map((l: any) => ({
        ...l,
        timeAgo: Math.floor((Date.now() - new Date(l.created_at).getTime()) / 60000) + 'p trước'
      }))
    });
  });
}