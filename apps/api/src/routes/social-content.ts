import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/social-content', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    let sql = "SELECT DATE_FORMAT(sc.date, '%Y-%m-%d') as date, DATE_FORMAT(sc.publish_date, '%Y-%m-%d') as publish_date, sc.id, sc.assignee, sc.platform, sc.title, sc.summary, sc.status, sc.post_link, sc.results, sc.created_by, sc.month, u.name as assigneeName FROM social_content sc LEFT JOIN users u ON u.id COLLATE utf8mb4_unicode_ci = sc.assignee WHERE sc.month = ?";
    const params: any[] = [month];
    if (q.platform) { sql += " AND sc.platform = ?"; params.push(q.platform); }
    if (q.status) { sql += " AND sc.status = ?"; params.push(q.status); }
    if (q.assignee) { sql += " AND sc.assignee = ?"; params.push(q.assignee); }
    sql += " ORDER BY sc.date DESC";
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/social-content', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const b = req.body as any;
    const id = uuid();
    const month = (b.date || '').slice(0, 7) || new Date().toISOString().slice(0, 7);
    await pool.execute(
      "INSERT INTO social_content (id, date, assignee, platform, title, summary, status, publish_date, post_link, results, created_by, month) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [id, b.date || new Date().toISOString().slice(0, 10), b.assignee || null, b.platform || '', b.title || '', b.summary || '', b.status || 'idea', b.publishDate || null, b.postLink || '', b.results || '', req.user.id, month]
    );
    reply.send({ id, success: true });
  });

  app.put('/social-content/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const body = req.body as any;
    const fields: string[] = []; const params: any[] = [];
    const map: any = { assignee:'assignee', platform:'platform', title:'title', summary:'summary', status:'status', publishDate:'publish_date', postLink:'post_link', results:'results', date:'date' };
    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) { let v = body[key]; if (col === 'date') { v = String(v).split('T')[0]; } fields.push(col + ' = ?'); params.push(v); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute("UPDATE social_content SET " + fields.join(', ') + " WHERE id = ?", params);
    reply.send({ success: true });
  });

  app.delete('/social-content/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM social_content WHERE id = ?", [id]);
    reply.send({ success: true });
  });
}