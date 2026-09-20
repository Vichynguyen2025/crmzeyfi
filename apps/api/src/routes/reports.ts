import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db, pool } from '../db/index';
import { reportColumns, dailyReports } from '../db/schema';
import { eq, between, and, sql } from 'drizzle-orm';
import { io } from '../index';

export default async function (app: FastifyInstance) {
  // Columns CRUD (admin realtime)
  app.get('/reports/columns', async (req, reply) => {
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    reply.send(cols);
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});

  app.post('/reports/columns', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const { name, type, position } = req.body as any;
    const id = uuid();
    await db.insert(reportColumns).values({ id, name, type: type || 'text', position: position || 0 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    io.emit('columns:updated', cols);
    reply.send({ id, ...req.body 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});

  app.put('/reports/columns/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const { id } = req.params as any;
    const { name, type, position } = req.body as any;
    await db.update(reportColumns).set({ name, type, position }).where(eq(reportColumns.id, id));
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    io.emit('columns:updated', cols);
    reply.send(cols);
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});

  app.delete('/reports/columns/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const { id } = req.params as any;
    await db.delete(reportColumns).where(eq(reportColumns.id, id));
    const cols = await db.select().from(reportColumns).orderBy(reportColumns.position);
    io.emit('columns:updated', cols);
    reply.send(cols);
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});

  // Daily reports
  app.get('/reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const query = req.query as any;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
    const teamId = query.teamId || '';
    
    let whereClause = isAdmin ? "WHERE 1=1" : "WHERE dr.user_id = ?";
    const params: any[] = isAdmin ? [] : [req.user.id];
    if (teamId) { whereClause += " AND dr.team_id = ?"; params.push(teamId); }
    
    const [rows] = await pool.execute(
      "SELECT dr.id, dr.user_id, dr.team_id, DATE_FORMAT(dr.date, '%Y-%m-%d') as date, dr.data, dr.created_at, u.name as user_name, u.avatar as user_avatar FROM daily_reports dr JOIN users u ON u.id = dr.user_id " +
      whereClause +
      " ORDER BY dr.date DESC, dr.created_at DESC",
      params
    );
    reply.send(rows);
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});

  app.post('/reports', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const { date, teamId, data } = req.body as any;
    const id = uuid();
    const tid = teamId || null;
    await db.insert(dailyReports).values({ id, userId: req.user.id, teamId: tid, date, data 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    
    // Get user info for realtime broadcast
    const [u] = await pool.execute("SELECT name, avatar FROM users WHERE id = ?", [req.user.id]);
    const user = (u as any[])[0] || { name: req.user.email };
    io.emit('report:new', { id, userId: req.user.id, teamId, date, data, userName: user.name 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    reply.send({ id, success: true 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
  app.delete('/reports/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Only admin' 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    const { id } = req.params as any;
    await db.delete(dailyReports).where(eq(dailyReports.id, id));
    io.emit('report:deleted', { id 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
    reply.send({ success: true 
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});
  
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
})
  app.get('/reports/received', async (req, reply) => {
    const { userId } = req.query as any;
    if (!userId) return reply.send([]);
    const [rows] = await pool.execute("SELECT * FROM daily_reports WHERE JSON_CONTAINS(data, ?)", ['"' + userId + '"']);
    // Actually we need to search in the recipients array, not just a single value
    const [allRows] = await pool.execute("SELECT * FROM daily_reports ORDER BY created_at DESC");
    const filtered = (allRows as any[]).filter(r => {
      try {
        const d = JSON.parse(r.data || '{}');
        return Array.isArray(d.recipients) && d.recipients.includes(userId);
      } catch { return false; }
    });
    reply.send(filtered);
  });
});