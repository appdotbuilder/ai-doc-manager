
import { db } from '../db';
import { documentsTable, sourcesTable, aiAssistanceResponsesTable } from '../db/schema';
import { type AiAssistanceRequest, type AiAssistanceResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const requestAiAssistance = async (input: AiAssistanceRequest): Promise<AiAssistanceResponse> => {
  try {
    // Verify document exists
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.document_id))
      .execute();

    if (documents.length === 0) {
      throw new Error('Document not found');
    }

    const document = documents[0];

    // Gather sources for context
    const sources = await db.select()
      .from(sourcesTable)
      .where(eq(sourcesTable.document_id, input.document_id))
      .execute();

    // Build context for AI request
    let contextContent = `Document Title: ${document.title}\n`;
    contextContent += `Document Content: ${document.content}\n`;
    
    if (input.context) {
      contextContent += `Selected Context: ${input.context}\n`;
    }

    if (sources.length > 0) {
      contextContent += '\nAvailable Sources:\n';
      sources.forEach(source => {
        contextContent += `- ${source.title}: ${source.content.substring(0, 500)}...\n`;
      });
    }

    // Simulate AI response based on assistance type
    let aiResponseContent = '';
    
    switch (input.assistance_type) {
      case 'write':
        aiResponseContent = `Based on your prompt "${input.prompt}" and the document context, here's some content to help with your writing...`;
        break;
      case 'edit':
        aiResponseContent = `Here are some editing suggestions for your text: "${input.prompt}"...`;
        break;
      case 'study_guide':
        aiResponseContent = `Study Guide based on "${document.title}":\n\nKey Points:\n- Important concept 1\n- Important concept 2\n\nQuestions for Review:\n1. What is...?\n2. How does...?`;
        break;
      case 'summarize':
        aiResponseContent = `Summary of "${document.title}":\n\nThis document covers the main topics of... The key insights include...`;
        break;
      default:
        aiResponseContent = 'AI assistance response generated successfully.';
    }

    // Store the AI assistance response in database
    const result = await db.insert(aiAssistanceResponsesTable)
      .values({
        document_id: input.document_id,
        request_prompt: input.prompt,
        response_content: aiResponseContent,
        assistance_type: input.assistance_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('AI assistance request failed:', error);
    throw error;
  }
};
