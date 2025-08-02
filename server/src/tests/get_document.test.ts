
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable } from '../db/schema';
import { type GetDocumentInput, type CreateUserInput } from '../schema';
import { getDocument } from '../handlers/get_document';

describe('getDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return document when found and belongs to user', async () => {
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
        content: 'This is test content',
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    const input: GetDocumentInput = {
      id: documentId,
      user_id: userId
    };

    const result = await getDocument(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(documentId);
    expect(result!.title).toEqual('Test Document');
    expect(result!.content).toEqual('This is test content');
    expect(result!.user_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when document not found', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: GetDocumentInput = {
      id: 999, // Non-existent document ID
      user_id: userId
    };

    const result = await getDocument(input);

    expect(result).toBeNull();
  });

  it('should return null when document belongs to different user', async () => {
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

    // Create document for user1
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'User1 Document',
        content: 'Private content',
        user_id: user1Id
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    // Try to access with user2's ID
    const input: GetDocumentInput = {
      id: documentId,
      user_id: user2Id
    };

    const result = await getDocument(input);

    expect(result).toBeNull();
  });

  it('should handle documents with empty content', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create document with empty content
    const documentResult = await db.insert(documentsTable)
      .values({
        title: 'Empty Document',
        content: '',
        user_id: userId
      })
      .returning()
      .execute();
    const documentId = documentResult[0].id;

    const input: GetDocumentInput = {
      id: documentId,
      user_id: userId
    };

    const result = await getDocument(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Empty Document');
    expect(result!.content).toEqual('');
    expect(result!.user_id).toEqual(userId);
  });
});
