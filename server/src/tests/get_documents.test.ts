
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable } from '../db/schema';
import { type GetDocumentsInput } from '../schema';
import { getDocuments } from '../handlers/get_documents';

describe('getDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return documents for a specific user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { email: 'user1@test.com', name: 'User One' },
        { email: 'user2@test.com', name: 'User Two' }
      ])
      .returning()
      .execute();

    const user1 = users[0];
    const user2 = users[1];

    // Create documents for both users
    await db.insert(documentsTable)
      .values([
        { title: 'User 1 Doc 1', content: 'Content 1', user_id: user1.id },
        { title: 'User 1 Doc 2', content: 'Content 2', user_id: user1.id },
        { title: 'User 2 Doc 1', content: 'Content 3', user_id: user2.id }
      ])
      .execute();

    const input: GetDocumentsInput = {
      user_id: user1.id,
      limit: 20,
      offset: 0
    };

    const result = await getDocuments(input);

    expect(result).toHaveLength(2);
    result.forEach(doc => {
      expect(doc.user_id).toEqual(user1.id);
      expect(doc.title).toMatch(/User 1 Doc/);
      expect(doc.id).toBeDefined();
      expect(doc.created_at).toBeInstanceOf(Date);
      expect(doc.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when user has no documents', async () => {
    // Create user with no documents
    const users = await db.insert(usersTable)
      .values({ email: 'empty@test.com', name: 'Empty User' })
      .returning()
      .execute();

    const input: GetDocumentsInput = {
      user_id: users[0].id,
      limit: 20,
      offset: 0
    };

    const result = await getDocuments(input);

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'test@test.com', name: 'Test User' })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create 5 documents
    await db.insert(documentsTable)
      .values([
        { title: 'Doc 1', content: 'Content 1', user_id: userId },
        { title: 'Doc 2', content: 'Content 2', user_id: userId },
        { title: 'Doc 3', content: 'Content 3', user_id: userId },
        { title: 'Doc 4', content: 'Content 4', user_id: userId },
        { title: 'Doc 5', content: 'Content 5', user_id: userId }
      ])
      .execute();

    const input: GetDocumentsInput = {
      user_id: userId,
      limit: 3,
      offset: 0
    };

    const result = await getDocuments(input);

    expect(result).toHaveLength(3);
    result.forEach(doc => {
      expect(doc.user_id).toEqual(userId);
    });
  });

  it('should respect offset parameter', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'test@test.com', name: 'Test User' })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create 5 documents with slight delay to ensure different timestamps
    for (let i = 1; i <= 5; i++) {
      await db.insert(documentsTable)
        .values({ title: `Doc ${i}`, content: `Content ${i}`, user_id: userId })
        .execute();
      
      // Small delay to ensure different updated_at timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // Get first 2 documents
    const firstPage = await getDocuments({
      user_id: userId,
      limit: 2,
      offset: 0
    });

    // Get next 2 documents
    const secondPage = await getDocuments({
      user_id: userId,
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);

    // Ensure no overlap between pages
    const firstPageIds = firstPage.map(doc => doc.id);
    const secondPageIds = secondPage.map(doc => doc.id);
    
    firstPageIds.forEach(id => {
      expect(secondPageIds).not.toContain(id);
    });
  });

  it('should order documents by updated_at descending', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({ email: 'test@test.com', name: 'Test User' })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create documents with delays to ensure different timestamps
    const doc1 = await db.insert(documentsTable)
      .values({ title: 'First Doc', content: 'Content 1', user_id: userId })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const doc2 = await db.insert(documentsTable)
      .values({ title: 'Second Doc', content: 'Content 2', user_id: userId })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const doc3 = await db.insert(documentsTable)
      .values({ title: 'Third Doc', content: 'Content 3', user_id: userId })
      .returning()
      .execute();

    const result = await getDocuments({
      user_id: userId,
      limit: 20,
      offset: 0
    });

    expect(result).toHaveLength(3);
    
    // Should be ordered by updated_at descending (newest first)
    expect(result[0].updated_at >= result[1].updated_at).toBe(true);
    expect(result[1].updated_at >= result[2].updated_at).toBe(true);
    
    // The newest document should be first
    expect(result[0].title).toEqual('Third Doc');
  });
});
