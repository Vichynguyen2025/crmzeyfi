import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db, pool } from '../db/index';
import { teams, teamMembers, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export default async function (app: FastifyInstance) {
  app.get('/teams', async (req, reply) => {
    const [rows] = await pool.execute(
      "SELECT t.*, (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count FROM teams t ORDER BY t.name"
    );
    reply.send(rows);
  });

  app.post('/teams', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { name, color, channelOnly } = req.body as any;
    const id = uuid();
    await pool.execute("INSERT INTO teams (id, name, color, channel_only) VALUES (?, ?, ?, ?)", [id, name, color || null, channelOnly ? 1 : 0]);
    reply.send({ id, success: true });
  });

  app.put('/teams/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    const { name, color, channelOnly } = req.body as any;
    if (name) await db.update(teams).set({ name }).where(eq(teams.id, id));
    if (color) await db.update(teams).set({ color }).where(eq(teams.id, id));
    reply.send({ success: true });
  });

  app.delete('/teams/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    await db.delete(teams).where(eq(teams.id, id));
    reply.send({ success: true });
  });

  app.get('/teams/:id/members', async (req, reply) => {
    const { id } = req.params as any;
    const members = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
    }).from(teamMembers).innerJoin(users, eq(users.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, id));
    reply.send(members);
  });

  app.post('/teams/:id/members', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    const { userId } = req.body as any;
    await db.insert(teamMembers).values({ teamId: id, userId });
    reply.send({ success: true });
  });

  app.delete('/teams/:id/members/:userId', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id, userId } = req.params as any;
    await pool.execute("DELETE FROM team_members WHERE team_id = ? AND user_id = ?", [id, userId]);
    reply.send({ success: true });
  });
  app.get('/teams/:id/channels', async (req, reply) => {
    const { id } = req.params as any;
    const [rows] = await pool.execute(
      "SELECT mc.*, u.name as assignedToName FROM media_channels mc LEFT JOIN users u ON u.id = mc.assigned_to WHERE mc.team_id = ? ORDER BY mc.platform",
      [id]
    );
    reply.send(rows);
  });

  app.patch('/teams/:id/visibility', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const { id } = req.params as any;
    const { table } = req.body as any;
    if (table === 'b5') {
      await pool.execute("UPDATE teams SET hide_from_b5 = NOT COALESCE(hide_from_b5, 0) WHERE id = ?", [id]);
    } else if (table === 'b6') {
      await pool.execute("UPDATE teams SET hide_from_b6 = NOT COALESCE(hide_from_b6, 0) WHERE id = ?", [id]);
    }
    reply.send({ success: true });
  });
}