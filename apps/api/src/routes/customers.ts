import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  // GET /customers — full list with assignee name + filters
  app.get('/customers', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = `SELECT c.*, u.name as assigneeName, t.name as teamName,
      (SELECT COUNT(*) FROM customer_interactions ci WHERE ci.customer_id = c.id) as interactionCount
      FROM customers c
      LEFT JOIN users u ON u.id = c.assignee_id
      LEFT JOIN teams t ON t.id = c.team_id
      WHERE 1=1`;
    const params: any[] = [];
    if (q.search) { sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)`; const s = `%${q.search}%`; params.push(s, s, s); }
    if (q.status) { sql += ` AND c.status = ?`; params.push(q.status); }
    if (q.source) { sql += ` AND c.source = ?`; params.push(q.source); }
    if (q.assigneeId) { sql += ` AND c.assignee_id = ?`; params.push(q.assigneeId); }
    if (q.tag) { sql += ` AND c.tags LIKE ?`; params.push(`%${q.tag}%`); }
    sql += ` ORDER BY c.created_at DESC`;
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  // GET /customers/:id — detail + interactions
  app.get('/customers/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const [rows] = await pool.execute(
      `SELECT c.*, u.name as assigneeName, t.name as teamName FROM customers c
       LEFT JOIN users u ON u.id = c.assignee_id
       LEFT JOIN teams t ON t.id = c.team_id WHERE c.id = ?`, [id]);
    const customer = (rows as any[])[0];
    if (!customer) return reply.status(404).send({ error: 'Không tìm thấy' });
    const [ints] = await pool.execute(
      `SELECT ci.*, u.name as userName FROM customer_interactions ci
       LEFT JOIN users u ON u.id = ci.user_id WHERE ci.customer_id = ? ORDER BY ci.created_at DESC`, [id]);
    reply.send({ ...customer, interactions: ints });
  });

  // POST /customers — create
  app.post('/customers', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, phone, email, birthday, address, source, social, facebook, zalo, tiktok, notes, teamId, assigneeId, tags, status } = req.body as any;
    if (!name) return reply.status(400).send({ error: 'Thiếu tên' });
    const id = uuid();
    await pool.execute(
      `INSERT INTO customers (id, name, phone, email, birthday, address, source, social, facebook, zalo, tiktok, notes, team_id, assignee_id, tags, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, name, phone || '', email || '', birthday || null, address || '', source || '', social || '', facebook || '', zalo || '', tiktok || '', notes || '', teamId || null, assigneeId || req.user.id, tags || '', status || 'new']
    );
    io.emit('customer:new', { id, name });
    reply.send({ id, success: true });
  });

  // PUT /customers/:id — update
  app.put('/customers/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const { name, phone, email, birthday, address, source, social, facebook, zalo, tiktok, notes, teamId, assigneeId, tags, status } = req.body as any;
    await pool.execute(
      `UPDATE customers SET name=?, phone=?, email=?, birthday=?, address=?, source=?, social=?, facebook=?, zalo=?, tiktok=?, notes=?, team_id=?, assignee_id=?, tags=?, status=? WHERE id=?`,
      [name, phone || '', email || '', birthday || null, address || '', source || '', social || '', facebook || '', zalo || '', tiktok || '', notes || '', teamId || null, assigneeId || null, tags || '', status || 'new', id]
    );
    io.emit('customer:updated', { id, name });
    reply.send({ success: true });
  });

  // DELETE /customers/:id
  app.delete('/customers/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
    await pool.execute('DELETE FROM customer_interactions WHERE customer_id = ?', [id]);
    io.emit('customer:deleted', { id });
    reply.send({ success: true });
  });

  // POST /customers/:id/interactions — add interaction (call/message/note/order)
  app.post('/customers/:id/interactions', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const { type, content } = req.body as any;
    const iid = uuid();
    await pool.execute(
      'INSERT INTO customer_interactions (id, customer_id, user_id, type, content) VALUES (?, ?, ?, ?, ?)',
      [iid, id, req.user.id, type || 'note', content || '']
    );
    // Update contact count + last contact
    await pool.execute(
      'UPDATE customers SET contact_count = contact_count + 1, last_contact = NOW() WHERE id = ?', [id]
    );
    io.emit('customer:interaction', { customerId: id, type, content });
    reply.send({ id: iid, success: true });
  });

  // DELETE /customers/:id/interactions/:iid
  app.delete('/customers/:id/interactions/:iid', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id, iid } = req.params as any;
    await pool.execute('DELETE FROM customer_interactions WHERE id = ? AND customer_id = ?', [iid, id]);
    io.emit('customer:interactionDeleted', { customerId: id, id: iid });
    reply.send({ success: true });
  });
}