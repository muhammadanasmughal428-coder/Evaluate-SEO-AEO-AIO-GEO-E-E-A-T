import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (maps to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Websites monitored or audited
export const websites = pgTable('websites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  domain: text('domain').notNull(),
  rootUrl: text('root_url').notNull(),
  title: text('title'),
  status: text('status').default('active'),
  category: text('category').default('Technology'),
  address: text('address'),
  addressUrl: text('address_url'),
  city: text('city'),
  country: text('country'),
  description: text('description'),
  phone: text('phone'),
  isProfessional: integer('is_professional').default(1),
  lastAuditAt: timestamp('last_audit_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audits overall run
export const audits = pgTable('audits', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').references(() => websites.id),
  userId: integer('user_id').references(() => users.id),
  targetUrl: text('target_url').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'crawling' | 'analyzing' | 'completed' | 'partially_completed' | 'failed'
  totalUrls: integer('total_urls').default(0),
  analyzedUrls: integer('analyzed_urls').default(0),
  failedUrls: integer('failed_urls').default(0),
  overallScore: integer('overall_score').default(0),
  seoScore: integer('seo_score').default(0),
  aeoScore: integer('aeo_score').default(0),
  aioScore: integer('aio_score').default(0),
  geoScore: integer('geo_score').default(0),
  eeatScore: integer('eeat_score').default(0),
  summary: text('summary'),
  errorReason: text('error_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Discovered URLs queue & crawl status
export const urls = pgTable('urls', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').references(() => audits.id).notNull(),
  websiteId: integer('website_id').references(() => websites.id),
  url: text('url').notNull(),
  path: text('path').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'analyzing' | 'completed' | 'failed'
  statusCode: integer('status_code'),
  depth: integer('depth').default(0),
  errorReason: text('error_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Individual URL Reports (every URL gets its separate report)
export const urlReports = pgTable('url_reports', {
  id: serial('id').primaryKey(),
  urlId: integer('url_id').references(() => urls.id).notNull(),
  auditId: integer('audit_id').references(() => audits.id).notNull(),
  url: text('url').notNull(),
  title: text('title'),
  overallScore: integer('overall_score').default(0),
  seoScore: integer('seo_score').default(0),
  aeoScore: integer('aeo_score').default(0),
  aioScore: integer('aio_score').default(0),
  geoScore: integer('geo_score').default(0),
  eeatScore: integer('eeat_score').default(0),
  metaData: text('meta_data'), // JSON string
  headings: text('headings'), // JSON string
  structuredData: text('structured_data'), // JSON string
  performanceData: text('performance_data'), // JSON string
  aeoFindings: text('aeo_findings'), // JSON string
  aioFindings: text('aio_findings'), // JSON string
  geoFindings: text('geo_findings'), // JSON string
  eeatFindings: text('eeat_findings'), // JSON string
  createdAt: timestamp('created_at').defaultNow(),
});

// Findings breakdown (SEO, AEO, AIO, GEO, EEAT)
export const findings = pgTable('findings', {
  id: serial('id').primaryKey(),
  urlReportId: integer('url_report_id').references(() => urlReports.id),
  auditId: integer('audit_id').references(() => audits.id).notNull(),
  category: text('category').notNull(), // 'SEO' | 'AEO' | 'AIO' | 'GEO' | 'EEAT'
  severity: text('severity').notNull(), // 'critical' | 'warning' | 'info' | 'good'
  title: text('title').notNull(),
  description: text('description').notNull(),
  evidence: text('evidence'),
  recommendation: text('recommendation'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Strategic AI Recommendations for the audit
export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').references(() => audits.id).notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(), // 'high' | 'medium' | 'low'
  title: text('title').notNull(),
  actionableSteps: text('actionable_steps'),
  impact: text('impact'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Deep Research items
export const researches = pgTable('researches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  query: text('query').notNull(),
  topic: text('topic'),
  reportData: text('report_data'), // JSON
  createdAt: timestamp('created_at').defaultNow(),
});

// ChatGPT-style AI Assistant conversations
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Chat messages with role, language, images
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  chatId: integer('chat_id').references(() => chats.id).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  language: text('language').default('en'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Student learning questions & solutions
export const studentQuestions = pgTable('student_questions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  subject: text('subject'),
  questionText: text('question_text').notNull(),
  imageUrl: text('image_url'),
  solution: text('solution'),
  language: text('language').default('en'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Student study sessions
export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  subject: text('subject'),
  durationMinutes: integer('duration_minutes').default(0),
  notesCount: integer('notes_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Study notes
export const studyNotes = pgTable('study_notes', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => studySessions.id),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Flashcards
export const flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  deckName: text('deck_name').notNull(),
  front: text('front').notNull(),
  back: text('back').notNull(),
  masteryLevel: integer('mastery_level').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  websites: many(websites),
  audits: many(audits),
  chats: many(chats),
  researches: many(researches),
  studentQuestions: many(studentQuestions),
  studySessions: many(studySessions),
  flashcards: many(flashcards),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
  audits: many(audits),
  urls: many(urls),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  website: one(websites, {
    fields: [audits.websiteId],
    references: [websites.id],
  }),
  user: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
  urls: many(urls),
  urlReports: many(urlReports),
  findings: many(findings),
  recommendations: many(recommendations),
}));

export const urlsRelations = relations(urls, ({ one, many }) => ({
  audit: one(audits, {
    fields: [urls.auditId],
    references: [audits.id],
  }),
  website: one(websites, {
    fields: [urls.websiteId],
    references: [websites.id],
  }),
  reports: many(urlReports),
}));

export const urlReportsRelations = relations(urlReports, ({ one, many }) => ({
  url: one(urls, {
    fields: [urlReports.urlId],
    references: [urls.id],
  }),
  audit: one(audits, {
    fields: [urlReports.auditId],
    references: [audits.id],
  }),
  findings: many(findings),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMessages.chatId],
    references: [chats.id],
  }),
}));
