import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/actuals/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const [rows] = await pool.execute(
      "SELECT ta.*, u.name FROM team_actuals ta JOIN users u ON u.id = ta.user_id WHERE ta.team_id = ? AND ta.month = ? ORDER BY u.name, ta.product",
      [teamId, month]
    );
    reply.send(rows);
  });

  app.post('/actuals/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const { rows, month } = req.body as any;
    const m = month || new Date().toISOString().slice(0, 7);
    await pool.execute("DELETE FROM team_actuals WHERE team_id = ? AND month = ?", [teamId, m]);
    for (const r of (rows || [])) {
      if (r.type === 'total' || !r.userId) continue;
      const id = uuid();
      await pool.execute(
        "INSERT INTO team_actuals (id, team_id, user_id, product, actual_orders, fixed_cost, cost_per_order, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, teamId, r.userId, r.product || '', r.actualOrders || 0, r.fixedCost || 0, r.costPerOrder || 0, m]
      );
    }
    reply.send({ success: true });
  });
}