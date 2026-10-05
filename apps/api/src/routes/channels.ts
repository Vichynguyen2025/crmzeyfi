import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  app.get('/channels', async (_req, reply) => {
    const [rows] = await pool.execute(
      "SELECT mc.*, t.name as teamName, u.name as assignedToName FROM media_channels mc LEFT JOIN teams t ON t.id = mc.team_id LEFT JOIN users u ON u.id = mc.assigned_to ORDER BY mc.platform, mc.name"
    );
    reply.send(rows);
  });

  app.post('/channels', async (req, reply) => {
    const { name, platform, url, teamId, assignedTo, notes } = req.body as any;
    const id = uuid();
    await pool.execute(
      "INSERT INTO media_channels (id, name, platform, url, team_id, assigned_to, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, platform, url, teamId || null, assignedTo || null, notes || '']
    );
    io.emit('channel:update', { action: 'create', id });
    reply.send({ id, success: true });
  });

  app.put('/channels/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    const { name, platform, url, teamId, assignedTo, notes } = req.body as any;
    await pool.execute(
      "UPDATE media_channels SET name=?, platform=?, url=?, team_id=?, assigned_to=?, notes=? WHERE id=?",
      [name, platform, url, teamId || null, assignedTo || null, notes || '', id]
    );
    io.emit('channel:update', { action: 'update', id });
    reply.send({ success: true });
  });

  app.delete('/channels/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') return reply.status(403).send({ error: 'Only admin or manager' });
    const { id } = req.params as any;
    await pool.execute("DELETE FROM media_channels WHERE id = ?", [id]);
    io.emit('channel:update', { action: 'delete', id });
    reply.send({ success: true });
  });

  // ─── Fanpage Growth ──────────────────────────────
  app.get('/channels/pages', async (_req, reply) => {
    try {
      const [channels] = await pool.execute(
        "SELECT mc.*, COALESCE(s.fans_total, 0) as fans_total, COALESCE(s.fans_added, 0) as fans_added, COALESCE(s.impressions, 0) as impressions, COALESCE(s.reach, 0) as reach, COALESCE(s.engaged_users, 0) as engaged_users, s.date as last_stat_date FROM media_channels mc LEFT JOIN (SELECT cs1.* FROM channel_page_stats cs1 INNER JOIN (SELECT page_id, MAX(date) as max_date FROM channel_page_stats GROUP BY page_id) cs2 ON cs1.page_id = cs2.page_id AND cs1.date = cs2.max_date) s ON s.channel_id = mc.id WHERE mc.platform = 'Facebook' ORDER BY mc.name"
      );
      reply.send(channels);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/channels/pages/sync', async (_req, reply) => {
    try {
      const [cfgRows] = await pool.execute("SELECT access_token FROM ads_app_config LIMIT 1");
      const cfg = (cfgRows as any[])[0];
      if (!cfg?.access_token) return reply.status(400).send({ error: 'Chưa cấu hình Access Token trong Quản lý Quảng cáo' });

      const token = cfg.access_token.trim();
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString().split('T')[0];
      const until = today.toISOString().split('T')[0];

      const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,id,followers_count&access_token=${encodeURIComponent(token)}&limit=100`);
      const pagesData = await pagesRes.json() as any;
      if (pagesData.error) return reply.status(400).send({ error: pagesData.error.message });

      const pages = pagesData.data || [];
      let synced = 0, errors = 0;

      for (const page of pages) {
        try {
          const [existing] = await pool.execute("SELECT id FROM media_channels WHERE platform = 'Facebook' AND name = ?", [page.name]);
          let channelId: string;
          if ((existing as any[]).length > 0) {
            channelId = (existing as any[])[0].id;
          } else {
            channelId = uuid();
            await pool.execute(
              "INSERT INTO media_channels (id, name, platform, url, notes) VALUES (?, ?, 'Facebook', ?, ?)",
              [channelId, page.name, `https://facebook.com/${page.id}`, 'Tự động đồng bộ từ Facebook']
            );
            io.emit('channel:update', { action: 'create', id: channelId });
          }

          const insRes = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}/insights?metric=page_fans,page_fan_adds,page_fan_removes,page_impressions,page_engaged_users,page_views_total&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(token)}`
          );
          const insData = await insRes.json() as any;
          if (insData.error) { errors++; continue; }

          const metrics: Record<string, any[]> = {};
          for (const m of insData.data || []) {
            metrics[m.name] = m.values || [];
          }

          const maxLen = Math.max(...Object.values(metrics).map((v: any) => v?.length || 0), 1);
          for (let i = 0; i < maxLen; i++) {
            const dateStr = metrics['page_fans']?.[i]?.end_time?.split('T')[0] || metrics['page_fan_adds']?.[i]?.end_time?.split('T')[0] || '';
            if (!dateStr) continue;
            await pool.execute(
              `INSERT IGNORE INTO channel_page_stats (id, page_id, channel_id, fans_total, fans_added, fans_removed, impressions, engaged_users, date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [uuid(), page.id, channelId, metrics['page_fans']?.[i]?.value ?? 0, metrics['page_fan_adds']?.[i]?.value ?? 0,
               metrics['page_fan_removes']?.[i]?.value ?? 0, metrics['page_impressions']?.[i]?.value ?? 0,
               metrics['page_engaged_users']?.[i]?.value ?? 0, dateStr]
            );
          }

          // Update total followers count from the page endpoint
          await pool.execute(
            `UPDATE channel_page_stats SET fans_total = ? WHERE page_id = ? AND date = ?`,
            [page.followers_count || 0, page.id, today.toISOString().split('T')[0]]
          );

          synced++;
        } catch (e: any) { errors++; }
      }

      reply.send({ synced, errors, total_pages: pages.length });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });
}