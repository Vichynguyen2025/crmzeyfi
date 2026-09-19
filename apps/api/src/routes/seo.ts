import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  // =========== SEO PLANS ===========
  app.get('/seo/plans', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = `SELECT p.*, u.name as assigneeName FROM seo_plans p LEFT JOIN users u ON u.id = p.assignee_id WHERE 1=1`;
    const params: any[] = [];
    if (q.period) { sql += ' AND p.period = ?'; params.push(q.period); }
    if (q.employeeId) { sql += ' AND p.assignee_id = ?'; params.push(q.employeeId); }
    if (q.status) { sql += ' AND p.status = ?'; params.push(q.status); }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/seo/plans', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const b = req.body as any;
    const id = uuid();
    await pool.execute(
      `INSERT INTO seo_plans (id, period, objective, kpi, task, assignee_id, deadline, planned_qty, status, note) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, b.period || '', b.objective || '', b.kpi || '', b.task, b.assigneeId || null, b.deadline || null, b.plannedQty || 0, b.status || 'not_started', b.note || '']
    );
    io.emit('seo:update', { id, action: 'create' });
    reply.send({ success: true, id });
  });

  app.put('/seo/plans/:id', async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const fields: string[] = []; const params: any[] = [];
    for (const key of ['period', 'objective', 'kpi', 'task', 'assigneeId', 'deadline', 'plannedQty', 'completedQty', 'status', 'note']) {
      if (body[key] !== undefined) { fields.push(key.replace(/([A-Z])/g, '_$1').toLowerCase() + ' = ?'); params.push(body[key]); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute("UPDATE seo_plans SET " + fields.join(', ') + " WHERE id = ?", params);
    io.emit('seo:update', { id, action: 'update' });
    reply.send({ success: true });
  });

  app.delete('/seo/plans/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM seo_plans WHERE id = ?", [id]);
    io.emit('seo:update', { id, action: 'delete' });
    reply.send({ success: true });
  });

  // =========== SEO WORK REPORTS ===========
  app.get('/seo/work-reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = `SELECT w.*, u.name as employeeName, p.task as planTask FROM seo_work_reports w LEFT JOIN users u ON u.id = w.employee_id LEFT JOIN seo_plans p ON p.id = w.plan_id WHERE 1=1`;
    const params: any[] = [];
    if (q.dateFrom) { sql += ' AND w.date >= ?'; params.push(q.dateFrom); }
    if (q.dateTo) { sql += ' AND w.date <= ?'; params.push(q.dateTo); }
    if (q.category) { sql += ' AND w.category = ?'; params.push(q.category); }
    if (q.employeeId) { sql += ' AND w.employee_id = ?'; params.push(q.employeeId); }
    if (q.status) { sql += ' AND w.status = ?'; params.push(q.status); }
    sql += ' ORDER BY w.date DESC, w.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/seo/work-reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const b = req.body as any;
    const id = uuid();
    await pool.execute(
      `INSERT INTO seo_work_reports (id, date, employee_id, category, task, url, qty, status, completion_percent, plan_id, note) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, b.date, b.employeeId || req.user.id, b.category || '', b.task, b.url || '', b.qty || 0, b.status || 'pending', b.completionPercent || 0, b.planId || null, b.note || '']
    );
    io.emit('seo:update', { id, action: 'create' });
    reply.send({ success: true, id });
  });

  app.post('/seo/work-reports/batch', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { rows } = req.body as any;
    if (!rows || !rows.length) return reply.send({ success: true, count: 0 });
    for (const r of rows) {
      const id = uuid();
      await pool.execute(
        `INSERT INTO seo_work_reports (id, date, employee_id, category, task, url, qty, status, completion_percent, plan_id, note) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, r.date, r.employeeId || req.user.id, r.category || '', r.task, r.url || '', r.qty || 0, r.status || 'pending', r.completionPercent || 0, r.planId || null, r.note || '']
      );
    }
    io.emit('seo:update', { action: 'batch' });
    reply.send({ success: true, count: rows.length });
  });

  app.put('/seo/work-reports/:id', async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const fields: string[] = []; const params: any[] = [];
    for (const key of ['date', 'category', 'task', 'url', 'qty', 'status', 'completionPercent', 'planId', 'note']) {
      if (body[key] !== undefined) { fields.push(key.replace(/([A-Z])/g, '_$1').toLowerCase() + ' = ?'); params.push(body[key]); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute("UPDATE seo_work_reports SET " + fields.join(', ') + " WHERE id = ?", params);
    io.emit('seo:update', { id, action: 'update' });
    reply.send({ success: true });
  });

  app.delete('/seo/work-reports/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM seo_work_reports WHERE id = ?", [id]);
    io.emit('seo:update', { id, action: 'delete' });
    reply.send({ success: true });
  });

  // =========== SEO RESULTS ===========
  app.get('/seo/results', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = `SELECT * FROM seo_results WHERE 1=1`;
    const params: any[] = [];
    if (q.dateFrom) { sql += ' AND date >= ?'; params.push(q.dateFrom); }
    if (q.dateTo) { sql += ' AND date <= ?'; params.push(q.dateTo); }
    if (q.keyword) { sql += ' AND keyword LIKE ?'; params.push('%' + q.keyword + '%'); }
    sql += ' ORDER BY date DESC, created_at DESC';
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/seo/results', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const b = req.body as any;
    const prev = b.prevRank || 0;
    const curr = b.currRank || 0;
    const ctr = b.impressions > 0 ? Math.round((b.clicks || 0) / b.impressions * 10000) / 100 : 0;
    const id = uuid();
    await pool.execute(
      `INSERT INTO seo_results (id, date, keyword, url, prev_rank, curr_rank, clicks, impressions, ctr, traffic, leads, orders, revenue) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, b.date, b.keyword, b.url || '', prev, curr, b.clicks || 0, b.impressions || 0, ctr, b.traffic || 0, b.leads || 0, b.orders || 0, b.revenue || 0]
    );
    io.emit('seo:update', { id, action: 'create' });
    reply.send({ success: true, id });
  });

  app.put('/seo/results/:id', async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    if (body.clicks !== undefined && body.impressions !== undefined) {
      body.ctr = body.impressions > 0 ? Math.round((body.clicks || 0) / body.impressions * 10000) / 100 : 0;
    }
    const fields: string[] = []; const params: any[] = [];
    for (const key of ['date', 'keyword', 'url', 'prevRank', 'currRank', 'clicks', 'impressions', 'ctr', 'traffic', 'leads', 'orders', 'revenue']) {
      if (body[key] !== undefined) { fields.push(key.replace(/([A-Z])/g, '_$1').toLowerCase() + ' = ?'); params.push(body[key]); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute("UPDATE seo_results SET " + fields.join(', ') + " WHERE id = ?", params);
    io.emit('seo:update', { id, action: 'update' });
    reply.send({ success: true });
  });

  app.delete('/seo/results/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM seo_results WHERE id = ?", [id]);
    io.emit('seo:update', { id, action: 'delete' });
    reply.send({ success: true });
  });

  // =========== DASHBOARD ===========
  app.get('/seo/dashboard', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    const from = q.from || '1970-01-01';
    const to = q.to || '2099-12-31';

    const [workStats] = await pool.execute(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as done, SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as inProg, SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END) as overdue, AVG(completion_percent) as avgPct FROM seo_work_reports WHERE date >= ? AND date <= ?`,
      [from, to]
    );
    const [kwStats] = await pool.execute(
      `SELECT COUNT(*) as total, SUM(CASE WHEN (curr_rank IS NOT NULL AND prev_rank IS NOT NULL AND curr_rank < prev_rank) THEN 1 ELSE 0 END) as up, SUM(CASE WHEN (curr_rank IS NOT NULL AND prev_rank IS NOT NULL AND curr_rank > prev_rank) THEN 1 ELSE 0 END) as down, SUM(CASE WHEN curr_rank IS NOT NULL AND curr_rank <= 3 THEN 1 ELSE 0 END) as top3, SUM(CASE WHEN curr_rank IS NOT NULL AND curr_rank <= 10 THEN 1 ELSE 0 END) as top10, SUM(CASE WHEN curr_rank IS NOT NULL AND curr_rank <= 20 THEN 1 ELSE 0 END) as top20 FROM seo_results WHERE date >= ? AND date <= ?`,
      [from, to]
    );
    const [trafficStats] = await pool.execute(
      `SELECT COALESCE(SUM(clicks),0) as clicks, COALESCE(SUM(impressions),0) as impressions, COALESCE(SUM(traffic),0) as traffic, COALESCE(SUM(leads),0) as leads, COALESCE(SUM(orders),0) as orders, COALESCE(SUM(revenue),0) as revenue FROM seo_results WHERE date >= ? AND date <= ?`,
      [from, to]
    );

    const ws = (workStats as any[])[0] || {};
    const ks = (kwStats as any[])[0] || {};
    const ts = (trafficStats as any[])[0] || {};
    const avgCtr = ts.impressions > 0 ? Math.round((ts.clicks || 0) / ts.impressions * 10000) / 100 : 0;

    reply.send({
      totalTasks: Number(ws.total) || 0, completedTasks: Number(ws.done) || 0,
      inProgressTasks: Number(ws.inProg) || 0, overdueTasks: Number(ws.overdue) || 0,
      completionRate: ws.avgPct ? Math.round(Number(ws.avgPct)) : 0,
      totalKeywords: Number(ks.total) || 0, keywordsUp: Number(ks.up) || 0,
      keywordsDown: Number(ks.down) || 0, top3: Number(ks.top3) || 0,
      top10: Number(ks.top10) || 0, top20: Number(ks.top20) || 0,
      totalClicks: Number(ts.clicks) || 0, totalImpressions: Number(ts.impressions) || 0,
      avgCtr, totalTraffic: Number(ts.traffic) || 0,
      totalLeads: Number(ts.leads) || 0, totalOrders: Number(ts.orders) || 0,
      totalRevenue: Number(ts.revenue) || 0,
    });
  });
}