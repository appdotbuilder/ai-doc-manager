
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type DeleteDocumentInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteDocument = async (input: DeleteDocumentInput): Promise<boolean> => {
  try {
    // Delete the document only if it belongs to the specified user
    const result = await db.delete(documentsTable)
      .where(
        and(
          eq(documentsTable.id, input.id),
          eq(documentsTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    // Return true if a document was deleted, false if not found or unauthorized
    return result.length > 0;
  } catch (error) {
    console.error('Document deletion failed:', error);
    throw error;
  }
};
