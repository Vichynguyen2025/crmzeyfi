import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.post('/drive/preview/:id', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = req.params as any;
    try {
      const [rows] = await pool.execute("SELECT * FROM drive_files WHERE id = ?", [id]);
      const files = rows as any[];
      if (!files.length) return reply.status(404).send({ error: 'Not found' });
      const file = files[0];
      const isOffice = ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ].includes(file.mime_type);

      if (!isOffice) return reply.send({ previewUrl: file.url });

      const uploadDir = '/opt/crmzeyfi-ts/uploads';
      const srcPath = path.join(uploadDir, file.url.replace('/uploads/', ''));
      if (!fs.existsSync(srcPath)) return reply.status(404).send({ error: 'File not found on disk' });

      const pdfName = file.id + '.pdf';
      const pdfPath = path.join(uploadDir, pdfName);
      if (!fs.existsSync(pdfPath)) {
        execSync(`export HOME=/root && libreoffice --headless --norestore --convert-to pdf --outdir "${uploadDir}" "${srcPath}" 2>/dev/null`, { timeout: 60000 });
      }
      if (fs.existsSync(pdfPath)) {
        reply.send({ previewUrl: '/uploads/' + pdfName, converted: true });
      } else {
        reply.send({ previewUrl: file.url, converted: false });
      }
    } catch (e: any) {
      reply.status(500).send({ error: e.message });
    }
  });
}