import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/actuals/:teamId', async (req, reply) => {
    const { teamId } = req.params as any;
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const groupBy = (q.groupBy || 'month') as string;
    const dateFrom = q.dateFrom || '';
    const dateTo = q.dateTo || '';

    let teamFilter = '';
    const params: any[] = [];

    if (groupBy === 'day') {
      teamFilter = `WHERE d.team_id = ? AND d.month = ?`;
      params.push(teamId, month);
      if (dateFrom) { teamFilter += ` AND d.date >= ?`; params.push(dateFrom); }
      if (dateTo) { teamFilter += ` AND d.date <= ?`; params.push(dateTo); }
      const [rows] = await pool.execute(
        `SELECT u.name, u.name as userName, d.user_id, d.product, DATE_FORMAT(d.date, '%Y-%m-%d') as periodLabel,
          SUM(d.orders) as actualOrders, SUM(d.total_cost) as fixedCost,
          CASE WHEN SUM(d.orders) > 0 THEN ROUND(SUM(d.total_cost) / SUM(d.orders)) ELSE 0 END as costPerOrder
        FROM team_daily_perf d
        JOIN users u ON u.id = d.user_id
        ${teamFilter}
        GROUP BY d.user_id, d.product, DATE(d.date)
        ORDER BY d.date DESC, u.name, d.product`,
        params
      );
      reply.send(rows);
      return;
    }

    if (groupBy === 'week') {
      teamFilter = `WHERE d.team_id = ? AND d.month = ?`;
      params.push(teamId, month);
      if (dateFrom) { teamFilter += ` AND d.date >= ?`; params.push(dateFrom); }
      if (dateTo) { teamFilter += ` AND d.date <= ?`; params.push(dateTo); }
      const [rows] = await pool.execute(
        `SELECT u.name, u.name as userName, d.user_id, d.product,
          CONCAT('Tuần ', WEEK(d.date, 1)) as periodLabel,
          SUM(d.orders) as actualOrders, SUM(d.total_cost) as fixedCost,
          CASE WHEN SUM(d.orders) > 0 THEN ROUND(SUM(d.total_cost) / SUM(d.orders)) ELSE 0 END as costPerOrder
        FROM team_daily_perf d
        JOIN users u ON u.id = d.user_id
        ${teamFilter}
        GROUP BY d.user_id, d.product, WEEK(d.date, 1)
        ORDER BY WEEK(d.date, 1) DESC, u.name, d.product`,
        params
      );
      reply.send(rows);
      return;
    }

    // Default: month view — from team_actuals table (pre-calculated by recalcActuals)
    const [rows] = await pool.execute(
      `SELECT ta.*, u.name, u.name as userName, ta.actual_orders as actualOrders, ta.fixed_cost as fixedCost, ta.cost_per_order as costPerOrder,
        ta.month as periodLabel FROM team_actuals ta
      JOIN users u ON u.id = ta.user_id
      WHERE ta.team_id = ? AND ta.month = ?
      ORDER BY u.name, ta.product`,
      [teamId, month]
    );
    reply.send(rows);
  });
}