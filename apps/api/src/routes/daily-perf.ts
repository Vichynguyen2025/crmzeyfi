import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/daily-perf/:teamId/:userId', async (req, reply) => {
    const { teamId, userId } = req.params as any;
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const product = q.product || '';
    const dateFrom = q.dateFrom || '';
    const dateTo = q.dateTo || '';
    let sql = "SELECT * FROM team_daily_perf WHERE team_id = ? AND user_id = ? AND month = ?";
    const params: any[] = [teamId, userId, month];
    if (dateFrom) { sql += " AND date >= ?"; params.push(dateFrom); }
    if (dateTo) { sql += " AND date <= ?"; params.push(dateTo); }
    if (product) { sql += " AND product = ?"; params.push(product); }
    sql += " ORDER BY date ASC";
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/daily-perf/:teamId/:userId', async (req, reply) => {
    const { teamId, userId } = req.params as any;
    const { rows, month } = req.body as any;
    const m = month || new Date().toISOString().slice(0, 7);
    // Delete existing for this team+user+month
    await pool.execute("DELETE FROM team_daily_perf WHERE team_id = ? AND user_id = ? AND month = ?", [teamId, userId, m]);
    for (const r of (rows || [])) {
      if (!r.date) continue;
      const id = uuid();
      const fmtDate = r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0];
      await pool.execute(
        "INSERT INTO team_daily_perf (id, team_id, user_id, product, date, total_cost, reach, clicks, messages, orders, cancelled_orders, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, teamId, userId, r.product || '', fmtDate, r.totalCost || 0, r.reach || 0, r.clicks || 0, r.messages || 0, r.orders || 0, r.cancelledOrders || 0, m]
      );
    }
    // Recalculate actuals for this team+month
    await recalcActuals(teamId, m);
    reply.send({ success: true });
  });
}

async function recalcActuals(teamId: string, month: string) {
  await pool.execute("DELETE FROM team_actuals WHERE team_id = ? AND month = ?", [teamId, month]);
  const [summary] = await pool.execute(
    "SELECT user_id, product, SUM(orders) as total_orders, SUM(total_cost) as total_cost FROM team_daily_perf WHERE team_id = ? AND month = ? GROUP BY user_id, product",
    [teamId, month]
  );
  for (const row of (summary as any[])) {
    const id = uuid();
    const totalOrders = row.total_orders || 0;
    const totalCost = row.total_cost || 0;
    const costPerOrder = totalOrders > 0 ? Math.round(totalCost / totalOrders) : 0;
    await pool.execute(
      "INSERT INTO team_actuals (id, team_id, user_id, product, actual_orders, fixed_cost, cost_per_order, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, teamId, row.user_id, row.product || '', totalOrders, totalCost, costPerOrder, month]
    );
  }
}