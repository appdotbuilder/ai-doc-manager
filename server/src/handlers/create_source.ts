
import { db } from '../db';
import { sourcesTable, documentsTable } from '../db/schema';
import { type CreateSourceInput, type Source } from '../schema';
import { eq } from 'drizzle-orm';

export const createSource = async (input: CreateSourceInput): Promise<Source> => {
  try {
    // Verify that the document exists
    const document = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.document_id))
      .execute();

    if (document.length === 0) {
      throw new Error(`Document with id ${input.document_id} not found`);
    }

    // Insert source record
    const result = await db.insert(sourcesTable)
      .values({
        document_id: input.document_id,
        title: input.title,
        content: input.content,
        source_type: input.source_type,
        source_url: input.source_url || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Source creation failed:', error);
    throw error;
  }
};
