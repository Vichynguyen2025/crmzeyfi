import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  app.get('/drive', async (req, reply) => {
    const q = req.query as any;
    const parentId = q.parentId || null;
    let sql, params;
    if (parentId) {
      sql = "SELECT df.*, u.name as uploadedByName FROM drive_files df LEFT JOIN users u ON u.id = df.uploaded_by WHERE df.parent_id = ? ORDER BY df.type = 'folder' DESC, df.created_at DESC";
      params = [parentId];
    } else {
      sql = "SELECT df.*, u.name as uploadedByName FROM drive_files df LEFT JOIN users u ON u.id = df.uploaded_by WHERE df.parent_id IS NULL ORDER BY df.type = 'folder' DESC, df.created_at DESC";
      params = [];
    }
    const [rows] = await pool.execute(sql, params);
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
    const [u] = await pool.execute("SELECT name FROM users WHERE id = ?", [req.user.id]);
    const userName = (u as any[])[0]?.name || 'Unknown';
    io.emit('drive:update', { id, name, type: 'folder', parentId, uploadedByName: userName });
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
    const [u] = await pool.execute("SELECT name FROM users WHERE id = ?", [req.user.id]);
    const userName = (u as any[])[0]?.name || 'Unknown';
    io.emit('drive:update', { id, name, mimeType, size, type: 'file', parentId, uploadedByName: userName });
    reply.send({ id, success: true });
  });

  app.put('/drive/:id', async (req, reply) => {
    const { id } = req.params as any;
    const { name } = req.body as any;
    await pool.execute("UPDATE drive_files SET name = ? WHERE id = ?", [name, id]);
    io.emit('drive:update', { id, name, action: 'rename' });
    reply.send({ success: true });
  });

  app.delete('/drive/:id', async (req, reply) => {
    const { id } = req.params as any;
    await pool.execute("DELETE FROM drive_files WHERE id = ?", [id]);
    // Also delete children
    await pool.execute("DELETE FROM drive_files WHERE parent_id = ?", [id]);
    io.emit('drive:update', { id, action: 'delete' });
    reply.send({ success: true });
  });
}