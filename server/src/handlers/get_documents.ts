
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type GetDocumentsInput, type Document } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getDocuments = async (input: GetDocumentsInput): Promise<Document[]> => {
  try {
    // Build query with user filter and pagination
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.user_id, input.user_id))
      .orderBy(desc(documentsTable.updated_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Get documents failed:', error);
    throw error;
  }
};
