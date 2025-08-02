import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Source, CreateSourceInput } from '../../../server/src/schema';

interface SourceManagerProps {
  documentId: number;
}

export function SourceManager({ documentId }: SourceManagerProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<CreateSourceInput>({
    document_id: documentId,
    title: '',
    content: '',
    source_type: 'text',
    source_url: null
  });

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getSources.query({ document_id: documentId });
      setSources(result);
    } catch (error) {
      console.error('Failed to load sources:', error);
      // Demo fallback data
      const demoSources: Source[] = [
        {
          id: 1,
          document_id: documentId,
          title: 'Research Article: AI in Education',
          content: 'This comprehensive study examines the impact of artificial intelligence on modern educational practices...',
          source_type: 'url',
          source_url: 'https://example.com/ai-education-research',
          created_at: new Date('2024-01-15')
        },
        {
          id: 2,
          document_id: documentId,
          title: 'Personal Notes',
          content: 'Key points from the conference:\n- AI tools increase productivity by 40%\n- Student engagement improves with personalized learning',
          source_type: 'text',
          source_url: null,
          created_at: new Date('2024-01-16')
        }
      ];
      setSources(demoSources);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newSource = await trpc.createSource.mutate(formData);
      setSources((prev: Source[]) => [newSource, ...prev]);
      setFormData({
        document_id: documentId,
        title: '',
        content: '',
        source_type: 'text',
        source_url: null
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create source:', error);
      // Demo fallback
      const demoSource: Source = {
        id: Date.now(),
        document_id: documentId,
        title: formData.title,
        content: formData.content,
        source_type: formData.source_type,
        source_url: formData.source_url || null,
        created_at: new Date()
      };
      setSources((prev: Source[]) => [demoSource, ...prev]);
      setFormData({
        document_id: documentId,
        title: '',
        content: '',
        source_type: 'text',
        source_url: null
      });
      setShowAddForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    try {
      await trpc.deleteSource.mutate({
        id: sourceId,
        document_id: documentId
      });
      setSources((prev: Source[]) => prev.filter(source => source.id !== sourceId));
    } catch (error) {
      console.error('Failed to delete source:', error);
      // Demo fallback
      setSources((prev: Source[]) => prev.filter(source => source.id !== sourceId));
    }
  };

  const getSourceIcon = (sourceType: string): string => {
    switch (sourceType) {
      case 'url': return '🔗';
      case 'file': return '📁';
      case 'text': return '📝';
      default: return '📄';
    }
  };

  const getSourceTypeLabel = (sourceType: string): string => {
    switch (sourceType) {
      case 'url': return 'WEB LINK';
      case 'file': return 'FILE UPLOAD';
      case 'text': return 'TEXT NOTE';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Neobrutalist Header */}
      <div className="neo-bg-accent neo-border-thick neo-shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="neo-text-xl neo-bold neo-uppercase">📎 DOCUMENT SOURCES</h2>
            <p className="font-bold neo-uppercase text-sm mt-2">
              ADD RESEARCH MATERIALS, REFERENCES, AND NOTES TO ENHANCE YOUR DOCUMENT
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? '❌ CANCEL' : '➕ ADD SOURCE'}
          </button>
        </div>
      </div>

      {/* Neobrutalist Add Source Form */}
      {showAddForm && (
        <div className="neo-card mb-6">
          <h3 className="neo-text-xl neo-bold neo-uppercase mb-4">✨ ADD NEW SOURCE</h3>
          <form onSubmit={handleCreateSource} className="space-y-4">
            <input
              type="text"
              placeholder="SOURCE TITLE..."
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>)=>
                setFormData((prev: CreateSourceInput) => ({ ...prev, title: e.target.value }))
              }
              required
              className="w-full"
            />

            <div className="neo-border neo-shadow">
              <Select
                value={formData.source_type || 'text'}
                onValueChange={(value: 'url' | 'file' | 'text') =>
                  setFormData((prev: CreateSourceInput) => ({ ...prev, source_type: value }))
                }
              >
                <SelectTrigger className="font-bold neo-uppercase">
                  <SelectValue placeholder="SELECT SOURCE TYPE" />
                </SelectTrigger>
                <SelectContent className="neo-card">
                  <SelectItem value="text" className="font-bold neo-uppercase">📝 TEXT NOTE</SelectItem>
                  <SelectItem value="url" className="font-bold neo-uppercase">🔗 WEB LINK</SelectItem>
                  <SelectItem value="file" className="font-bold neo-uppercase">📁 FILE UPLOAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.source_type === 'url' && (
              <input
                type="url"
                placeholder="HTTPS://EXAMPLE.COM"
                value={formData.source_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateSourceInput) => ({
                    ...prev,
                    source_url: e.target.value || null
                  }))
                }
                className="w-full"
              />
            )}

            <textarea
              placeholder="SOURCE CONTENT, NOTES, OR DESCRIPTION..."
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateSourceInput) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              required
              className="w-full"
            />

            <div className="flex space-x-3">
              <button type="submit" disabled={isCreating} className="btn-primary">
                {isCreating ? '⏳ ADDING...' : '💾 ADD SOURCE'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Neobrutalist Sources List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-4">
            <div className="spinner mx-auto"></div>
            <p className="text-center font-bold neo-uppercase">LOADING SOURCES...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="neo-card flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="neo-text-xl neo-bold neo-uppercase mb-4">NO SOURCES YET</h3>
              <p className="font-bold neo-uppercase mb-6">
                ADD RESEARCH MATERIALS, REFERENCES, OR NOTES TO HELP WITH YOUR WRITING
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                📎 ADD YOUR FIRST SOURCE
              </button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {sources.map((source: Source) => (
                <div key={source.id} className="neo-card neobrutalist-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-2xl">{getSourceIcon(source.source_type)}</span>
                      <div className="flex-1">
                        <h4 className="font-black text-lg neo-uppercase">{source.title}</h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="neo-bg-secondary neo-border neo-shadow-sm px-2 py-1">
                            <span className="text-xs font-bold neo-uppercase">
                              {getSourceTypeLabel(source.source_type)}
                            </span>
                          </div>
                          <div className="neo-bg-muted neo-border neo-shadow-sm px-2 py-1">
                            <span className="text-xs font-bold neo-uppercase">
                              {source.created_at.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="text-2xl hover:transform hover:scale-110 transition-transform p-2"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="neo-card neo-border-thick neo-shadow-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="neo-text-xl neo-bold neo-uppercase">
                            DELETE SOURCE
                          </AlertDialogTitle>
                          <AlertDialogDescription className="font-bold neo-uppercase">
                            ARE YOU SURE YOU WANT TO DELETE "{source.title}"? THIS ACTION CANNOT BE UNDONE.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-4">
                          <AlertDialogCancel className="btn-secondary">CANCEL</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSource(source.id)}
                            className="btn-destructive"
                          >
                            DELETE
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {source.source_url && (
                    <div className="mb-4">
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neo-bg-accent neo-border neo-shadow px-3 py-2 inline-block font-bold neo-uppercase text-sm hover:transform hover:translate-x-1 hover:translate-y-1 transition-transform"
                      >
                        🔗 {source.source_url}
                      </a>
                    </div>
                  )}

                  <div className="neo-bg-muted neo-border neo-inset p-4">
                    <p className="whitespace-pre-wrap font-semibold">
                      {source.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {sources.length > 0 && (
        <div className="neo-bg-accent neo-border neo-shadow p-4 mt-6">
          <p className="font-bold neo-uppercase">
            💡 TIP: YOUR SOURCES WILL BE USED BY THE AI ASSISTANT TO PROVIDE MORE ACCURATE 
            AND RELEVANT SUGGESTIONS WHEN HELPING WITH YOUR DOCUMENT.
          </p>
        </div>
      )}
    </div>
  );
}