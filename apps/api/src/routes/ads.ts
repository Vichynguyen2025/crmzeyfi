import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/ads', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const query = req.query as any;
    const month = query.month || new Date().toISOString().slice(0, 7);
    const groupBy = query.groupBy || 'day';
    let sql, params: any[] = [];

    if (groupBy === 'day') {
      sql = "SELECT a.id, a.user_id, a.date, DATE_FORMAT(a.date, '%Y-%m-%d') as periodLabel, a.platform, a.cost_with_tax, a.revenue, a.orders, a.sims, a.impressions, a.clicks, a.month, u.name as userName FROM ads a LEFT JOIN users u ON u.id COLLATE utf8mb4_unicode_ci = a.user_id WHERE a.month = ?";
      params = [month];
    } else if (groupBy === 'week') {
      sql = "SELECT a.user_id, CONCAT('Tuần ', WEEK(a.date, 1)) as periodLabel, a.platform, SUM(a.cost_with_tax) as cost_with_tax, SUM(a.revenue) as revenue, SUM(a.orders) as orders, SUM(a.sims) as sims, SUM(a.impressions) as impressions, SUM(a.clicks) as clicks, a.month, u.name as userName FROM ads a LEFT JOIN users u ON u.id COLLATE utf8mb4_unicode_ci = a.user_id WHERE a.month = ?";
      params = [month];
    } else {
      sql = "SELECT a.user_id, a.month as periodLabel, a.platform, SUM(a.cost_with_tax) as cost_with_tax, SUM(a.revenue) as revenue, SUM(a.orders) as orders, SUM(a.sims) as sims, SUM(a.impressions) as impressions, SUM(a.clicks) as clicks, a.month, u.name as userName FROM ads a LEFT JOIN users u ON u.id COLLATE utf8mb4_unicode_ci = a.user_id WHERE a.month = ?";
      params = [month];
    }

    if (query.platform) { sql += " AND a.platform = ?"; params.push(query.platform); }
    if (query.userId) { sql += " AND a.user_id = ?"; params.push(query.userId); }

    if (groupBy === 'day') sql += " ORDER BY a.date DESC";
    else if (groupBy === 'week') sql += " GROUP BY WEEK(a.date, 1), a.user_id, a.platform ORDER BY periodLabel DESC";
    else sql += " GROUP BY a.user_id, a.platform ORDER BY a.platform";

    try { const [rows] = await pool.execute(sql, params); reply.send(rows); }
    catch (e: any) { reply.status(500).send({ error: 'Query failed', detail: e.message }); }
  });

  app.post('/ads', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const body = req.body as any;
    const id = uuid();
    const month = (body.date || '').slice(0, 7) || new Date().toISOString().slice(0, 7);
    const date = body.date || new Date().toISOString().slice(0, 10);
    await pool.execute(
      "INSERT INTO ads (id, user_id, date, platform, cost_with_tax, revenue, orders, sims, impressions, clicks, month) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [id, body.userId || req.user.id || '', date, body.platform || '', body.costWithTax || 0, body.revenue || 0, body.orders || 0, body.sims || 0, body.impressions || 0, body.clicks || 0, month]
    );
    reply.send({ id, success: true });
  });

  app.put('/ads/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const body = req.body as any;
    const fields: string[] = []; const params: any[] = [];
    for (const [key, col] of Object.entries({ date:'date', platform:'platform', cost_with_tax:'cost_with_tax', costWithTax:'cost_with_tax', revenue:'revenue', orders:'orders', sims:'sims', impressions:'impressions', clicks:'clicks' } as any)) {
      if (body[key] !== undefined) { fields.push(col + ' = ?'); params.push(body[key]); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute("UPDATE ads SET " + fields.join(', ') + " WHERE id = ?", params);
    reply.send({ success: true });
  });

  app.delete('/ads/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM ads WHERE id = ?", [id]);
    reply.send({ success: true });
  });
}