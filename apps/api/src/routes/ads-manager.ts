import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

// Convert Facebook ISO datetime (e.g. 2026-10-05T11:37:14+0700) to MySQL DATETIME
function fbDate(v: any): string | null {
  if (!v) return null;
  const s = String(v).replace('+0700', 'Z').replace('+0000', 'Z');
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(v).slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export default async function (app: FastifyInstance) {
  // ─── App Config ─────────────────────────────────────
  app.get('/ads-manager/config', async (_req, reply) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM ads_app_config LIMIT 1");
      const cfg = (rows as any[])[0];
      if (!cfg) return reply.send(null);
      reply.send({ app_id: cfg.app_id, app_secret: cfg.app_secret ? cfg.app_secret.slice(0, 4) + '••••' + cfg.app_secret.slice(-4) : '', access_token: cfg.access_token ? cfg.access_token.slice(0, 8) + '••••' + cfg.access_token.slice(-4) : '' });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/ads-manager/config', async (req, reply) => {
    const { app_id, app_secret, access_token } = req.body as any;
    if (!app_id || !app_secret) return reply.status(400).send({ error: 'Missing app_id or app_secret' });
    try {
      const [existing] = await pool.execute("SELECT * FROM ads_app_config LIMIT 1");
      if ((existing as any[]).length > 0) {
        await pool.execute("UPDATE ads_app_config SET app_id = ?, app_secret = ?, access_token = ? WHERE id = ?", [app_id, app_secret, access_token || null, (existing as any[])[0].id]);
      } else {
        await pool.execute("INSERT INTO ads_app_config (app_id, app_secret, access_token) VALUES (?, ?, ?)", [app_id, app_secret, access_token || null]);
      }
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Members ────────────────────────────────────────
  app.get("/ads-manager/members", async (_req, reply) => {
    try {
      const [rows] = await pool.execute("SELECT u.id, u.name, u.email FROM user_modules um JOIN users u ON u.id = um.user_id WHERE um.module_key = 'ads'");
      reply.send(rows);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post("/ads-manager/members", async (req, reply) => {
    if (!req.user || req.user?.role !== "admin") return reply.status(403).send({ error: "Only admin" });
    try {
      const { userId } = req.body as any;
      await pool.execute("INSERT IGNORE INTO user_modules (id, user_id, module_key) VALUES (?, ?, ?)", [uuid(), userId, "ads"]);
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.delete("/ads-manager/members/:userId", async (req, reply) => {
    if (!req.user || req.user?.role !== "admin") return reply.status(403).send({ error: "Only admin" });
    try { const { userId } = req.params as any;
      await pool.execute("DELETE FROM user_modules WHERE user_id = ? AND module_key = ?", [userId, "ads"]);
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Ad Accounts ──────────────────────────────────
  app.get('/ads-manager/accounts', async (_req, reply) => {
    try {
      const [rows] = await pool.execute("SELECT id, name, ad_account_id, bm_name, active, balance, amount_spent, billing_threshold, spend_cap, account_status, currency, sync_error, last_sync_at, created_at FROM ads_accounts ORDER BY created_at DESC");
      reply.send(rows);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/ads-manager/accounts', async (req, reply) => {
    const { name, adAccountId, bmName } = req.body as any;
    if (!name || !adAccountId) return reply.status(400).send({ error: 'Missing name or adAccountId' });
    try {
      const id = uuid();
      const cleanId = adAccountId.replace(/^act_/i, '');
      await pool.execute("INSERT INTO ads_accounts (id, name, ad_account_id, bm_name) VALUES (?, ?, ?, ?)", [id, name, cleanId, bmName || '']);
      reply.send({ success: true, id });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.delete('/ads-manager/accounts/:id', async (req, reply) => {
    const { id } = req.params as any;
    try { await pool.execute("DELETE FROM ads_accounts WHERE id = ?", [id]); reply.send({ success: true }); } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.put('/ads-manager/accounts/:id/toggle', async (req, reply) => {
    const { id } = req.params as any; const { active } = req.body as any;
    try { await pool.execute("UPDATE ads_accounts SET active = ? WHERE id = ?", [active ? 1 : 0, id]); reply.send({ success: true }); } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.put('/ads-manager/accounts/:id/threshold', async (req, reply) => {
    const { id } = req.params as any; const { billing_threshold } = req.body as any;
    try { await pool.execute("UPDATE ads_accounts SET billing_threshold = ? WHERE id = ?", [billing_threshold || 0, id]); reply.send({ success: true }); } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Fetch accounts from Facebook API ──────────────
  app.get('/ads-manager/fetch-accounts', async (_req, reply) => {
    try {
      const [cfgRows] = await pool.execute("SELECT access_token FROM ads_app_config LIMIT 1");
      const cfg = (cfgRows as any[])[0];
      if (!cfg?.access_token) return reply.status(400).send({ error: 'Chưa cấu hình Access Token' });
      const url = `https://graph.facebook.com/v21.0/me/adaccounts?fields=name,account_id,currency,balance,amount_spent,business_name,account_status&access_token=${(cfg.access_token||'').trim()}&limit=100`;
      const res = await fetch(url);
      const data = await res.json() as any;
      if (data.error) return reply.status(400).send({ error: data.error.message });
      reply.send({ accounts: (data.data || []).map((a: any) => ({ name: a.name, account_id: a.account_id, currency: a.currency||'VND', balance: a.balance||0, amount_spent: a.amount_spent||0, business_name: a.business_name||'', account_status: a.account_status||0 })) });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Sync + Campaigns ──────────────────────────────
  app.post('/ads-manager/sync', async (_req, reply) => {
    try {
      const [cfgRows] = await pool.execute("SELECT * FROM ads_app_config LIMIT 1");
      const cfg = (cfgRows as any[])[0];
      if (!cfg) return reply.status(400).send({ error: 'Chưa cấu hình Facebook App' });
      const { app_id, app_secret, access_token } = cfg;
      const accessToken = (access_token || '').trim() || (app_id + '|' + app_secret);

      const [accRows] = await pool.execute("SELECT id, ad_account_id FROM ads_accounts WHERE active = 1");
      const accounts = accRows as any[];
      let synced = 0, errors = 0;

      for (const acc of accounts) {
        try {
          const adAccountId = 'act_' + acc.ad_account_id;
          // 1. Sync account balance etc
          const url = `https://graph.facebook.com/v21.0/${adAccountId}?fields=balance,currency,amount_spent,spend_cap,account_status&access_token=${accessToken}`;
          const res = await fetch(url);
          const data = await res.json() as any;
          if (data.error) {
            await pool.execute("UPDATE ads_accounts SET sync_error = ?, last_sync_at = NOW() WHERE id = ?", [data.error.message?.slice(0,500)||'Unknown', acc.id]);
            errors++;
            continue;
          }
          await pool.execute("UPDATE ads_accounts SET balance=?, currency=?, amount_spent=?, spend_cap=?, account_status=?, sync_error=NULL, last_sync_at=NOW() WHERE id=?", [data.balance??0, data.currency||'VND', data.amount_spent??0, data.spend_cap??0, data.account_status??0, acc.id]);

          // 2. Sync campaigns
          const campUrl = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?fields=name,status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time&access_token=${accessToken}&limit=100`;
          const campRes = await fetch(campUrl);
          const campData = await campRes.json() as any;
          if (!campData.error && campData.data) {
            for (const camp of campData.data) {
              await pool.execute(
                "INSERT INTO ads_campaigns (id, account_id, campaign_id, name, status, daily_budget, lifetime_budget, created_time, updated_time, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), daily_budget=VALUES(daily_budget), lifetime_budget=VALUES(lifetime_budget), updated_time=VALUES(updated_time), end_time=VALUES(end_time), last_synced=NOW()",
                [uuid(), acc.id, camp.id, camp.name, camp.status||'', Number(camp.daily_budget||0), Number(camp.lifetime_budget||0), fbDate(camp.created_time), fbDate(camp.updated_time), fbDate(camp.start_time), fbDate(camp.stop_time)]
              );

              // 3. Fetch campaign insights (daily) + actions for messages
              const insUrl = `https://graph.facebook.com/v21.0/${camp.id}/insights?fields=spend,impressions,clicks,ctr,cpm,reach,frequency,cpc,actions&time_increment=1&access_token=${accessToken}&limit=90`;
              const insRes = await fetch(insUrl);
              const insData = await insRes.json() as any;
              if (!insData.error && insData.data) {
                for (const row of insData.data) {
                  const dateStr = row.date_start || '';
                  if (!dateStr) continue;
                  // Messages = actions containing conversation/message/messenger
                  let messages = 0;
                  if (Array.isArray(row.actions)) {
                    for (const a of row.actions) {
                      const t = String(a.action_type || '').toLowerCase();
                      if (t.includes('conversation') || t.includes('messenger') || t.includes('message_send') || t.includes('chat')) {
                        messages += Number(a.value || 0);
                      }
                    }
                  }
                  const spend = Number(row.spend||0);
                  const costPerMsg = messages > 0 ? Math.round(spend / messages) : 0;
                  await pool.execute(
                    "INSERT INTO ads_campaign_stats (id, campaign_id, date, spend, impressions, clicks, ctr, cpm, reach, frequency, cpc, messages, cost_per_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE spend=VALUES(spend), impressions=VALUES(impressions), clicks=VALUES(clicks), ctr=VALUES(ctr), cpm=VALUES(cpm), reach=VALUES(reach), frequency=VALUES(frequency), cpc=VALUES(cpc), messages=VALUES(messages), cost_per_message=VALUES(cost_per_message)",
                    [uuid(), camp.id, dateStr, spend, Number(row.impressions||0), Number(row.clicks||0), Number(row.ctr||0), Number(row.cpm||0), Number(row.reach||0), Number(row.frequency||0), Number(row.cpc||0), messages, costPerMsg]
                  );
                }
              }
            }
          }
          synced++;
        } catch (e: any) {
          await pool.execute("UPDATE ads_accounts SET sync_error = ?, last_sync_at = NOW() WHERE id = ?", ['Lỗi: ' + (e.message?.slice(0,200)||'Unknown'), acc.id]);
          errors++;
        }
      }
      reply.send({ synced, errors });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Campaigns by account ──────────────────────────
  app.get('/ads-manager/campaigns/:accountId', async (req, reply) => {
    const { accountId } = req.params as any;
    try {
      const [camps] = await pool.execute(
        "SELECT c.*, cs.spend as last_spend, cs.impressions as last_impressions, cs.clicks as last_clicks, cs.ctr as last_ctr, cs.cpm as last_cpm, cs.reach as last_reach, cs.frequency as last_frequency, cs.cpc as last_cpc, cs.messages as last_messages, cs.cost_per_message as last_cost_per_message, cs.date as last_stat_date FROM ads_campaigns c LEFT JOIN (SELECT cs1.* FROM ads_campaign_stats cs1 INNER JOIN (SELECT campaign_id, MAX(date) as max_date FROM ads_campaign_stats GROUP BY campaign_id) cs2 ON cs1.campaign_id = cs2.campaign_id AND cs1.date = cs2.max_date) cs ON cs.campaign_id = c.campaign_id WHERE c.account_id = ? ORDER BY c.status, c.name",
        [accountId]
      );
      reply.send(camps);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Campaign history (chart data) ─────────────────
  app.get('/ads-manager/campaign-stats/:campaignId', async (req, reply) => {
    const { campaignId } = req.params as any;
    try {
      const [stats] = await pool.execute("SELECT * FROM ads_campaign_stats WHERE campaign_id = ? ORDER BY date ASC", [campaignId]);
      reply.send(stats);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });
}