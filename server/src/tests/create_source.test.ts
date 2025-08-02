
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sourcesTable, documentsTable, usersTable } from '../db/schema';
import { type CreateSourceInput } from '../schema';
import { createSource } from '../handlers/create_source';
import { eq } from 'drizzle-orm';

describe('createSource', () => {
  let testUserId: number;
  let testDocumentId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test document
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: testUserId
      })
      .returning()
      .execute();
    testDocumentId = documentResult[0].id;
  });

  afterEach(resetDB);

  it('should create a text source', async () => {
    const testInput: CreateSourceInput = {
      document_id: testDocumentId,
      title: 'Test Text Source',
      content: 'This is test content for the source',
      source_type: 'text'
    };

    const result = await createSource(testInput);

    expect(result.id).toBeDefined();
    expect(result.document_id).toEqual(testDocumentId);
    expect(result.title).toEqual('Test Text Source');
    expect(result.content).toEqual('This is test content for the source');
    expect(result.source_type).toEqual('text');
    expect(result.source_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a URL source with source_url', async () => {
    const testInput: CreateSourceInput = {
      document_id: testDocumentId,
      title: 'Test URL Source',
      content: 'Content from the URL',
      source_type: 'url',
      source_url: 'https://example.com/article'
    };

    const result = await createSource(testInput);

    expect(result.id).toBeDefined();
    expect(result.document_id).toEqual(testDocumentId);
    expect(result.title).toEqual('Test URL Source');
    expect(result.content).toEqual('Content from the URL');
    expect(result.source_type).toEqual('url');
    expect(result.source_url).toEqual('https://example.com/article');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a file source', async () => {
    const testInput: CreateSourceInput = {
      document_id: testDocumentId,
      title: 'Test File Source',
      content: 'Content extracted from file',
      source_type: 'file'
    };

    const result = await createSource(testInput);

    expect(result.id).toBeDefined();
    expect(result.document_id).toEqual(testDocumentId);
    expect(result.title).toEqual('Test File Source');
    expect(result.content).toEqual('Content extracted from file');
    expect(result.source_type).toEqual('file');
    expect(result.source_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save source to database', async () => {
    const testInput: CreateSourceInput = {
      document_id: testDocumentId,
      title: 'Database Test Source',
      content: 'Test content for database verification',
      source_type: 'text'
    };

    const result = await createSource(testInput);

    const sources = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, result.id))
      .execute();

    expect(sources).toHaveLength(1);
    expect(sources[0].title).toEqual('Database Test Source');
    expect(sources[0].content).toEqual('Test content for database verification');
    expect(sources[0].document_id).toEqual(testDocumentId);
    expect(sources[0].source_type).toEqual('text');
    expect(sources[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when document does not exist', async () => {
    const testInput: CreateSourceInput = {
      document_id: 99999, // Non-existent document ID
      title: 'Test Source',
      content: 'Test content',
      source_type: 'text'
    };

    expect(createSource(testInput)).rejects.toThrow(/document with id 99999 not found/i);
  });

  it('should handle source_url as null when not provided', async () => {
    const testInput: CreateSourceInput = {
      document_id: testDocumentId,
      title: 'Source Without URL',
      content: 'Content without URL',
      source_type: 'text'
      // source_url is optional and not provided
    };

    const result = await createSource(testInput);

    expect(result.source_url).toBeNull();
  });
});
