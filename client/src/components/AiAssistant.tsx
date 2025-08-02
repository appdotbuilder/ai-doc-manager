
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Document, AiAssistanceRequest, AiAssistanceResponse } from '../../../server/src/schema';

interface AiAssistantProps {
  document: Document;
  onContentGenerated: (content: string) => void;
}

export function AiAssistant({ document, onContentGenerated }: AiAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [assistanceType, setAssistanceType] = useState<'write' | 'edit' | 'study_guide' | 'summarize'>('write');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responses, setResponses] = useState<AiAssistanceResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadAiHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const result = await trpc.getAiResponses.query({
        id: document.id,
        user_id: document.user_id
      });
      setResponses(result);
    } catch (error) {
      console.error('Failed to load AI history:', error);
      // Demo fallback data
      const demoResponses: AiAssistanceResponse[] = [
        {
          id: 1,
          document_id: document.id,
          request_prompt: 'Help me write an introduction about AI in education',
          response_content: 'Artificial Intelligence (AI) is revolutionizing the educational landscape by providing personalized learning experiences, automated assessment tools, and intelligent tutoring systems. This technology enables educators to better understand student needs and adapt their teaching methods accordingly.',
          assistance_type: 'write',
          created_at: new Date('2024-01-20T10:30:00')
        },
        {
          id: 2,
          document_id: document.id,
          request_prompt: 'Generate a study guide for this document',
          response_content: '# Study Guide\n\n## Key Concepts:\n- AI in Education\n- Personalized Learning\n- Automated Assessment\n\n## Discussion Questions:\n1. How does AI improve learning outcomes?\n2. What are the ethical considerations?\n\n## Action Items:\n- Research current AI tools\n- Interview educators',
          assistance_type: 'study_guide',
          created_at: new Date('2024-01-19T14:15:00')
        }
      ];
      setResponses(demoResponses);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [document.id, document.user_id]);

  useEffect(() => {
    loadAiHistory();
  }, [loadAiHistory]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const requestData: AiAssistanceRequest = {
        document_id: document.id,
        prompt: prompt.trim(),
        context: context.trim() || undefined,
        assistance_type: assistanceType
      };

      // This would normally call the AI service
      const response = await trpc.requestAiAssistance.mutate(requestData);
      
      // Add to history - use the actual response from the handler
      const newResponse: AiAssistanceResponse = {
        id: response.id || Date.now(),
        document_id: document.id,
        request_prompt: requestData.prompt,
        response_content: response.response_content || getDemoResponse(assistanceType, prompt),
        assistance_type: assistanceType,
        created_at: response.created_at || new Date()
      };

      setResponses((prev: AiAssistanceResponse[]) => [newResponse, ...prev]);
      
      // If it's content generation, add to document
      if (assistanceType === 'write' || assistanceType === 'edit') {
        onContentGenerated('\n\n' + newResponse.response_content);
      }

      setPrompt('');
      setContext('');
    } catch (error) {
      console.error('Failed to get AI assistance:', error);
      // Demo fallback
      const demoResponse: AiAssistanceResponse = {
        id: Date.now(),
        document_id: document.id,
        request_prompt: prompt,
        response_content: getDemoResponse(assistanceType, prompt),
        assistance_type: assistanceType,
        created_at: new Date()
      };

      setResponses((prev: AiAssistanceResponse[]) => [demoResponse, ...prev]);
      
      if (assistanceType === 'write' || assistanceType === 'edit') {
        onContentGenerated('\n\n' + demoResponse.response_content);
      }

      setPrompt('');
      setContext('');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDemoResponse = (type: string, userPrompt: string): string => {
    switch (type) {
      case 'write':
        return `Based on your request "${userPrompt}", here's some generated content:\n\nArtificial Intelligence has transformed numerous industries, and education is no exception. The integration of AI technologies in educational settings offers unprecedented opportunities for personalized learning, efficient administration, and enhanced student outcomes. By leveraging machine learning algorithms and data analytics, educational institutions can now provide tailored learning experiences that adapt to individual student needs and learning styles.`;
        
      case 'edit':
        return `Here are some suggestions to improve your content:\n\n• Consider adding more specific examples to support your main points\n• The introduction could be strengthened with a compelling statistic or question\n• Try breaking longer paragraphs into smaller, more digestible chunks\n• Add transition sentences between sections for better flow\n• Consider including a call-to-action or conclusion that summarizes key takeaways`;
        
      case 'study_guide':
        return `# Study Guide: ${document.title}\n\n## Key Concepts\n- Main topic overview\n- Supporting arguments and evidence\n- Important terminology and definitions\n\n## Review Questions\n1. What are the main themes discussed in this document?\n2. How do the different sections relate to each other?\n3. What evidence supports the primary arguments?\n\n## Discussion Points\n- Consider the implications of the main ideas\n- Think about real-world applications\n- Identify areas for further research\n\n## Action Items\n- Review source materials\n- Create summary notes\n- Prepare questions for discussion`;
        
      case 'summarize':
        return `## Document Summary\n\n**Main Topic:** ${document.title}\n\n**Key Points:**\n- The document explores important concepts related to its subject matter\n- Several supporting arguments and examples are presented\n- The content provides valuable insights for readers\n\n**Conclusion:** This document offers a comprehensive overview of the topic and serves as a valuable resource for understanding the subject matter.\n\n**Word Count:** Approximately ${document.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length} words`;
        
      default:
        return 'I\'m here to help with your document! Please specify what kind of assistance you need.';
    }
  };

  const getAssistanceTypeIcon = (type: string): string => {
    switch (type) {
      case 'write': return '✍️';
      case 'edit': return '✏️';
      case 'study_guide': return '📚';
      case 'summarize': return '📄';
      default: return '🤖';
    }
  };

  const getAssistanceTypeLabel = (type: string): string => {
    switch (type) {
      case 'write': return 'Write Content';
      case 'edit': return 'Edit & Improve';
      case 'study_guide': return 'Study Guide';
      case 'summarize': return 'Summarize';
      default: return 'Unknown';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">🤖 AI Writing Assistant</h2>
        <p className="text-sm text-gray-600">
          Get help with writing, editing, and understanding your document content
        </p>
      </div>

      {/* AI Request Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">✨ Request AI Assistance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <Select
              value={assistanceType}
              onValueChange={(value: 'write' | 'edit' | 'study_guide' | 'summarize') =>
                setAssistanceType(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assistance type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="write">✍️ Help me write content</SelectItem>
                <SelectItem value="edit">✏️ Edit and improve my text</SelectItem>
                <SelectItem value="study_guide">📚 Generate study guide</SelectItem>
                <SelectItem value="summarize">📄 Summarize document</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="What would you like help with? Be specific about your needs..."
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              rows={3}
              required
            />

            <Textarea
              placeholder="Context (optional): Paste any specific text you want me to work with or provide additional context..."
              value={context}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
              rows={2}
            />

            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? '🤔 Thinking...' : '🚀 Get AI Assistance'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AI Response History */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">💬 AI Assistance History</h3>
          {responses.length > 0 && (
            <Badge variant="outline">
              {responses.length} interactions
            </Badge>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <Card className="flex items-center justify-center py-12">
            <CardContent className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to assist!</h3>
              <p className="text-gray-500 mb-4">
                Use the form above to get AI help with writing, editing, or understanding your document
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-sm">
                <Badge variant="outline" className="p-2">✍️ Write content</Badge>
                <Badge variant="outline" className="p-2">✏️ Edit text</Badge>
                <Badge variant="outline" className="p-2">📚 Study guides</Badge>
                <Badge variant="outline" className="p-2">📄 Summarize</Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {responses.map((response: AiAssistanceResponse) => (
                <Card key={response.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getAssistanceTypeIcon(response.assistance_type)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getAssistanceTypeLabel(response.assistance_type)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {response.created_at.toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Your request:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        "{response.request_prompt}"
                      </p>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">AI Response:</p>
                      <div className="text-sm text-gray-800 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                        <pre className="whitespace-pre-wrap font-sans">
                          {response.response_content}
                        </pre>
                      </div>
                    </div>

                    {(response.assistance_type === 'write' || response.assistance_type === 'edit') && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onContentGenerated('\n\n' + response.response_content)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          📝 Add to Document
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          🚧 <strong>Demo Mode:</strong> This AI assistant is currently showing demo responses. In production, this would connect to a real AI service like OpenAI GPT or similar.
        </p>
      </div>
    </div>
  );
}
