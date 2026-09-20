import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { db, pool } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const SECRET = process.env.JWT_SECRET || 'zeyfi-secret';

export default async function(app: FastifyInstance) {

  app.post('/auth/register', async (req, reply) => {
    const header = req.headers.authorization;
    if (!header) return reply.status(403).send({ error: 'Dang ky da dong. Lien he admin.' });
    try {
      const adminUser = jwt.verify(header.replace('Bearer ', ''), SECRET) as any;
      if (adminUser.role !== 'admin') return reply.status(403).send({ error: 'Chi admin moi tao duoc tai khoan' });
    } catch { return reply.status(403).send({ error: 'Token khong hop le' }); }

    try {
      const { name, email, phone, password, role } = req.body as any;
      const hash = await bcrypt.hash(password, 10);
      const id = uuid();
      const userRole = role || 'member';
      const phoneVal = phone || null;
      await pool.execute(
        "INSERT INTO users (id, name, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [id, name, email, phoneVal, hash, userRole]
      );
      reply.send({ success: true, user: { id, name, email, phone: phoneVal, role: userRole } });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/auth/login', async (req, reply) => {
    try {
      const { email, phone, password } = req.body as any;
      const identifier = email || phone;
      if (!identifier) return reply.status(400).send({ error: 'Vui long nhap email hoac so dien thoai' });
      const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? OR phone = ?", [identifier, identifier]);
      const u = rows as any[];
      if (!u.length) return reply.status(400).send({ error: 'Sai thong tin dang nhap' });
      const user = u[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return reply.status(400).send({ error: 'Sai thong tin dang nhap' });
      if (user.is_blocked) return reply.status(403).send({ error: 'Tai khoan da bi khoan. Lien he admin.' });
      // Update last seen
      await pool.execute("UPDATE users SET last_seen = NOW() WHERE id = ?", [user.id]);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
      reply.send({ accessToken: token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.get('/auth/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, avatar, phone, position, bio, created_at as createdAt FROM users WHERE id = ?", [req.user.id]
    );
    reply.send((rows as any[])[0]);
  });

  app.put('/auth/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, phone, position, bio, avatar } = req.body as any;
    await pool.execute(
      "UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), position=COALESCE(?,position), bio=COALESCE(?,bio), avatar=COALESCE(?,avatar) WHERE id=?",
      [name, phone, position, bio, avatar, req.user.id]
    );
    reply.send({ success: true });
  });

  app.get('/users', async (req, reply) => {
    const [rows] = await pool.execute(
      "SELECT u.id, u.name, u.email, u.phone, u.role, u.position, u.hometown, u.join_date as joinDate, u.avatar, u.is_blocked, u.last_seen, u.created_at as createdAt, " +
      "(SELECT GROUP_CONCAT(t.name SEPARATOR ', ') FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = u.id) as team_names " +
      "FROM users u ORDER BY u.created_at DESC"
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

  app.put('/users/:id/block', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    const { blocked } = req.body as any;
    await pool.execute("UPDATE users SET is_blocked = ? WHERE id = ?", [blocked ? 1 : 0, id]);
    reply.send({ success: true, blocked });
  });

  app.put('/users/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    const { name, email, phone, position, hometown, joinDate } = req.body as any;
    await pool.execute(
      "UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone), position=COALESCE(?,position), hometown=COALESCE(?,hometown), join_date=COALESCE(?,join_date) WHERE id=?",
      [name, email, phone, position, hometown, joinDate, id]
    );
    reply.send({ success: true });
  });

  app.delete('/users/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    reply.send({ success: true });
  });

}