import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  app.get('/channels', async (req, reply) => {
    const [rows] = await pool.execute(
      "SELECT mc.*, t.name as teamName, u.name as assignedToName FROM media_channels mc LEFT JOIN teams t ON t.id = mc.team_id LEFT JOIN users u ON u.id = mc.assigned_to ORDER BY mc.platform, mc.name"
    );
    reply.send(rows);
  });

  app.post('/channels', async (req, reply) => {
    const { name, platform, url, teamId, assignedTo, notes } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO media_channels (id, name, platform, url, team_id, assigned_to, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, platform, url, teamId || null, assignedTo || null, notes || '']
    );
    io.emit('channel:update', { action: 'create', id });
    reply.send({ id, success: true });
  });

  app.put('/channels/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    const { name, platform, url, teamId, assignedTo, notes } = req.body as any;
    await pool.execute(
      "UPDATE media_channels SET name=?, platform=?, url=?, team_id=?, assigned_to=?, notes=? WHERE id=?",
      [name, platform, url, teamId || null, assignedTo || null, notes || '', id]
    );
    io.emit('channel:update', { action: 'update', id });
    reply.send({ success: true });
  });

  app.delete('/channels/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM media_channels WHERE id = ?", [id]);
    io.emit('channel:update', { action: 'delete', id });
    reply.send({ success: true });
  });
}