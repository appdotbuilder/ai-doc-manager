
import { z } from 'zod';

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(), // Rich text content stored as HTML/JSON
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

// Input schema for creating documents
export const createDocumentInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""), // Empty content by default
  user_id: z.number()
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

// Input schema for updating documents
export const updateDocumentInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().optional()
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;

// Source schema for AI assistance
export const sourceSchema = z.object({
  id: z.number(),
  document_id: z.number(),
  title: z.string(),
  content: z.string(), // Source material content
  source_type: z.enum(['url', 'file', 'text']),
  source_url: z.string().nullable(), // URL if source_type is 'url'
  created_at: z.coerce.date()
});

export type Source = z.infer<typeof sourceSchema>;

// Input schema for creating sources
export const createSourceInputSchema = z.object({
  document_id: z.number(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  source_type: z.enum(['url', 'file', 'text']),
  source_url: z.string().url().nullable().optional()
});

export type CreateSourceInput = z.infer<typeof createSourceInputSchema>;

// AI assistance request schema
export const aiAssistanceRequestSchema = z.object({
  document_id: z.number(),
  prompt: z.string().min(1, "Prompt is required"),
  context: z.string().optional(), // Selected text or cursor position context
  assistance_type: z.enum(['write', 'edit', 'study_guide', 'summarize'])
});

export type AiAssistanceRequest = z.infer<typeof aiAssistanceRequestSchema>;

// AI assistance response schema
export const aiAssistanceResponseSchema = z.object({
  id: z.number(),
  document_id: z.number(),
  request_prompt: z.string(),
  response_content: z.string(),
  assistance_type: z.enum(['write', 'edit', 'study_guide', 'summarize']),
  created_at: z.coerce.date()
});

export type AiAssistanceResponse = z.infer<typeof aiAssistanceResponseSchema>;

// User schema (basic user management)
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Get documents input schema (with filtering)
export const getDocumentsInputSchema = z.object({
  user_id: z.number(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type GetDocumentsInput = z.infer<typeof getDocumentsInputSchema>;

// Get single document input schema
export const getDocumentInputSchema = z.object({
  id: z.number(),
  user_id: z.number() // Ensure user can only access their own documents
});

export type GetDocumentInput = z.infer<typeof getDocumentInputSchema>;

// Delete document input schema
export const deleteDocumentInputSchema = z.object({
  id: z.number(),
  user_id: z.number() // Ensure user can only delete their own documents
});

export type DeleteDocumentInput = z.infer<typeof deleteDocumentInputSchema>;

// Get sources input schema
export const getSourcesInputSchema = z.object({
  document_id: z.number()
});

export type GetSourcesInput = z.infer<typeof getSourcesInputSchema>;

// Delete source input schema
export const deleteSourceInputSchema = z.object({
  id: z.number(),
  document_id: z.number() // Ensure source belongs to the document
});

export type DeleteSourceInput = z.infer<typeof deleteSourceInputSchema>;
