
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable } from '../db/schema';
import { type UpdateDocumentInput } from '../schema';
import { updateDocument } from '../handlers/update_document';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test document data
const testDocument = {
  title: 'Original Title',
  content: 'Original content',
  user_id: 1
};

describe('updateDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update document title only', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test document
    const [createdDoc] = await db.insert(documentsTable)
      .values(testDocument)
      .returning()
      .execute();

    const updateInput: UpdateDocumentInput = {
      id: createdDoc.id,
      title: 'Updated Title'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdDoc.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.content).toEqual('Original content'); // Should remain unchanged
    expect(result!.user_id).toEqual(1);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdDoc.updated_at.getTime());
  });

  it('should update document content only', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test document
    const [createdDoc] = await db.insert(documentsTable)
      .values(testDocument)
      .returning()
      .execute();

    const updateInput: UpdateDocumentInput = {
      id: createdDoc.id,
      content: 'Updated content with new information'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdDoc.id);
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.content).toEqual('Updated content with new information');
    expect(result!.user_id).toEqual(1);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdDoc.updated_at.getTime());
  });

  it('should update both title and content', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test document
    const [createdDoc] = await db.insert(documentsTable)
      .values(testDocument)
      .returning()
      .execute();

    const updateInput: UpdateDocumentInput = {
      id: createdDoc.id,
      title: 'Completely New Title',
      content: 'Completely new content'
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdDoc.id);
    expect(result!.title).toEqual('Completely New Title');
    expect(result!.content).toEqual('Completely new content');
    expect(result!.user_id).toEqual(1);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdDoc.updated_at.getTime());
  });

  it('should update document in database', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test document
    const [createdDoc] = await db.insert(documentsTable)
      .values(testDocument)
      .returning()
      .execute();

    const updateInput: UpdateDocumentInput = {
      id: createdDoc.id,
      title: 'Database Updated Title',
      content: 'Database updated content'
    };

    await updateDocument(updateInput);

    // Verify document was updated in database
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, createdDoc.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].title).toEqual('Database Updated Title');
    expect(documents[0].content).toEqual('Database updated content');
    expect(documents[0].updated_at).toBeInstanceOf(Date);
    expect(documents[0].updated_at.getTime()).toBeGreaterThan(createdDoc.updated_at.getTime());
  });

  it('should return null for non-existent document', async () => {
    const updateInput: UpdateDocumentInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateDocument(updateInput);

    expect(result).toBeNull();
  });

  it('should handle empty content update', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test document
    const [createdDoc] = await db.insert(documentsTable)
      .values(testDocument)
      .returning()
      .execute();

    const updateInput: UpdateDocumentInput = {
      id: createdDoc.id,
      content: ''
    };

    const result = await updateDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.content).toEqual('');
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
  });
});
