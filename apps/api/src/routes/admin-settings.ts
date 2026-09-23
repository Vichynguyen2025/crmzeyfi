import { FastifyInstance } from 'fastify';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  app.get('/admin/settings', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const [rows] = await pool.execute("SELECT `key`, `value` FROM site_settings");
    const settings: Record<string, string> = {};
    for (const r of rows as any[]) settings[r.key] = r.value;
    reply.send(settings);
  });

  app.put('/admin/settings', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' });
    const body = req.body as any;
    const allowed = ['site_name', 'favicon', 'font_scale', 'primary_color', 'border_radius'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        await pool.execute("INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?", [key, body[key], body[key]]);
      }
    }
    reply.send({ success: true });
  });

  app.get('/admin/settings/public', async (req, reply) => {
    const [rows] = await pool.execute("SELECT `key`, `value` FROM site_settings WHERE `key` IN ('site_name', 'favicon', 'font_scale', 'primary_color', 'border_radius')");
    const settings: Record<string, string> = {};
    for (const r of rows as any[]) settings[r.key] = r.value;
    reply.send(settings);
  });
}