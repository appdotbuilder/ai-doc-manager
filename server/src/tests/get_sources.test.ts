
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable, sourcesTable } from '../db/schema';
import { type GetSourcesInput } from '../schema';
import { getSources } from '../handlers/get_sources';

// Test input
const testInput: GetSourcesInput = {
  document_id: 1
};

describe('getSources', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for document with no sources', async () => {
    // Create user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create document directly in database
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();
    const document = documentResult[0];

    const result = await getSources({ document_id: document.id });

    expect(result).toEqual([]);
  });

  it('should return sources for a document', async () => {
    // Create user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create document directly in database
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();
    const document = documentResult[0];

    // Create multiple sources directly in database
    const source1Result = await db.insert(sourcesTable)
      .values({
        document_id: document.id,
        title: 'Source 1',
        content: 'Content 1',
        source_type: 'text',
        source_url: null
      })
      .returning()
      .execute();
    const source1 = source1Result[0];

    const source2Result = await db.insert(sourcesTable)
      .values({
        document_id: document.id,
        title: 'Source 2',
        content: 'Content 2',
        source_type: 'url',
        source_url: 'https://example.com'
      })
      .returning()
      .execute();
    const source2 = source2Result[0];

    const result = await getSources({ document_id: document.id });

    expect(result).toHaveLength(2);
    
    // Find sources by id to avoid order dependency
    const resultSource1 = result.find(s => s.id === source1.id);
    const resultSource2 = result.find(s => s.id === source2.id);

    expect(resultSource1).toBeDefined();
    expect(resultSource1!.title).toEqual('Source 1');
    expect(resultSource1!.content).toEqual('Content 1');
    expect(resultSource1!.source_type).toEqual('text');
    expect(resultSource1!.source_url).toBeNull();
    expect(resultSource1!.created_at).toBeInstanceOf(Date);

    expect(resultSource2).toBeDefined();
    expect(resultSource2!.title).toEqual('Source 2');
    expect(resultSource2!.content).toEqual('Content 2');
    expect(resultSource2!.source_type).toEqual('url');
    expect(resultSource2!.source_url).toEqual('https://example.com');
    expect(resultSource2!.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent document', async () => {
    await expect(getSources({ document_id: 999 }))
      .rejects.toThrow(/document not found/i);
  });

  it('should only return sources for the specified document', async () => {
    // Create user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create two documents directly in database
    const document1Result = await db.insert(documentsTable)
      .values({
        title: 'Document 1',
        content: 'Content 1',
        user_id: user.id
      })
      .returning()
      .execute();
    const document1 = document1Result[0];

    const document2Result = await db.insert(documentsTable)
      .values({
        title: 'Document 2',
        content: 'Content 2',
        user_id: user.id
      })
      .returning()
      .execute();
    const document2 = document2Result[0];

    // Create sources for both documents directly in database
    await db.insert(sourcesTable)
      .values({
        document_id: document1.id,
        title: 'Source for Doc 1',
        content: 'Content for Doc 1',
        source_type: 'text',
        source_url: null
      })
      .execute();

    await db.insert(sourcesTable)
      .values({
        document_id: document2.id,
        title: 'Source for Doc 2',
        content: 'Content for Doc 2',
        source_type: 'text',
        source_url: null
      })
      .execute();

    // Get sources for document 1 only
    const result = await getSources({ document_id: document1.id });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Source for Doc 1');
    expect(result[0].document_id).toEqual(document1.id);
  });
});
