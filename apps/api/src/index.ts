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
import driveRoutes from './routes/drive';
import drivePreviewRoutes from './routes/drive-preview';;
import channelsRoutes from './routes/channels';
import productsRoutes from './routes/products';
import kpiRoutes from './routes/kpis';
import actualRoutes from './routes/actuals';
import dailyPerfRoutes from './routes/daily-perf';
import seoRoutes from './routes/seo';
import adRoutes from './routes/ads';
import teamModulesRoutes from './routes/team-modules';
import socialContentRoutes from './routes/social-content';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ socketPath: '/tmp/mysql.sock', user: 'root', password: '8ffcb61af33a11f0', database: 'crmzeyfi', waitForConnections: true, connectionLimit: 5 });

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'zeyfi-secret';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; role: string };
  }
}

const app = Fastify({ logger: true, bodyLimit: 524288000 });
export const io = new Server(app.server, { cors: { origin: '*' } });
app.decorate('io', io);
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
  app.addContentTypeParser('multipart/form-data', { parseAs: 'buffer', bodyLimit: 524288000 }, async (_req: any, body: Buffer) => { return { raw: body }; });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(teamRoutes, { prefix: '/api' });
  await app.register(reportRoutes, { prefix: '/api' });
  await app.register(taskRoutes, { prefix: '/api' });
  await app.register(customerRoutes, { prefix: '/api' });
  await app.register(adCostRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(driveRoutes, { prefix: '/api' });
  await app.register(drivePreviewRoutes, { prefix: '/api' });
  await app.register(channelsRoutes, { prefix: '/api' });
  await app.register(productsRoutes, { prefix: '/api' });
  await app.register(kpiRoutes, { prefix: '/api' });
  await app.register(actualRoutes, { prefix: '/api' });
  await app.register(dailyPerfRoutes, { prefix: '/api' });
  await app.register(adRoutes, { prefix: '/api' });
  await app.register(socialContentRoutes, { prefix: '/api' });
  await app.register(teamModulesRoutes, { prefix: '/api' });
  await app.register(seoRoutes, { prefix: '/api' });
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log('[CRM Zeyfi] API running on port ' + PORT);
}
start();

// Export io for routes
io.on('connection', (socket) => {
  console.log('[CRM] WS connected:', socket.id);
  socket.on('join:team', (tid: string) => socket.join('team:' + tid));
});