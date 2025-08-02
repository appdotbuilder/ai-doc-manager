
import { db } from '../db';
import { documentsTable, usersTable } from '../db/schema';
import { type CreateDocumentInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const createDocument = async (input: CreateDocumentInput): Promise<Document> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        title: input.title,
        content: input.content,
        user_id: input.user_id
      })
      .returning()
      .execute();

    const document = result[0];
    return {
      ...document
    };
  } catch (error) {
    console.error('Document creation failed:', error);
    throw error;
  }
};
