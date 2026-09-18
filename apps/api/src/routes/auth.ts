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
    try {
      const { name, email, password } = req.body as any;
      const hash = await bcrypt.hash(password, 10);
      const id = uuid();
      await db.insert(users).values({ id, name, email, password: hash, role: 'member' });
      const token = jwt.sign({ id, email, role: 'member' }, SECRET, { expiresIn: '7d' });
      reply.send({ accessToken: token, user: { id, name, email, role: 'member' } });
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
});
}