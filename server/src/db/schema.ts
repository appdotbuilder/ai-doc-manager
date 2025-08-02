
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Source types enum
export const sourceTypeEnum = pgEnum('source_type', ['url', 'file', 'text']);

// Sources table for AI assistance
export const sourcesTable = pgTable('sources', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  source_type: sourceTypeEnum('source_type').notNull(),
  source_url: text('source_url'), // Nullable for non-URL sources
  created_at: timestamp('created_at').defaultNow().notNull()
});

// AI assistance types enum
export const assistanceTypeEnum = pgEnum('assistance_type', ['write', 'edit', 'study_guide', 'summarize']);

// AI assistance responses table
export const aiAssistanceResponsesTable = pgTable('ai_assistance_responses', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade' }),
  request_prompt: text('request_prompt').notNull(),
  response_content: text('response_content').notNull(),
  assistance_type: assistanceTypeEnum('assistance_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  documents: many(documentsTable)
}));

export const documentsRelations = relations(documentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [documentsTable.user_id],
    references: [usersTable.id]
  }),
  sources: many(sourcesTable),
  aiResponses: many(aiAssistanceResponsesTable)
}));

export const sourcesRelations = relations(sourcesTable, ({ one }) => ({
  document: one(documentsTable, {
    fields: [sourcesTable.document_id],
    references: [documentsTable.id]
  })
}));

export const aiAssistanceResponsesRelations = relations(aiAssistanceResponsesTable, ({ one }) => ({
  document: one(documentsTable, {
    fields: [aiAssistanceResponsesTable.document_id],
    references: [documentsTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;
export type Source = typeof sourcesTable.$inferSelect;
export type NewSource = typeof sourcesTable.$inferInsert;
export type AiAssistanceResponse = typeof aiAssistanceResponsesTable.$inferSelect;
export type NewAiAssistanceResponse = typeof aiAssistanceResponsesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  documents: documentsTable,
  sources: sourcesTable,
  aiAssistanceResponses: aiAssistanceResponsesTable
};
