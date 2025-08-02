
import { db } from '../db';
import { aiAssistanceResponsesTable } from '../db/schema';
import { type AiAssistanceResponse } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getAiResponses = async (documentId: number): Promise<AiAssistanceResponse[]> => {
  try {
    const results = await db.select()
      .from(aiAssistanceResponsesTable)
      .where(eq(aiAssistanceResponsesTable.document_id, documentId))
      .orderBy(desc(aiAssistanceResponsesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get AI responses:', error);
    throw error;
  }
};
