
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, documentsTable, sourcesTable, aiAssistanceResponsesTable } from '../db/schema';
import { type AiAssistanceRequest } from '../schema';
import { requestAiAssistance } from '../handlers/ai_assistance';
import { eq } from 'drizzle-orm';

describe('requestAiAssistance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testDocumentId: number;

  beforeEach(async () => {
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
        content: 'This is test document content for AI assistance.',
        user_id: testUserId
      })
      .returning()
      .execute();
    
    testDocumentId = documentResult[0].id;
  });

  it('should process AI assistance request for writing', async () => {
    const input: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Help me write an introduction',
      assistance_type: 'write'
    };

    const result = await requestAiAssistance(input);

    expect(result.id).toBeDefined();
    expect(result.document_id).toEqual(testDocumentId);
    expect(result.request_prompt).toEqual('Help me write an introduction');
    expect(result.assistance_type).toEqual('write');
    expect(result.response_content).toContain('writing');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should process AI assistance request for editing', async () => {
    const input: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Please review this paragraph',
      context: 'This is the selected text to edit',
      assistance_type: 'edit'
    };

    const result = await requestAiAssistance(input);

    expect(result.assistance_type).toEqual('edit');
    expect(result.response_content).toContain('editing suggestions');
    expect(result.request_prompt).toEqual('Please review this paragraph');
  });

  it('should process AI assistance request for study guide', async () => {
    const input: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Create a study guide',
      assistance_type: 'study_guide'
    };

    const result = await requestAiAssistance(input);

    expect(result.assistance_type).toEqual('study_guide');
    expect(result.response_content).toContain('Study Guide');
    expect(result.response_content).toContain('Key Points');
    expect(result.response_content).toContain('Questions for Review');
  });

  it('should process AI assistance request for summarization', async () => {
    const input: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Summarize this document',
      assistance_type: 'summarize'
    };

    const result = await requestAiAssistance(input);

    expect(result.assistance_type).toEqual('summarize');
    expect(result.response_content).toContain('Summary');
    expect(result.response_content).toContain('Test Document');
  });

  it('should save AI assistance response to database', async () => {
    const input: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Help with writing',
      assistance_type: 'write'
    };

    const result = await requestAiAssistance(input);

    // Verify response was saved to database
    const savedResponses = await db.select()
      .from(aiAssistanceResponsesTable)
      .where(eq(aiAssistanceResponsesTable.id, result.id))
      .execute();

    expect(savedResponses).toHaveLength(1);
    expect(savedResponses[0].document_id).toEqual(testDocumentId);
    expect(savedResponses[0].request_prompt).toEqual('Help with writing');
    expect(savedResponses[0].assistance_type).toEqual('write');
    expect(savedResponses[0].created_at).toBeInstanceOf(Date);
  });

  it('should include sources in AI context when available', async () => {
    // Add a source to the document
    await db.insert(sourcesTable)
      .values({
        document_id: testDocumentId,
        title: 'Reference Source',
        content: 'This is reference material that should be included in AI context.',
        source_type: 'text'
      })
      .execute();

    const input: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Use the sources to help write content',
      assistance_type: 'write'
    };

    const result = await requestAiAssistance(input);

    expect(result.response_content).toBeDefined();
    expect(result.assistance_type).toEqual('write');
    // The AI would have access to the source content for context
    expect(result.document_id).toEqual(testDocumentId);
  });

  it('should throw error for non-existent document', async () => {
    const input: AiAssistanceRequest = {
      document_id: 99999, // Non-existent document ID
      prompt: 'Help with writing',
      assistance_type: 'write'
    };

    expect(requestAiAssistance(input)).rejects.toThrow(/document not found/i);
  });

  it('should handle optional context parameter', async () => {
    const inputWithContext: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Edit this text',
      context: 'Selected text for editing',
      assistance_type: 'edit'
    };

    const resultWithContext = await requestAiAssistance(inputWithContext);
    expect(resultWithContext.assistance_type).toEqual('edit');

    const inputWithoutContext: AiAssistanceRequest = {
      document_id: testDocumentId,
      prompt: 'Edit this text',
      assistance_type: 'edit'
    };

    const resultWithoutContext = await requestAiAssistance(inputWithoutContext);
    expect(resultWithoutContext.assistance_type).toEqual('edit');
  });
});
