import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/kpis/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const [rows] = await pool.execute(
      "SELECT tk.*, u.name FROM team_kpis tk JOIN users u ON u.id = tk.user_id WHERE tk.team_id = ? ORDER BY u.name",
      [teamId]
    );
    reply.send(rows);
  });

  app.post('/kpis/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const rows = req.body as any[];
    // Delete existing and re-insert
    await pool.execute("DELETE FROM team_kpis WHERE team_id = ?", [teamId]);
    for (const r of rows) {
      if (r.id === 'total' || !r.userId) continue;
      const id = uuid();
      await pool.execute(
        "INSERT INTO team_kpis (id, team_id, user_id, product, daily_budget, daily_messages, monthly_orders) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, teamId, r.userId, r.product || '', r.budget || 0, r.messages || 0, r.orders || 0]
      );
    }
    reply.send({ success: true });
  });
}