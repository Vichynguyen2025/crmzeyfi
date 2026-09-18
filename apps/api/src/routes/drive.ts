import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/drive', async (req, reply) => {
    const q = req.query as any;
    const parentId = q.parentId || null;
    const [rows] = await pool.execute(
      "SELECT df.*, u.name as uploadedByName FROM drive_files df LEFT JOIN users u ON u.id = df.uploaded_by WHERE df.parent_id ? ORDER BY df.type='folder' DESC, df.name ASC",
      [parentId]
    );
    reply.send(rows);
  });

  app.post('/drive/folder', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, parentId } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO drive_files (id, name, type, parent_id, uploaded_by) VALUES (?, ?, 'folder', ?, ?)",
      [id, name, parentId || null, req.user.id]
    );
    reply.send({ id, success: true });
  });

  app.post('/drive/upload', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, mimeType, size, url, parentId } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO drive_files (id, name, type, mime_type, size, url, parent_id, uploaded_by) VALUES (?, ?, 'file', ?, ?, ?, ?, ?)",
      [id, name, mimeType, size || 0, url, parentId || null, req.user.id]
    );
    reply.send({ id, success: true });
  });

  app.put('/drive/:id', async (req, reply) => {
    const { id } = req.params as any;
    const { name } = req.body as any;
    await pool.execute("UPDATE drive_files SET name = ? WHERE id = ?", [name, id]);
    reply.send({ success: true });
  });

  app.delete('/drive/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM drive_files WHERE id = ? OR parent_id = ?", [id, id]);
    reply.send({ success: true });
  });
}