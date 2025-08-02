import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      case 'write': return 'WRITE CONTENT';
      case 'edit': return 'EDIT & IMPROVE';
      case 'study_guide': return 'STUDY GUIDE';
      case 'summarize': return 'SUMMARIZE';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Neobrutalist Header */}
      <div className="neo-bg-accent neo-border-thick neo-shadow p-6 mb-6">
        <h2 className="neo-text-xl neo-bold neo-uppercase mb-2">🤖 AI WRITING ASSISTANT</h2>
        <p className="font-bold neo-uppercase">
          GET HELP WITH WRITING, EDITING, AND UNDERSTANDING YOUR DOCUMENT CONTENT
        </p>
      </div>

      {/* Neobrutalist AI Request Form */}
      <div className="neo-card mb-6">
        <h3 className="neo-text-xl neo-bold neo-uppercase mb-4">✨ REQUEST AI ASSISTANCE</h3>
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div className="neo-border neo-shadow">
            <Select
              value={assistanceType}
              onValueChange={(value: 'write' | 'edit' | 'study_guide' | 'summarize') =>
                setAssistanceType(value)
              }
            >
              <SelectTrigger className="font-bold neo-uppercase">
                <SelectValue placeholder="SELECT ASSISTANCE TYPE" />
              </SelectTrigger>
              <SelectContent className="neo-card">
                <SelectItem value="write" className="font-bold neo-uppercase">✍️ HELP ME WRITE CONTENT</SelectItem>
                <SelectItem value="edit" className="font-bold neo-uppercase">✏️ EDIT AND IMPROVE MY TEXT</SelectItem>
                <SelectItem value="study_guide" className="font-bold neo-uppercase">📚 GENERATE STUDY GUIDE</SelectItem>
                <SelectItem value="summarize" className="font-bold neo-uppercase">📄 SUMMARIZE DOCUMENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <textarea
            placeholder="WHAT WOULD YOU LIKE HELP WITH? BE SPECIFIC ABOUT YOUR NEEDS..."
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            rows={3}
            required
            className="w-full"
          />

          <textarea
            placeholder="CONTEXT (OPTIONAL): PASTE ANY SPECIFIC TEXT YOU WANT ME TO WORK WITH OR PROVIDE ADDITIONAL CONTEXT..."
            value={context}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
            rows={2}
            className="w-full"
          />

          <button type="submit" disabled={isGenerating} className="w-full btn-primary">
            {isGenerating ? '🤔 THINKING...' : '🚀 GET AI ASSISTANCE'}
          </button>
        </form>
      </div>

      {/* Neobrutalist AI Response History */}
      <div className="flex-1 overflow-hidden">
        <div className="neo-bg-secondary neo-border-thick neo-shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="neo-text-xl neo-bold neo-uppercase">💬 AI ASSISTANCE HISTORY</h3>
            {responses.length > 0 && (
              <div className="neo-bg-muted neo-border neo-shadow-sm px-3 py-1">
                <span className="text-sm font-bold neo-uppercase">
                  {responses.length} INTERACTIONS
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="space-y-4">
            <div className="spinner mx-auto"></div>
            <p className="text-center font-bold neo-uppercase">LOADING AI HISTORY...</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="neo-card flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-8xl mb-6">🤖</div>
              <h3 className="neo-text-xl neo-bold neo-uppercase mb-4">READY TO ASSIST!</h3>
              <p className="font-bold neo-uppercase mb-6">
                USE THE FORM ABOVE TO GET AI HELP WITH WRITING, EDITING, OR UNDERSTANDING YOUR DOCUMENT
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="neo-bg-accent neo-border neo-shadow-sm p-3">
                  <span className="font-bold neo-uppercase text-sm">✍️ WRITE CONTENT</span>
                </div>
                <div className="neo-bg-accent neo-border neo-shadow-sm p-3">
                  <span className="font-bold neo-uppercase text-sm">✏️ EDIT TEXT</span>
                </div>
                <div className="neo-bg-accent neo-border neo-shadow-sm p-3">
                  <span className="font-bold neo-uppercase text-sm">📚 STUDY GUIDES</span>
                </div>
                <div className="neo-bg-accent neo-border neo-shadow-sm p-3">
                  <span className="font-bold neo-uppercase text-sm">📄 SUMMARIZE</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {responses.map((response: AiAssistanceResponse) => (
                <div key={response.id} className="neo-card neobrutalist-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getAssistanceTypeIcon(response.assistance_type)}</span>
                      <div className="neo-bg-secondary neo-border neo-shadow-sm px-3 py-1">
                        <span className="text-sm font-bold neo-uppercase">
                          {getAssistanceTypeLabel(response.assistance_type)}
                        </span>
                      </div>
                    </div>
                    <div className="neo-bg-muted neo-border neo-shadow-sm px-3 py-1">
                      <span className="text-xs font-bold neo-uppercase">
                        {response.created_at.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-black neo-uppercase text-sm mb-2">YOUR REQUEST:</p>
                    <div className="neo-bg-muted neo-inset p-3">
                      <p className="font-semibold">"{response.request_prompt}"</p>
                    </div>
                  </div>

                  <div className="neo-border-thick my-4" style={{ height: '3px', background: 'var(--neo-border)' }}></div>

                  <div>
                    <p className="font-black neo-uppercase text-sm mb-2">AI RESPONSE:</p>
                    <div className="neo-bg-accent neo-border neo-inset p-4">
                      <pre className="whitespace-pre-wrap font-semibold">
                        {response.response_content}
                      </pre>
                    </div>
                  </div>

                  {(response.assistance_type === 'write' || response.assistance_type === 'edit') && (
                    <div className="mt-4 pt-4" style={{ borderTop: '3px solid var(--neo-border)' }}>
                      <button
                        onClick={() => onContentGenerated('\n\n' + response.response_content)}
                        className="btn-secondary"
                      >
                        📝 ADD TO DOCUMENT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Neobrutalist Footer Info */}
      <div className="neo-bg-accent neo-border neo-shadow p-4 mt-6">
        <p className="font-bold neo-uppercase">
          🚧 DEMO MODE: THIS AI ASSISTANT IS CURRENTLY SHOWING DEMO RESPONSES. 
          IN PRODUCTION, THIS WOULD CONNECT TO A REAL AI SERVICE LIKE OPENAI GPT OR SIMILAR.
        </p>
      </div>
    </div>
  );
}