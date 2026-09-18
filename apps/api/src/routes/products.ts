import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/products', async (req, reply) => {
    const q = req.query as any;
    let sql = "SELECT p.*, t.name as teamName, u.name as createdByName FROM products p LEFT JOIN teams t ON t.id = p.team_id LEFT JOIN users u ON u.id = p.created_by";
    const params: any[] = [];
    if (q.teamId) { sql += " WHERE p.team_id = ?"; params.push(q.teamId); }
    if (q.category) { sql += (params.length ? " AND" : " WHERE") + " p.category = ?"; params.push(q.category); }
    sql += " ORDER BY p.created_at DESC";
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/products', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, description, price, category, imageUrl, teamId, status } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO products (id, name, description, price, category, image_url, team_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, description || '', price || '0', category || '', imageUrl || '', teamId || null, status || 'active', req.user.id]
    );
    reply.send({ id, success: true });
  });

  app.put('/products/:id', async (req, reply) => {
    const { id } = req.params as any;
    const { name, description, price, category, imageUrl, teamId, status } = req.body as any;
    await pool.execute(
      "UPDATE products SET name=?, description=?, price=?, category=?, image_url=?, team_id=?, status=? WHERE id=?",
      [name, description, price, category, imageUrl, teamId || null, status, id]
    );
    reply.send({ success: true });
  });

  app.delete('/products/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM products WHERE id = ?", [id]);
    reply.send({ success: true });
  });
}