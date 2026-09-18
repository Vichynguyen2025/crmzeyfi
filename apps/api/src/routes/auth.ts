import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { db, pool } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const SECRET = process.env.JWT_SECRET || 'zeyfi-secret';

export default async function (app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    // Require admin token for registration (closed registration)
    const header = req.headers.authorization;
    if (!header) return reply.status(403).send({ error: 'Đăng ký đã đóng. Liên hệ admin để tạo tài khoản.' });
    try {
      const adminUser = jwt.verify(header.replace('Bearer ', ''), SECRET) as any;
      if (adminUser.role !== 'admin') return reply.status(403).send({ error: 'Chỉ admin mới tạo được tài khoản' });
    } catch { return reply.status(403).send({ error: 'Token không hợp lệ' }); }

    try {
      const { name, email, password, role } = req.body as any;
      const hash = await bcrypt.hash(password, 10);
      const id = uuid();
      const userRole = role || 'member';
      await db.insert(users).values({ id, name, email, password: hash, role: userRole });
      reply.send({ success: true, user: { id, name, email, role: userRole } });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/auth/login', async (req, reply) => {
    try {
      const { email, password } = req.body as any;
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u) return reply.status(400).send({ error: 'Sai email hoặc mật khẩu' });
      const ok = await bcrypt.compare(password, u.password);
      if (!ok) return reply.status(400).send({ error: 'Sai email hoặc mật khẩu' });
      const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, SECRET, { expiresIn: '7d' });
      reply.send({ accessToken: token, user: { id: u.id, name: u.name, email: u.email, role: u.role } });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.get('/auth/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const [u] = await pool.execute(
      "SELECT id, name, email, role, avatar, phone, position, bio, created_at as createdAt FROM users WHERE id = ?",
      [req.user.id]
    );
    reply.send(u[0]);
    app.put('/auth/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, phone, position, bio, avatar } = req.body as any;
    await pool.execute(
      "UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), position=COALESCE(?,position), bio=COALESCE(?,bio), avatar=COALESCE(?,avatar) WHERE id=?",
      [name, phone, position, bio, avatar, req.user.id]
    );
    reply.send({ success: true });
  });

// ─── User Management (admin only) ─────
  app.get('/users', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, position, avatar, created_at as createdAt FROM users ORDER BY created_at DESC"
    );
    reply.send(rows);
  });

  app.put('/users/:id/role', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    const { role } = req.body as any;
    if (!['admin','manager','member'].includes(role)) return reply.status(400).send({ error: 'Invalid role' });
    await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    reply.send({ success: true });
  });

  app.delete('/users/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    reply.send({ success: true });
  });
});
}