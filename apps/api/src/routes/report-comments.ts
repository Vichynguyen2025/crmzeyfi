import { FastifyInstance } from 'fastify';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  // POST: Add comment to a report
  app.post('/reports/:id/comments', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    const { content } = req.body as any;
    if (!content || !content.trim()) return reply.status(400).send({ error: 'Content required' });
    const cid = crypto.randomUUID();
    const userName = (req.user as any).name || (req.user as any).email || 'Unknown';
    await pool.execute(
      "INSERT INTO report_comments (id, report_id, user_id, content, created_at) VALUES (?, ?, ?, ?, NOW())",
      [cid, id, req.user.id, content.trim()]
    );
    // Emit socket event for realtime
    try {
      const { io } = app as any;
      if (io) {
        io.emit('report:comment', {
          reportId: id,
          comment: { id: cid, report_id: id, user_id: req.user.id, userName, content: content.trim(), created_at: new Date() },
          ownerId: (req.user as any).id,
        });
      }
    } catch {}
    reply.send({ success: true, id: cid });
  });

  // GET: Get comments for a report
  app.get('/reports/:id/comments', async (req, reply) => {
    const { id } = req.params as any;
    const [rows] = await pool.execute(
      "SELECT c.*, COALESCE(u.name, u.email, '') as userName FROM report_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.report_id = ? ORDER BY c.created_at ASC",
      [id]
    );
    reply.send(rows);
  });

  // DELETE: Delete a comment
  app.delete('/reports/:id/comments/:commentId', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { commentId } = req.params as any;
    const [result] = await pool.execute("DELETE FROM report_comments WHERE id = ? AND user_id = ?", [commentId, req.user.id]);
    reply.send({ success: true });
  });
}