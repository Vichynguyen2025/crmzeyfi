import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/kpis/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const query = req.query as any;
    const month = query.month || new Date().toISOString().slice(0, 7);
    const [rows] = await pool.execute(
      "SELECT tk.*, u.name FROM team_kpis tk JOIN users u ON u.id = tk.user_id WHERE tk.team_id = ? AND tk.month = ? ORDER BY u.name, tk.product",
      [teamId, month]
    );
    reply.send(rows);
  });

  app.post('/kpis/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const { rows, month } = req.body as any;
    const m = month || new Date().toISOString().slice(0, 7);
    // Delete existing for this team+month and re-insert
    await pool.execute("DELETE FROM team_kpis WHERE team_id = ? AND month = ?", [teamId, m]);
    for (const r of (rows || [])) {
      if (r.type === 'total' || !r.userId) continue;
      const id = uuid();
      await pool.execute(
        "INSERT INTO team_kpis (id, team_id, user_id, product, daily_budget, daily_messages, monthly_orders, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, teamId, r.userId, r.product || '', r.budget || 0, r.messages || 0, r.orders || 0, m]
      );
    }
    reply.send({ success: true });
  });
}