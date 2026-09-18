import { FastifyInstance } from 'fastify';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, position, avatar, created_at as createdAt FROM users ORDER BY created_at DESC"
    );
    reply.send(rows);
  });

  app.put('/:id/role', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    const { role } = req.body as any;
    if (!['admin','manager','member'].includes(role)) return reply.status(400).send({ error: 'Invalid role' });
    await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    reply.send({ success: true });
  });

  app.delete('/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    reply.send({ success: true });
  });
}