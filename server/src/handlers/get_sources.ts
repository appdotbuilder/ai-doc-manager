
import { db } from '../db';
import { sourcesTable, documentsTable } from '../db/schema';
import { type GetSourcesInput, type Source } from '../schema';
import { eq } from 'drizzle-orm';

export const getSources = async (input: GetSourcesInput): Promise<Source[]> => {
  try {
    // First verify the document exists (this also serves as basic access validation)
    const documentExists = await db.select({ id: documentsTable.id })
      .from(documentsTable)
      .where(eq(documentsTable.id, input.document_id))
      .execute();

    if (documentExists.length === 0) {
      throw new Error('Document not found');
    }

    // Fetch all sources for the document
    const results = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.document_id, input.document_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get sources failed:', error);
    throw error;
  }
};
