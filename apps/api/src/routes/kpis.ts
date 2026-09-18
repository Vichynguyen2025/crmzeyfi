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

  app.get('/kpis-summary/:month', async (req, reply) => {
    const { month } = req.params as any;
    const m = month || new Date().toISOString().slice(0, 7);
    const [rows] = await pool.execute(
      "SELECT tk.*, u.name as userName, t.name as teamName, t.color as teamColor FROM team_kpis tk JOIN users u ON u.id = tk.user_id JOIN teams t ON t.id = tk.team_id WHERE tk.month = ? ORDER BY t.name, u.name, tk.product",
      [m]
    );
    // Group by team
    const byTeam: Record<string, any> = {};
    for (const r of rows as any[]) {
      if (!byTeam[r.team_id]) byTeam[r.team_id] = { id: r.team_id, name: r.teamName, color: r.teamColor, products: [], totalTarget: 0, totalBudget: 0, totalOrders: 0 };
      byTeam[r.team_id].products.push({ name: r.product, target: r.monthly_orders || 0, budget: r.daily_budget || 0, messages: r.daily_messages || 0 });
      byTeam[r.team_id].totalTarget += r.monthly_orders || 0;
      byTeam[r.team_id].totalBudget += r.daily_budget || 0;
      byTeam[r.team_id].totalOrders += r.monthly_orders || 0;
    }
    reply.send(Object.values(byTeam));
  });
});
}