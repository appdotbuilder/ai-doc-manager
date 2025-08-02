
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createDocumentInputSchema,
  getDocumentsInputSchema,
  getDocumentInputSchema,
  updateDocumentInputSchema,
  deleteDocumentInputSchema,
  createSourceInputSchema,
  getSourcesInputSchema,
  deleteSourceInputSchema,
  aiAssistanceRequestSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createDocument } from './handlers/create_document';
import { getDocuments } from './handlers/get_documents';
import { getDocument } from './handlers/get_document';
import { updateDocument } from './handlers/update_document';
import { deleteDocument } from './handlers/delete_document';
import { createSource } from './handlers/create_source';
import { getSources } from './handlers/get_sources';
import { deleteSource } from './handlers/delete_source';
import { requestAiAssistance } from './handlers/ai_assistance';
import { getAiResponses } from './handlers/get_ai_responses';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Document management
  createDocument: publicProcedure
    .input(createDocumentInputSchema)
    .mutation(({ input }) => createDocument(input)),

  getDocuments: publicProcedure
    .input(getDocumentsInputSchema)
    .query(({ input }) => getDocuments(input)),

  getDocument: publicProcedure
    .input(getDocumentInputSchema)
    .query(({ input }) => getDocument(input)),

  updateDocument: publicProcedure
    .input(updateDocumentInputSchema)
    .mutation(({ input }) => updateDocument(input)),

  deleteDocument: publicProcedure
    .input(deleteDocumentInputSchema)
    .mutation(({ input }) => deleteDocument(input)),

  // Source management
  createSource: publicProcedure
    .input(createSourceInputSchema)
    .mutation(({ input }) => createSource(input)),

  getSources: publicProcedure
    .input(getSourcesInputSchema)
    .query(({ input }) => getSources(input)),

  deleteSource: publicProcedure
    .input(deleteSourceInputSchema)
    .mutation(({ input }) => deleteSource(input)),

  // AI assistance
  requestAiAssistance: publicProcedure
    .input(aiAssistanceRequestSchema)
    .mutation(({ input }) => requestAiAssistance(input)),

  getAiResponses: publicProcedure
    .input(getDocumentInputSchema) // Reuse the same schema for document access
    .query(({ input }) => getAiResponses(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
