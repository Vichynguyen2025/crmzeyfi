import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const pool = mysql.createPool({
  socketPath: '/tmp/mysql.sock',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '8ffcb61af33a11f0',
  database: process.env.DB_NAME || 'crmzeyfi',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+07:00',
});

export const db = drizzle(pool, { schema, mode: 'default' });
export { pool };