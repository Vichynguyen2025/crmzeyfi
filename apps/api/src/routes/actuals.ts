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
    const userId = q.userId || '';

    let teamFilter = '';
    const params: any[] = [];

    if (groupBy === 'day') {
      teamFilter = `WHERE d.team_id = ? AND d.month = ?`;
      params.push(teamId, month);
      if (dateFrom) { teamFilter += ` AND d.date >= ?`; params.push(dateFrom); }
      if (dateTo) { teamFilter += ` AND d.date <= ?`; params.push(dateTo); }
      if (userId) { teamFilter += ` AND d.user_id = ?`; params.push(userId); }
      const [rows] = await pool.execute(
        `SELECT u.name, u.name as userName, d.user_id, d.product, DATE_FORMAT(d.date, '%Y-%m-%d') as periodLabel,
          SUM(d.orders) as actualOrders, SUM(d.total_cost) as fixedCost, SUM(d.messages) as totalMessages,
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
      if (userId) { teamFilter += ` AND d.user_id = ?`; params.push(userId); }
      const [rows] = await pool.execute(
        `SELECT u.name, u.name as userName, d.user_id, d.product,
          CONCAT('Tuần ', WEEK(d.date, 1)) as periodLabel,
          SUM(d.orders) as actualOrders, SUM(d.total_cost) as fixedCost, SUM(d.messages) as totalMessages,
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
        ta.month as periodLabel, ta.total_messages as totalMessages FROM team_actuals ta
      JOIN users u ON u.id = ta.user_id
      WHERE ta.team_id = ? AND ta.month = ?${userId ? ' AND ta.user_id = ?' : ''}
      ORDER BY u.name, ta.product`,
      userId ? [teamId, month, userId] : [teamId, month]
    );
    reply.send(rows);
  });

  // B6: Cross-team actuals summary — pivot format with date filter
  app.get('/actuals-summary', async (req, reply) => {
    const q = req.query as any;
    const month = q.month || new Date().toISOString().slice(0, 7);
    const groupBy = (q.groupBy || 'month') as string;
    const dateFrom = q.dateFrom || '';
    const dateTo = q.dateTo || '';
    const userId = q.userId || '';
    const viewMode = q.viewMode || 'month';

    try {
      // Get all teams
      const [allTeams] = await pool.execute("SELECT id, name FROM teams ORDER BY name");
      
      // Build WHERE clause based on view mode
      let where = "WHERE d.month = ?";
      const params: any[] = [month];
      
      if (viewMode === 'day' || viewMode === 'week') {
        where = "WHERE 1=1";
        if (dateFrom) { where += " AND d.date >= ?"; params.push(dateFrom); }
        if (dateTo) { where += " AND d.date <= ?"; params.push(dateTo); }
      }
      if (groupBy === 'month') {
        // month mode doesn't need date filter beyond month
        where = "WHERE d.month = ?";
        params.length = 1;  // reset to just month
        params[0] = month;
      }

      const [rows] = await pool.execute(
        `SELECT t.id as teamId, t.name as teamName, d.product,
          SUM(d.orders) as totalOrders, SUM(d.total_cost) as totalCost,
          CASE WHEN SUM(d.orders) > 0 THEN ROUND(SUM(d.total_cost) / SUM(d.orders)) ELSE 0 END as costPerOrder,
          SUM(d.messages) as messages, SUM(d.reach) as reach
        FROM team_daily_perf d
        JOIN teams t ON t.id = d.team_id
        ${where}
        GROUP BY d.team_id, d.product
        HAVING d.product IS NOT NULL AND d.product != ''
        ORDER BY teamName, d.product`,
        params
      );
      // Get all distinct products across teams
      let allProducts: string[] = [];
      (rows as any[]).forEach(r => { if (!allProducts.includes(r.product)) allProducts.push(r.product); });
      allProducts.sort();
      // Build pivot: each team has map of product -> data
      const dataMap: Record<string, Record<string, any>> = {};
      (rows as any[]).forEach(r => {
        if (!dataMap[r.teamId]) dataMap[r.teamId] = {};
        dataMap[r.teamId][r.product] = { orders: Number(r.totalOrders||0), cost: Number(r.totalCost||0), costPerOrder: Number(r.costPerOrder||0), messages: Number(r.messages||0), reach: Number(r.reach||0) };
      });
      reply.send({ teams: allTeams, products: allProducts, data: dataMap });
    } catch (e: any) {
      reply.status(500).send({ error: 'Query failed', detail: e.message });
    }
  });
}