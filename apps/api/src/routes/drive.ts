import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';
import fs from 'fs';
import path from 'path';

export default async function (app: FastifyInstance) {
  app.get('/drive', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const q = req.query as any;
    let sql = "SELECT df.*, u.name as uploadedByName FROM drive_files df LEFT JOIN users u ON u.id = df.uploaded_by";
    const params: any[] = [];
    if (q.parentId) { sql += " WHERE df.parent_id = ?"; params.push(q.parentId); }
    else { sql += " WHERE df.parent_id IS NULL"; }
    sql += " ORDER BY df.type DESC, df.created_at DESC";
    const [rows] = await pool.execute(sql, params);
    reply.send(rows);
  });

  app.post('/drive/folder', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, parentId } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO drive_files (id, name, type, uploaded_by, parent_id) VALUES (?, ?, 'folder', ?, ?)",
      [id, name, req.user.id || '', parentId || null]
    );
    io.emit('drive:update', { id, name, action: 'create' });
    reply.send({ success: true, id });
  });

  // Upload file: receive base64 data
  app.post('/drive/upload', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { name, mimeType, size, data, parentId } = req.body as any;
    const id = uuid();
    let url = '';
    // Save file to disk if base64 data provided
    if (data) {
      const uploadDir = '/opt/crmzeyfi-ts/uploads';
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const ext = path.extname(name);
      const savedName = id + ext;
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(path.join(uploadDir, savedName), buffer);
      url = '/uploads/' + savedName;
    }
    await pool.execute(
      "INSERT INTO drive_files (id, name, type, mime_type, size, url, parent_id, uploaded_by) VALUES (?, ?, 'file', ?, ?, ?, ?, ?)",
      [id, name, mimeType || '', size || 0, url, parentId || null, req.user.id || '']
    );
    io.emit('drive:update', { id, name, action: 'upload' });
    reply.send({ success: true, id, url });
  });

  app.put('/drive/:id', async (req, reply) => {
    const { id } = req.params as any;
    const { name, parentId } = req.body as any;
    if (name !== undefined) {
      await pool.execute("UPDATE drive_files SET name = ? WHERE id = ?", [name, id]);
      io.emit('drive:update', { id, name, action: 'rename' });
    }
    if (parentId !== undefined) {
      await pool.execute("UPDATE drive_files SET parent_id = ? WHERE id = ?", [parentId || null, id]);
      await pool.execute("UPDATE drive_files SET parent_id = ? WHERE parent_id = ?", [parentId || null, id]);
      io.emit('drive:update', { id, parentId, action: 'move' });
    }
    reply.send({ success: true });
  });

  app.delete('/drive/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    // Check permission: only admin or uploader can delete
    const [rows] = await pool.execute("SELECT uploaded_by FROM drive_files WHERE id = ?", [id]);
    const file = (rows as any[])[0];
    if (!file) return reply.status(404).send({ error: 'File not found' });
    if (req.user.role !== 'admin' && req.user.id !== file.uploaded_by) {
      return reply.status(403).send({ error: 'Only admin or uploader can delete' });
    }
    await pool.execute("DELETE FROM drive_files WHERE id = ?", [id]);
    await pool.execute("DELETE FROM drive_files WHERE parent_id = ?", [id]);
    io.emit('drive:update', { id, action: 'delete' });
    reply.send({ success: true });
  });
}