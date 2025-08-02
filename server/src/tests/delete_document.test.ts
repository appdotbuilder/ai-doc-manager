
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable, sourcesTable, aiAssistanceResponsesTable } from '../db/schema';
import { type DeleteDocumentInput } from '../schema';
import { deleteDocument } from '../handlers/delete_document';
import { eq } from 'drizzle-orm';

describe('deleteDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a document that belongs to the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test document
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    const input: DeleteDocumentInput = {
      id: documentId,
      user_id: userId
    };

    const result = await deleteDocument(input);

    expect(result).toBe(true);

    // Verify document was deleted
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(documents).toHaveLength(0);
  });

  it('should return false when document does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: DeleteDocumentInput = {
      id: 999999, // Non-existent document ID
      user_id: userId
    };

    const result = await deleteDocument(input);

    expect(result).toBe(false);
  });

  it('should return false when user tries to delete another users document', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create document owned by user1
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'User1 Document',
        content: 'User1 content',
        user_id: user1Id
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    // Try to delete as user2
    const input: DeleteDocumentInput = {
      id: documentId,
      user_id: user2Id
    };

    const result = await deleteDocument(input);

    expect(result).toBe(false);

    // Verify document still exists
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].user_id).toBe(user1Id);
  });

  it('should cascade delete related sources and AI responses', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test document
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    // Create related source
    const sourceResult = await db.insert(sourcesTable)
      .values({
        document_id: documentId,
        title: 'Test Source',
        content: 'Source content',
        source_type: 'text'
      })
      .returning()
      .execute();
    const sourceId = sourceResult[0].id;

    // Create related AI response
    const aiResponseResult = await db.insert(aiAssistanceResponsesTable)
      .values({
        document_id: documentId,
        request_prompt: 'Test prompt',
        response_content: 'AI response content',
        assistance_type: 'write'
      })
      .returning()
      .execute();
    const aiResponseId = aiResponseResult[0].id;

    const input: DeleteDocumentInput = {
      id: documentId,
      user_id: userId
    };

    const result = await deleteDocument(input);

    expect(result).toBe(true);

    // Verify document was deleted
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();
    expect(documents).toHaveLength(0);

    // Verify sources were cascade deleted
    const sources = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, sourceId))
      .execute();
    expect(sources).toHaveLength(0);

    // Verify AI responses were cascade deleted
    const aiResponses = await db.select()
      .from(aiAssistanceResponsesTable)
      .where(eq(aiAssistanceResponsesTable.id, aiResponseId))
      .execute();
    expect(aiResponses).toHaveLength(0);
  });
});
