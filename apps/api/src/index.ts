import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import reportRoutes from './routes/reports';
import taskRoutes from './routes/tasks';
import customerRoutes from './routes/customers';
import adCostRoutes from './routes/ad-costs';
import dashboardRoutes from './routes/dashboard';
import usersRoutes from './routes/users';

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'zeyfi-secret';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; role: string };
  }
}

const app = Fastify({ logger: true });
app.decorateRequest('user', null);
app.addHook('onRequest', (req, reply, done) => {
  const header = req.headers.authorization;
  if (!header) { done(); return; }
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET) as any;
  } catch {}
  done();
});

async function start() {
  await app.register(cors, { origin: true });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(teamRoutes, { prefix: '/api' });
  await app.register(reportRoutes, { prefix: '/api' });
  await app.register(taskRoutes, { prefix: '/api' });
  await app.register(customerRoutes, { prefix: '/api' });
  await app.register(adCostRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log('[CRM Zeyfi] API running on port ' + PORT);
}
start();

// Export io for routes - created lazily when app.server is ready
export const io = new Server(app.server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  console.log('[CRM] WS connected:', socket.id);
  socket.on('join:team', (tid: string) => socket.join('team:' + tid));
});