import { FastifyInstance } from 'fastify';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  const { io } = app as any;

  // GET: List tasks with filters
  app.get('/marketing-3m', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = 'SELECT mt.*, u.name as assigneeName FROM marketing_3m_tasks mt LEFT JOIN users u ON u.id = mt.assignee_id WHERE 1=1';
    const params: any[] = [];
    if (q.tab) { sql += ' AND mt.tab = ?'; params.push(q.tab); }
    if (q.assignee_id) { sql += ' AND mt.assignee_id = ?'; params.push(q.assignee_id); }
    if (q.status) { sql += ' AND mt.status = ?'; params.push(q.status); }
    if (q.dateFrom) { sql += ' AND mt.date >= ?'; params.push(q.dateFrom); }
    if (q.dateTo) { sql += ' AND mt.date <= ?'; params.push(q.dateTo); }
    sql += ' ORDER BY mt.day_order ASC';
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  // POST: Create task
  app.post('/marketing-3m', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const body = req.body as any;
    const id = crypto.randomUUID();
    await pool.execute(
      'INSERT INTO marketing_3m_tasks (id, tab, date, day_order, task_name, quantity, content, timeline, assignee_id, status, completion_link) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [id, body.tab, body.date || null, body.day_order || 0, body.task_name, body.quantity || 0, body.content || '', body.timeline || '', body.assignee_id || null, body.status || 'pending', body.completion_link || '']
    );
    const [rows] = await pool.execute('SELECT mt.*, u.name as assigneeName FROM marketing_3m_tasks mt LEFT JOIN users u ON u.id = mt.assignee_id WHERE mt.id = ?', [id]);
    if (io) io.emit('marketing3m:update', { action: 'create', data: rows[0] });
    reply.send({ success: true, id });
  });

  // PUT: Update task field
  app.put('/marketing-3m/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const body = req.body as any;
    const fields: string[] = []; const params: any[] = [];
    for (const [k, col] of Object.entries({ task_name:'task_name', quantity:'quantity', content:'content', timeline:'timeline', assignee_id:'assignee_id', status:'status', completion_link:'completion_link', day_order:'day_order', tab:'tab' } as any)) {
      if (body[k] !== undefined) { fields.push(col + '=?'); params.push(body[k]); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute('UPDATE marketing_3m_tasks SET ' + fields.join(',') + ' WHERE id=?', params);
    const [rows] = await pool.execute('SELECT mt.*, u.name as assigneeName FROM marketing_3m_tasks mt LEFT JOIN users u ON u.id = mt.assignee_id WHERE mt.id = ?', [id]);
    if (io) io.emit('marketing3m:update', { action: 'update', data: rows[0] });
    reply.send({ success: true });
  });

  // DELETE: Delete task
  app.delete('/marketing-3m/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await pool.execute('DELETE FROM marketing_3m_tasks WHERE id=?', [id]);
    if (io) io.emit('marketing3m:update', { action: 'delete', id });
    reply.send({ success: true });
  });

  // GET: Module members
  app.get('/marketing-3m/members', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const [rows] = await pool.execute(
      'SELECT u.id, u.name, u.email FROM marketing_3m_members mm JOIN users u ON u.id = mm.user_id ORDER BY u.name ASC'
    );
    reply.send(rows);
  });

  // POST: Add member (admin only)
  app.post('/marketing-3m/members', async (req, reply) => {
    if (!req.user || req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { userId } = req.body as any;
    await pool.execute('INSERT IGNORE INTO marketing_3m_members (user_id) VALUES (?)', [userId]);
    const [rows] = await pool.execute('SELECT u.id, u.name, u.email FROM marketing_3m_members mm JOIN users u ON u.id = mm.user_id WHERE u.id = ?', [userId]);
    if (io) io.emit('marketing3m:member', { action: 'add', data: rows[0] });
    reply.send({ success: true });
  });

  // DELETE: Remove member (admin only)
  app.delete('/marketing-3m/members/:userId', async (req, reply) => {
    if (!req.user || req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { userId } = req.params as any;
    await pool.execute('DELETE FROM marketing_3m_members WHERE user_id=?', [userId]);
    if (io) io.emit('marketing3m:member', { action: 'remove', userId });
    reply.send({ success: true });
  });
}