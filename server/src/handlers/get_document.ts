
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type GetDocumentInput, type Document } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getDocument = async (input: GetDocumentInput): Promise<Document | null> => {
  try {
    // Query document by ID and user_id for security
    const results = await db.select()
      .from(documentsTable)
      .where(and(
        eq(documentsTable.id, input.id),
        eq(documentsTable.user_id, input.user_id)
      ))
      .limit(1)
      .execute();

    // Return null if no document found
    if (results.length === 0) {
      return null;
    }

    // Return the found document
    return results[0];
  } catch (error) {
    console.error('Document retrieval failed:', error);
    throw error;
  }
};
