import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/index';

export default async function (app: FastifyInstance) {
  // ─── App Config ─────────────────────────────────────
  app.get('/ads-manager/config', async (_req, reply) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM ads_app_config LIMIT 1");
      const cfg = (rows as any[])[0];
      if (!cfg) return reply.send(null);
      // Never expose app_secret to frontend in production — send masked
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

  // ─── Ad Accounts ──────────────────────────────────
  app.get('/ads-manager/accounts', async (_req, reply) => {
    try {
      const [rows] = await pool.execute(
        "SELECT id, name, ad_account_id, bm_name, active, balance, amount_spent,  spend_cap, account_status, currency, sync_error, last_sync_at, created_at FROM ads_accounts ORDER BY created_at DESC"
      );
      reply.send(rows);
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.post('/ads-manager/accounts', async (req, reply) => {
    const { name, adAccountId, bmName } = req.body as any;
    if (!name || !adAccountId) return reply.status(400).send({ error: 'Missing name or adAccountId' });
    try {
      const id = uuid();
      // Normalise: remove 'act_' prefix if user includes it
      const cleanId = adAccountId.replace(/^act_/i, '');
      await pool.execute(
        "INSERT INTO ads_accounts (id, name, ad_account_id, bm_name) VALUES (?, ?, ?, ?)",
        [id, name, cleanId, bmName || '']
      );
      reply.send({ success: true, id });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.delete('/ads-manager/accounts/:id', async (req, reply) => {
    const { id } = req.params as any;
    try {
      await pool.execute("DELETE FROM ads_accounts WHERE id = ?", [id]);
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.put('/ads-manager/accounts/:id/toggle', async (req, reply) => {
    const { id } = req.params as any;
    const { active } = req.body as any;
    try {
      await pool.execute("UPDATE ads_accounts SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  app.put('/ads-manager/accounts/:id/threshold', async (req, reply) => {
    const { id } = req.params as any;
    const { billing_threshold } = req.body as any;
    try {
      await pool.execute("UPDATE ads_accounts SET billing_threshold = ? WHERE id = ?", [billing_threshold || 0, id]);
      reply.send({ success: true });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });

  // ─── Fetch accounts from Facebook API ──────────────
  app.get('/ads-manager/fetch-accounts', async (_req, reply) => {
    try {
      const [cfgRows] = await pool.execute("SELECT access_token FROM ads_app_config LIMIT 1");
      const cfg = (cfgRows as any[])[0];
      if (!cfg?.access_token) return reply.status(400).send({ error: 'Chưa cấu hình Access Token' });

      const url = `https://graph.facebook.com/v21.0/me/adaccounts?fields=name,account_id,currency,balance,amount_spent,business_name,account_status&access_token=${cfg.access_token}&limit=100`;
      const res = await fetch(url);
      const data = await res.json() as any;

      if (data.error) return reply.status(400).send({ error: data.error.message });

      const accounts = (data.data || []).map((a: any) => ({
        name: a.name || '',
        account_id: a.account_id || '',
        currency: a.currency || 'VND',
        balance: a.balance || 0,
        amount_spent: a.amount_spent || 0,
        business_name: a.business_name || '',
        account_status: a.account_status || 0,
      }));
      reply.send({ accounts });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });
  app.post('/ads-manager/sync', async (_req, reply) => {
    try {
      // Get app config
      const [cfgRows] = await pool.execute("SELECT * FROM ads_app_config LIMIT 1");
      const cfg = (cfgRows as any[])[0];
      if (!cfg) return reply.status(400).send({ error: 'Chưa cấu hình Facebook App' });

      const { app_id, app_secret, access_token } = cfg;
      const accessToken = access_token || (app_id + '|' + app_secret);

      // Get all active accounts
      const [accRows] = await pool.execute("SELECT id, ad_account_id FROM ads_accounts WHERE active = 1");
      const accounts = accRows as any[];
      let synced = 0;
      let errors = 0;

      for (const acc of accounts) {
        try {
          const adAccountId = 'act_' + acc.ad_account_id;
          // Fetch balance, spend, threshold via Facebook Marketing API
          const url = `https://graph.facebook.com/v21.0/${adAccountId}?fields=balance,currency,amount_spent,spend_cap,account_status&access_token=${accessToken}`;
          const res = await fetch(url);
          const data = await res.json() as any;

          if (data.error) {
            await pool.execute(
              "UPDATE ads_accounts SET sync_error = ?, last_sync_at = NOW() WHERE id = ?",
              [data.error.message?.slice(0, 500) || 'Unknown error', acc.id]
            );
            errors++;
            continue;
          }

          await pool.execute(
            `UPDATE ads_accounts SET
              balance = ?, currency = ?, amount_spent = ?, spend_cap = ?,
              account_status = ?, sync_error = NULL, last_sync_at = NOW()
            WHERE id = ?`,
            [
              data.balance ?? 0, data.currency || 'VND', data.amount_spent ?? 0,
              data.spend_cap ?? 0, data.account_status ?? 0, acc.id
            ]
          );
          synced++;
        } catch (e: any) {
          await pool.execute(
            "UPDATE ads_accounts SET sync_error = ?, last_sync_at = NOW() WHERE id = ?",
            ['Lỗi kết nối Facebook API: ' + (e.message?.slice(0, 200) || 'Unknown'), acc.id]
          );
          errors++;
        }
      }

      reply.send({ synced, errors });
    } catch (e: any) { reply.status(500).send({ error: e.message }); }
  });
}