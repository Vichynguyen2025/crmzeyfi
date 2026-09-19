import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  app.get('/tasks', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = `SELECT t.*, t.due_date as dueDate, t.created_at as createdAt, t.product_link as productLink, u.name as assigneeName, cu.name as createdByName 
      FROM tasks t 
      LEFT JOIN users u ON u.id = t.assignee_id 
      LEFT JOIN users cu ON cu.id = t.created_by`;
    const params: any[] = [];
    if (q.teamId) { sql += ' WHERE t.team_id = ?'; params.push(q.teamId); }
    if (q.status) { sql += (params.length ? ' AND' : ' WHERE') + ' t.status = ?'; params.push(q.status); }
    sql += ' ORDER BY t.position';
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/tasks', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { title, teamId, assigneeId, status, priority, dueDate } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO tasks (id, title, team_id, assignee_id, status, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, teamId || null, assigneeId || null, status || 'todo', priority || 'medium', dueDate || null, req.user.id]
    );
    io.emit('task:new', { id, title, teamId, status });
    reply.send({ id, success: true });
  });

  app.put('/tasks/:id/status', async (req, reply) => {
    const { id } = req.params as any;
    const { status, position } = req.body as any;
    await pool.execute("UPDATE tasks SET status = ?, position = ? WHERE id = ?", [status, position, id]);
    io.emit('task:updated', { id, status, position });
    reply.send({ success: true });
  });

  app.put('/tasks/:id', async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const fields: string[] = []; const params: any[] = [];
    for (const key of ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId', 'productLink']) {
      if (body[key] !== undefined) { fields.push(key.replace(/([A-Z])/g, '_$1').toLowerCase() + ' = ?'); params.push(body[key]); }
    }
    if (fields.length === 0) return reply.send({ success: true });
    params.push(id);
    await pool.execute("UPDATE tasks SET " + fields.join(', ') + " WHERE id = ?", params);
    io.emit('task:updated', { id, ...body });
    reply.send({ success: true });
  });

  app.delete('/tasks/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM tasks WHERE id = ?", [id]);
    io.emit('task:deleted', { id });
    reply.send({ success: true });
  });
}