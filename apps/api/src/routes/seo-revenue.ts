import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/seo-revenue/:userId', async (req, reply) => {
    const { userId } = req.params as any;
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const channel = q.channel || '';
    const dateFrom = q.dateFrom || '';
    const dateTo = q.dateTo || '';

    let sql = "SELECT * FROM seo_revenue WHERE user_id = ?";
    const params: any[] = [userId];
    // Use month filter only when no specific date range is provided
    if (!dateFrom && !dateTo) {
      sql += " AND month = ?";
      params.push(month);
    }
    if (channel) { sql += " AND channel = ?"; params.push(channel); }
    if (dateFrom) { sql += " AND date >= ?"; params.push(dateFrom); }
    if (dateTo) { sql += " AND date <= ?"; params.push(dateTo); }
    sql += " ORDER BY date ASC";

    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/seo-revenue/:userId', async (req, reply) => {
    const { userId } = req.params as any;
    const { rows, month } = req.body as any;
    const m = month || new Date().toISOString().slice(0, 7);

    await pool.execute("DELETE FROM seo_revenue WHERE user_id = ? AND month = ?", [userId, m]);
    for (const r of (rows || [])) {
      if (!r.date) continue;
      const id = uuid();
      const fmtDate = r.date.split('T')[0] || r.date;
      await pool.execute(
        "INSERT INTO seo_revenue (id, user_id, date, channel, orders, revenue, cost, impressions, clicks, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, userId, fmtDate, r.channel || '', r.orders || 0, r.revenue || 0, r.cost || 0, r.impressions || 0, r.clicks || 0, m]
      );
    }
    reply.send({ success: true });
  });

  // Cross-user summary
  app.get('/seo-revenue-summary', async (req, reply) => {
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const groupBy = q.groupBy || 'day';
    const dateFrom = q.dateFrom || '';
    const dateTo = q.dateTo || '';

    let where = "WHERE r.month = ?";
    const params: any[] = [month];
    if (dateFrom) { where += " AND r.date >= ?"; params.push(dateFrom); }
    if (dateTo) { where += " AND r.date <= ?"; params.push(dateTo); }

    let select, groupCol;
    if (groupBy === 'day') select = "DATE_FORMAT(r.date, '%Y-%m-%d') as periodLabel, r.date";
    else if (groupBy === 'week') select = "CONCAT('Tuần ', WEEK(r.date, 1)) as periodLabel";
    else select = "r.month as periodLabel";

    const [rows] = await pool.execute(
      `SELECT ${select}, SUM(r.orders) as totalOrders, SUM(r.revenue) as totalRevenue, SUM(r.cost) as totalCost, SUM(r.impressions) as totalImpressions, SUM(r.clicks) as totalClicks FROM seo_revenue r GROUP BY ${groupBy === 'day' ? 'r.date' : groupBy === 'week' ? 'WEEK(r.date, 1)' : 'r.month'} ORDER BY ${groupBy === 'day' ? 'r.date' : 'r.month'} DESC`,
      params
    );
    reply.send(rows);
  });
}