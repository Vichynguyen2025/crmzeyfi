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
    // Grant module access for this user
    await pool.execute('INSERT IGNORE INTO user_modules (user_id, module_key) VALUES (?, ?)', [userId, 'marketing3m']);
    const [rows] = await pool.execute('SELECT u.id, u.name, u.email FROM marketing_3m_members mm JOIN users u ON u.id = mm.user_id WHERE u.id = ?', [userId]);
    if (io) io.emit('marketing3m:member', { action: 'add', data: rows[0] });
    reply.send({ success: true });
  });

  // DELETE: Remove member (admin only)
  app.delete('/marketing-3m/members/:userId', async (req, reply) => {
    if (!req.user || req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { userId } = req.params as any;
    await pool.execute('DELETE FROM marketing_3m_members WHERE user_id=?', [userId]);
    // Remove module access
    await pool.execute('DELETE FROM user_modules WHERE user_id=? AND module_key=?', [userId, 'marketing3m']);
    if (io) io.emit('marketing3m:member', { action: 'remove', userId });
    reply.send({ success: true });
  });

// ─── Content Fanpage ─────────────────────────────
  app.get('/marketing-3m/fanpage', async (req, reply) => {
    try {
      const q = req.query as any;
      let sql = "SELECT fp.id, DATE_FORMAT(fp.day, '%Y-%m-%d') as day, fp.time, fp.format, fp.channel_id, fp.pillar, fp.key_message, fp.content_text, fp.media_url, fp.media_name, fp.status, fp.completion_link, fp.created_at, fp.updated_at, mc.name as channelName FROM marketing_3m_fanpage fp LEFT JOIN media_channels mc ON mc.id = fp.channel_id WHERE 1=1";
      const params: any[] = [];
      if (q.status) { sql += ' AND fp.status = ?'; params.push(q.status); }
      if (q.dateFrom) { sql += ' AND fp.day >= ?'; params.push(q.dateFrom); }
      if (q.dateTo) { sql += ' AND fp.day <= ?'; params.push(q.dateTo); }
      sql += ' ORDER BY fp.day ASC, fp.time ASC';
      const [rows] = await pool.execute(sql, params);
      reply.send(rows);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/marketing-3m/fanpage', async (req, reply) => {
    try {
      const b = req.body as any;
      if (!b.day && !b.key_message) return reply.status(400).send({ error: 'Missing day or content' });
      const id = crypto.randomUUID();
      await pool.execute(
        'INSERT INTO marketing_3m_fanpage (id, day, time, format, channel_id, pillar, key_message, content_text, media_url, media_name, status, completion_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [id, b.day||null, b.time||'', b.format||'', b.channel_id||null, b.pillar||'', b.key_message||'', b.content_text||'', b.media_url||'', b.media_name||'', b.status||'pending', b.completion_link||'']
      );
      const [rows] = await pool.execute('SELECT fp.id, DATE_FORMAT(fp.day, '%Y-%m-%d') as day, fp.time, fp.format, fp.channel_id, fp.pillar, fp.key_message, fp.content_text, fp.media_url, fp.media_name, fp.status, fp.completion_link, fp.created_at, fp.updated_at, mc.name as channelName FROM marketing_3m_fanpage fp LEFT JOIN media_channels mc ON mc.id = fp.channel_id WHERE fp.id = ?', [id]);
      if (io) io.emit('marketing3m:update', { action: 'create', data: rows[0] });
      reply.send({ success: true, id });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.put('/marketing-3m/fanpage/:id', async (req, reply) => {
    try {
      const { id } = req.params as any;
      const b = req.body as any;
      const allowed = ['day','time','format','channel_id','pillar','key_message','content_text','media_url','media_name','status','completion_link'];
      const fields: string[] = [];
      const params: any[] = [];
      for (const k of allowed) {
        if (k in b) { fields.push(k + ' = ?'); params.push(b[k] === undefined ? null : b[k]); }
      }
      if (!fields.length) return reply.send({ success: true });
      params.push(id);
      await pool.execute('UPDATE marketing_3m_fanpage SET ' + fields.join(',') + ' WHERE id=?', params);
      const [rows] = await pool.execute('SELECT fp.id, DATE_FORMAT(fp.day, '%Y-%m-%d') as day, fp.time, fp.format, fp.channel_id, fp.pillar, fp.key_message, fp.content_text, fp.media_url, fp.media_name, fp.status, fp.completion_link, fp.created_at, fp.updated_at, mc.name as channelName FROM marketing_3m_fanpage fp LEFT JOIN media_channels mc ON mc.id = fp.channel_id WHERE fp.id = ?', [id]);
      if (io) io.emit('marketing3m:update', { action: 'update', data: rows[0] });
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.delete('/marketing-3m/fanpage/:id', async (req, reply) => {
    try {
      const { id } = req.params as any;
      await pool.execute('DELETE FROM marketing_3m_fanpage WHERE id=?', [id]);
      if (io) io.emit('marketing3m:update', { action: 'delete', id });
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });
}