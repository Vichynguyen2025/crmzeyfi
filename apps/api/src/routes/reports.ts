import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db, pool } from '../db/index';
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
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const query = req.query as any;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
    const teamId = query.teamId || '';
    
    let whereClause = "WHERE dr.user_id = ?";
    const params: any[] = [req.user.id];
    if (teamId) { whereClause += " AND dr.team_id = ?"; params.push(teamId); }
    const { from, to } = query;
    if (from) { whereClause += " AND dr.date >= ?"; params.push(from); }
    if (to) { whereClause += " AND dr.date <= ?"; params.push(to); }
    
    const [rows] = await pool.execute(
      "SELECT dr.id, dr.user_id, dr.team_id, DATE_FORMAT(dr.date, '%Y-%m-%d') as date, dr.data, dr.created_at, dr.status, dr.feedback, u.name as user_name, u.avatar as user_avatar FROM daily_reports dr JOIN users u ON u.id = dr.user_id " +
      whereClause +
      " ORDER BY dr.date DESC, dr.created_at DESC",
      params
    );
    reply.send(rows);
  });

  app.post('/reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { date, teamId, data } = req.body as any;
    const id = uuid();
    const tid = teamId || null;
    await db.insert(dailyReports).values({ id, userId: req.user.id, teamId: tid, date, data });
    
    // Get user info for realtime broadcast
    const [u] = await pool.execute("SELECT name, avatar FROM users WHERE id = ?", [req.user.id]);
    const user = (u as any[])[0] || { name: req.user.email };
    io.emit('report:new', { id, userId: req.user.id, teamId, date, data, userName: user.name });
    reply.send({ id, success: true });
  });
  
  app.patch('/reports/:id/status', async (req, reply) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) return reply.status(403).send({ error: 'Only admin/manager' });
    const { id } = req.params as any;
    const { status, feedback } = req.body as any;
    if (!status || !['approved', 'rejected'].includes(status)) return reply.status(400).send({ error: 'Invalid status' });
    await pool.execute("UPDATE daily_reports SET status = ?, feedback = ? WHERE id = ?", [status, feedback || null, id]);
    const [rows] = await pool.execute("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as date_fmt FROM daily_reports WHERE id = ?", [id]);
    const report = (rows as any[])[0];
    if (report) {
      io.emit('report:status', { id, status, feedback, userId: report.user_id });
    }
    reply.send({ success: true, id, status, feedback });
  });

  app.put('/reports/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const { date, data } = req.body as any;
    await pool.execute("UPDATE daily_reports SET status = 'pending', feedback = NULL, date = ?, data = ? WHERE id = ? AND user_id = ?",
      [date, data, id, req.user.id]);
    const [rows] = await pool.execute("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as date_fmt FROM daily_reports WHERE id = ?", [id]);
    const report = (rows as any[])[0];
    if (report) io.emit('report:updated', { ...report, data: JSON.parse(report.data || '{}') });
    reply.send({ success: true, id });
  });

  app.delete('/reports/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await db.delete(dailyReports).where(eq(dailyReports.id, id));
    io.emit('report:deleted', { id });
    reply.send({ success: true });
  });

  app.get('/reports/received', async (req, reply) => {
    const { userId, from, to } = req.query as any;
    if (!userId) return reply.send([]);
    let sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as date_fmt FROM daily_reports";
    const params: any[] = [];
    const conditions: string[] = [];
    if (from) { conditions.push("date >= ?"); params.push(from); }
    if (to) { conditions.push("date <= ?"); params.push(to); }
    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY created_at DESC";
    const [allRows] = await pool.execute(sql, params);
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);

  });
  // ─── AI Summary ──────────────────────────────────
  app.post('/reports/analyze', async (req, reply) => {
    try {
      const { reports } = req.body as any;
      if (!reports || !Array.isArray(reports) || reports.length === 0) {
        return reply.status(400).send({ error: 'No reports to analyze' });
      }

      // Build prompt
      const reportText = reports.map((r: any, i: number) =>
        `${i+1}. **${r.userName||'Ai đó'}** (${r.dateStr||r.date||'?'}) - ${r.status||'pending'}\n` +
        `   Nội dung: ${(r.content||'').slice(0,500)}\n` +
        `   Khó khăn: ${(r.difficulties||'').slice(0,300)}\n` +
        `   Đề xuất: ${(r.suggestions||'').slice(0,300)}`
      ).join('\n');

      const prompt = `Bạn là trợ lý phân tích báo cáo công việc. Hãy phân tích ${reports.length} báo cáo sau đây và trả về bằng TIẾNG VIỆT, định dạng MARKDOWN với các phần:

## Tổng quan\n- Số lượng báo cáo: X\n- Số nhân sự: X\n- Khoảng thời gian: ...\n\n## Nội dung chính\nTóm tắt các điểm chính từ báo cáo...\n\n## Khó khăn & Thách thức\nCác khó khăn nổi bật...\n\n## Đề xuất\nCác đề xuất từ nhân sự...\n\n## Nhận xét\nNhận xét tổng quan về hiệu suất...

Dữ liệu báo cáo:\n${reportText}`;

      const apiKey = process.env.API_KEY_MANGAMENT_OPENROUTER;
      if (!apiKey) return reply.status(500).send({ error: 'API key not configured' });

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://zeyfi.cloud',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-v4-flash',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
        })
      });

      const data = await res.json() as any;
      if (data.error) return reply.status(500).send({ error: data.error.message || 'AI API error' });

      const summary = data?.choices?.[0]?.message?.content || '';
      reply.send({ summary, reportCount: reports.length });
    } catch (e: any) {
      reply.status(500).send({ error: e.message });
    }
  });
  // ─── AI Analysis History ──────────────────────────
  app.post('/reports/analysis-history', async (req, reply) => {
    try {
      if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
      const { reportCount, periodLabel, dateFrom, dateTo, summaryMd } = req.body as any;
      const id = crypto.randomUUID();
      await pool.execute(
        "INSERT INTO report_analysis_history (id, user_id, report_count, period_label, date_from, date_to, summary_md) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, req.user.id, reportCount || 0, periodLabel || '', dateFrom || null, dateTo || null, summaryMd || '']
      );
      reply.send({ success: true, id });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.get('/reports/analysis-history', async (req, reply) => {
    try {
      if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
      const q = req.query as any;
      const [rows] = await pool.execute(
        "SELECT id, report_count, period_label, date_from, date_to, LEFT(summary_md, 200) as preview, created_at FROM report_analysis_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        [req.user.id, Math.min(parseInt(q.limit||'50'), 200)]
      );
      reply.send(rows);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.get('/reports/analysis-history/:id', async (req, reply) => {
    try {
      if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
      const { id } = req.params as any;
      const [rows] = await pool.execute("SELECT * FROM report_analysis_history WHERE id = ? AND user_id = ?", [id, req.user.id]);
      if (!(rows as any[]).length) return reply.status(404).send({ error: 'Not found' });
      reply.send((rows as any[])[0]);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.delete('/reports/analysis-history/:id', async (req, reply) => {
    try {
      if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
      const { id } = req.params as any;
      await pool.execute("DELETE FROM report_analysis_history WHERE id = ? AND user_id = ?", [id, req.user.id]);
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

}