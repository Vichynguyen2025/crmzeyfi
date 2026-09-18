import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '8ffcb61af33a11f0',
    database: process.env.DB_NAME || 'crmzeyfi',
  },
});