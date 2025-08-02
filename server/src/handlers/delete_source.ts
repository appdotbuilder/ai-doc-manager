
import { db } from '../db';
import { sourcesTable, documentsTable } from '../db/schema';
import { type DeleteSourceInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteSource = async (input: DeleteSourceInput): Promise<boolean> => {
  try {
    // First, verify that the source exists and belongs to the specified document
    const sourceQuery = await db.select()
      .from(sourcesTable)
      .where(
        and(
          eq(sourcesTable.id, input.id),
          eq(sourcesTable.document_id, input.document_id)
        )
      )
      .execute();

    // If source doesn't exist or doesn't belong to the document, return false
    if (sourceQuery.length === 0) {
      return false;
    }

    // Delete the source
    const result = await db.delete(sourcesTable)
      .where(
        and(
          eq(sourcesTable.id, input.id),
          eq(sourcesTable.document_id, input.document_id)
        )
      )
      .execute();

    // Return true if deletion was successful (rowCount > 0)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Source deletion failed:', error);
    throw error;
  }
};
