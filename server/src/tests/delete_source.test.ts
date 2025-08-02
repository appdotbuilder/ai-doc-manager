
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable, sourcesTable } from '../db/schema';
import { type DeleteSourceInput, type CreateUserInput, type CreateDocumentInput, type CreateSourceInput } from '../schema';
import { deleteSource } from '../handlers/delete_source';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

const testDocument: Omit<CreateDocumentInput, 'user_id'> = {
  title: 'Test Document',
  content: 'Test content'
};

const testSource: Omit<CreateSourceInput, 'document_id'> = {
  title: 'Test Source',
  content: 'Test source content',
  source_type: 'text' as const,
  source_url: null
};

describe('deleteSource', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a source successfully', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const documentResult = await db.insert(documentsTable)
      .values({
        ...testDocument,
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    const sourceResult = await db.insert(sourcesTable)
      .values({
        ...testSource,
        document_id: documentId
      })
      .returning()
      .execute();
    const sourceId = sourceResult[0].id;

    // Test deletion
    const input: DeleteSourceInput = {
      id: sourceId,
      document_id: documentId
    };

    const result = await deleteSource(input);

    expect(result).toBe(true);

    // Verify source was deleted from database
    const sources = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, sourceId))
      .execute();

    expect(sources).toHaveLength(0);
  });

  it('should return false when source does not exist', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const documentResult = await db.insert(documentsTable)
      .values({
        ...testDocument,
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    // Try to delete non-existent source
    const input: DeleteSourceInput = {
      id: 99999, // Non-existent source ID
      document_id: documentId
    };

    const result = await deleteSource(input);

    expect(result).toBe(false);
  });

  it('should return false when source belongs to different document', async () => {
    // Create prerequisite data - two documents
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const document1Result = await db.insert(documentsTable)
      .values({
        ...testDocument,
        title: 'Document 1',
        user_id: userId
      })
      .returning()
      .execute();
    const document1Id = document1Result[0].id;

    const document2Result = await db.insert(documentsTable)
      .values({
        ...testDocument,
        title: 'Document 2',
        user_id: userId
      })
      .returning()
      .execute();
    const document2Id = document2Result[0].id;

    // Create source in document 1
    const sourceResult = await db.insert(sourcesTable)
      .values({
        ...testSource,
        document_id: document1Id
      })
      .returning()
      .execute();
    const sourceId = sourceResult[0].id;

    // Try to delete source with wrong document ID
    const input: DeleteSourceInput = {
      id: sourceId,
      document_id: document2Id // Wrong document ID
    };

    const result = await deleteSource(input);

    expect(result).toBe(false);

    // Verify source still exists in original document
    const sources = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, sourceId))
      .execute();

    expect(sources).toHaveLength(1);
    expect(sources[0].document_id).toBe(document1Id);
  });

  it('should not affect other sources when deleting one', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const documentResult = await db.insert(documentsTable)
      .values({
        ...testDocument,
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    // Create two sources
    const source1Result = await db.insert(sourcesTable)
      .values({
        ...testSource,
        title: 'Source 1',
        document_id: documentId
      })
      .returning()
      .execute();
    const source1Id = source1Result[0].id;

    const source2Result = await db.insert(sourcesTable)
      .values({
        ...testSource,
        title: 'Source 2',
        document_id: documentId
      })
      .returning()
      .execute();
    const source2Id = source2Result[0].id;

    // Delete first source
    const input: DeleteSourceInput = {
      id: source1Id,
      document_id: documentId
    };

    const result = await deleteSource(input);

    expect(result).toBe(true);

    // Verify only first source was deleted
    const source1Query = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, source1Id))
      .execute();

    const source2Query = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, source2Id))
      .execute();

    expect(source1Query).toHaveLength(0);
    expect(source2Query).toHaveLength(1);
    expect(source2Query[0].title).toBe('Source 2');
  });
});
