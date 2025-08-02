
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, usersTable } from '../db/schema';
import { type CreateDocumentInput } from '../schema';
import { createDocument } from '../handlers/create_document';
import { eq } from 'drizzle-orm';

// Test user setup
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test document input
const testInput: CreateDocumentInput = {
  title: 'Test Document',
  content: 'This is test content for the document',
  user_id: 1 // Will be set after user creation
};

describe('createDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a document', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const documentInput = { ...testInput, user_id: userId };

    const result = await createDocument(documentInput);

    // Basic field validation
    expect(result.title).toEqual('Test Document');
    expect(result.content).toEqual('This is test content for the document');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save document to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const documentInput = { ...testInput, user_id: userId };

    const result = await createDocument(documentInput);

    // Query using proper drizzle syntax
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].title).toEqual('Test Document');
    expect(documents[0].content).toEqual('This is test content for the document');
    expect(documents[0].user_id).toEqual(userId);
    expect(documents[0].created_at).toBeInstanceOf(Date);
    expect(documents[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create document with empty content by default', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const documentInput = {
      title: 'Empty Document',
      content: '', // Empty content
      user_id: userId
    };

    const result = await createDocument(documentInput);

    expect(result.title).toEqual('Empty Document');
    expect(result.content).toEqual('');
    expect(result.user_id).toEqual(userId);
  });

  it('should fail when user does not exist', async () => {
    const documentInput = { ...testInput, user_id: 999 }; // Non-existent user

    expect(createDocument(documentInput)).rejects.toThrow(/user not found/i);
  });

  it('should verify foreign key relationship', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const documentInput = { ...testInput, user_id: userId };

    const result = await createDocument(documentInput);

    // Verify the document is linked to the correct user
    const documentsWithUser = await db.select()
      .from(documentsTable)
      .innerJoin(usersTable, eq(documentsTable.user_id, usersTable.id))
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documentsWithUser).toHaveLength(1);
    expect(documentsWithUser[0].documents.user_id).toEqual(userId);
    expect(documentsWithUser[0].users.email).toEqual('test@example.com');
    expect(documentsWithUser[0].users.name).toEqual('Test User');
  });
});
