
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable, aiAssistanceResponsesTable } from '../db/schema';
import { getAiResponses } from '../handlers/get_ai_responses';

describe('getAiResponses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return AI responses for a document', async () => {
    // Create prerequisite user and document
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const [document] = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();

    // Create AI responses
    const responses = await db.insert(aiAssistanceResponsesTable)
      .values([
        {
          document_id: document.id,
          request_prompt: 'Help me write an introduction',
          response_content: 'Here is a great introduction...',
          assistance_type: 'write'
        },
        {
          document_id: document.id,
          request_prompt: 'Edit this paragraph',
          response_content: 'Here is the edited paragraph...',
          assistance_type: 'edit'
        }
      ])
      .returning()
      .execute();

    const result = await getAiResponses(document.id);

    expect(result).toHaveLength(2);
    expect(result[0].document_id).toEqual(document.id);
    expect(result[0].request_prompt).toBeDefined();
    expect(result[0].response_content).toBeDefined();
    expect(result[0].assistance_type).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return responses in chronological order (newest first)', async () => {
    // Create prerequisite user and document
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const [document] = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();

    // Create responses with slight delay to ensure different timestamps
    const [response1] = await db.insert(aiAssistanceResponsesTable)
      .values({
        document_id: document.id,
        request_prompt: 'First request',
        response_content: 'First response',
        assistance_type: 'write'
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [response2] = await db.insert(aiAssistanceResponsesTable)
      .values({
        document_id: document.id,
        request_prompt: 'Second request',
        response_content: 'Second response',
        assistance_type: 'edit'
      })
      .returning()
      .execute();

    const result = await getAiResponses(document.id);

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[0].request_prompt).toEqual('Second request');
    expect(result[1].request_prompt).toEqual('First request');
  });

  it('should return empty array for document with no AI responses', async () => {
    // Create prerequisite user and document
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const [document] = await db.insert(documentsTable)
      .values({
        title: 'Test Document',
        content: 'Test content',
        user_id: user.id
      })
      .returning()
      .execute();

    const result = await getAiResponses(document.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return responses for the specified document', async () => {
    // Create prerequisite user and documents
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const documents = await db.insert(documentsTable)
      .values([
        {
          title: 'Document 1',
          content: 'Content 1',
          user_id: user.id
        },
        {
          title: 'Document 2',
          content: 'Content 2',
          user_id: user.id
        }
      ])
      .returning()
      .execute();

    // Create responses for both documents
    await db.insert(aiAssistanceResponsesTable)
      .values([
        {
          document_id: documents[0].id,
          request_prompt: 'Help with document 1',
          response_content: 'Response for document 1',
          assistance_type: 'write'
        },
        {
          document_id: documents[1].id,
          request_prompt: 'Help with document 2',
          response_content: 'Response for document 2',
          assistance_type: 'edit'
        }
      ])
      .execute();

    const result = await getAiResponses(documents[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].document_id).toEqual(documents[0].id);
    expect(result[0].request_prompt).toEqual('Help with document 1');
  });
});
