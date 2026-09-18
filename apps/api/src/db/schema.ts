import { mysqlTable, varchar, text, int, decimal, date, timestamp, mysqlEnum, json } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  position: varchar('position', { length: 100 }),
  bio: text('bio'),
  hometown: varchar('hometown', { length: 100 }),
  joinDate: date('join_date'),
  lastSeen: timestamp('last_seen'),
  role: mysqlEnum('role', ['admin', 'manager', 'member']).default('member'),
  avatar: varchar('avatar', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teams = mysqlTable('teams', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }).default('#4f46e5'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teamMembers = mysqlTable('team_members', {
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const reportColumns = mysqlTable('report_columns', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: mysqlEnum('type', ['text','number','money','customer']).default('text'),
  position: int('position').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dailyReports = mysqlTable('daily_reports', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  data: json('data').$type<Record<string, string>>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = mysqlTable('tasks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  assigneeId: varchar('assignee_id', { length: 36 }).references(() => users.id),
  status: mysqlEnum('status', ['todo','in_progress','review','done']).default('todo'),
  priority: mysqlEnum('priority', ['low','medium','high','urgent']).default('medium'),
  dueDate: date('due_date'),
  position: int('position').default(0),
  createdBy: varchar('created_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 255 }),
  source: varchar('source', { length: 50 }),
  social: varchar('social', { length: 255 }),
  notes: text('notes'),
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  assigneeId: varchar('assignee_id', { length: 36 }).references(() => users.id),
  contactCount: int('contact_count').default(0),
  lastContact: date('last_contact'),
  lastContactNote: text('last_contact_note'),
  status: mysqlEnum('status', ['new','contacted','qualified','converted','lost']).default('new'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adCosts = mysqlTable('ad_costs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});