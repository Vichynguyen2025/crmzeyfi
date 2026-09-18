import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { db } from './db/index';
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import reportRoutes from './routes/reports';
import taskRoutes from './routes/tasks';
import customerRoutes from './routes/customers';
import adCostRoutes from './routes/ad-costs';
import dashboardRoutes from './routes/dashboard';

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'zeyfi-secret';

const app = Fastify({ logger: true });

async function buildApp() {
  await app.register(cors, { origin: true });

// JWT payload
declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; role: string };
  }
}

// Auth decorator
app.decorateRequest('user', null);
app.addHook('onRequest', async (req, reply) => {
  const header = req.headers.authorization;
  if (!header) return;
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET) as any;
  } catch {}
});

// HTTP server + Socket.io
const httpServer = createServer(app.server);
export const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('[CRM] WS connected:', socket.id);
  socket.on('join:team', (tid: string) => socket.join('team:' + tid));
});

// Register routes
app.register(authRoutes, { prefix: '/api' });
app.register(teamRoutes, { prefix: '/api' });
app.register(reportRoutes, { prefix: '/api' });
app.register(taskRoutes, { prefix: '/api' });
app.register(customerRoutes, { prefix: '/api' });
app.register(adCostRoutes, { prefix: '/api' });
await app.register(dashboardRoutes, { prefix: '/api' });

  // Start
  await app.ready();
  httpServer.listen(PORT, () => {
    console.log('[CRM Zeyfi] API running on port ' + PORT);
  });
}

buildApp();