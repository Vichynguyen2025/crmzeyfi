import { mysqlTable, varchar, text, int, float, decimal, date, timestamp, mysqlEnum, json } from 'drizzle-orm/mysql-core';

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
export const driveFiles = mysqlTable('drive_files', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['file', 'folder']).default('file'),
  mimeType: varchar('mime_type', { length: 100 }),
  size: int('size').default(0),
  url: varchar('url', { length: 500 }),
  parentId: varchar('parent_id', { length: 36 }),
  uploadedBy: varchar('uploaded_by', { length: 36 }).references(() => users.id),
  teamId: varchar('team_id', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
});
export const mediaChannels = mysqlTable('media_channels', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  url: varchar('url', { length: 500 }),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id, { onDelete: 'set null' }),
  assignedTo: varchar('assigned_to', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 0 }).default('0'),
  category: varchar('category', { length: 100 }),
  imageUrl: varchar('image_url', { length: 500 }),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id, { onDelete: 'set null' }),
  status: mysqlEnum('status', ['active', 'inactive', 'draft']).default('active'),
  createdBy: varchar('created_by', { length: 36 }).references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teamKpis = mysqlTable('team_kpis', {
  id: varchar('id', { length: 36 }).primaryKey(),
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  product: varchar('product', { length: 255 }),
  dailyBudget: int('daily_budget').default(0),
  dailyMessages: int('daily_messages').default(0),
  monthlyOrders: int('monthly_orders').default(0),
  month: varchar('month', { length: 7 }).default(''),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const teamActuals = mysqlTable('team_actuals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  teamId: varchar('team_id', { length: 36 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  product: varchar('product', { length: 255 }).default(''),
  actualOrders: int('actual_orders').default(0),
  fixedCost: int('fixed_cost').default(0),
  costPerOrder: int('cost_per_order').default(0),
  date: date('date'),
  weekStart: date('week_start'),
  month: varchar('month', { length: 7 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teamDailyPerf = mysqlTable('team_daily_perf', {
  id: varchar('id', { length: 36 }).primaryKey(),
  teamId: varchar('team_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  product: varchar('product', { length: 255 }).default(''),
  date: date('date'),
  totalCost: int('total_cost').default(0),
  reach: int('reach').default(0),
  clicks: int('clicks').default(0),
  messages: int('messages').default(0),
  orders: int('orders').default(0),
  cancelledOrders: int('cancelled_orders').default(0),
  month: varchar('month', { length: 7 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// SEO Kế hoạch & KPI
export const seoPlans = mysqlTable('seo_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  period: varchar('period', { length: 7 }).notNull(),
  objective: text('objective'),
  kpi: varchar('kpi', { length: 255 }),
  task: varchar('task', { length: 255 }).notNull(),
  assigneeId: varchar('assignee_id', { length: 36 }).references(() => users.id),
  deadline: date('deadline'),
  plannedQty: int('planned_qty').default(0),
  completedQty: int('completed_qty').default(0),
  status: mysqlEnum('status', ['not_started','in_progress','completed','overdue','paused']).default('not_started'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SEO Báo cáo công việc
export const seoWorkReports = mysqlTable('seo_work_reports', {
  id: varchar('id', { length: 36 }).primaryKey(),
  date: date('date').notNull(),
  employeeId: varchar('employee_id', { length: 36 }).notNull().references(() => users.id),
  category: varchar('category', { length: 100 }),
  task: varchar('task', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }),
  qty: int('qty').default(0),
  status: mysqlEnum('status', ['pending','in_progress','completed','paused','overdue']).default('pending'),
  completionPercent: int('completion_percent').default(0),
  planId: varchar('plan_id', { length: 36 }).references(() => seoPlans.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SEO Kết quả
export const seoResults = mysqlTable('seo_results', {
  id: varchar('id', { length: 36 }).primaryKey(),
  date: date('date').notNull(),
  keyword: varchar('keyword', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }),
  prevRank: int('prev_rank'),
  currRank: int('curr_rank'),
  clicks: int('clicks').default(0),
  impressions: int('impressions').default(0),
  ctr: float('ctr'),
  traffic: int('traffic').default(0),
  leads: int('leads').default(0),
  orders: int('orders').default(0),
  revenue: float('revenue').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
