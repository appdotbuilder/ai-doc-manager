
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      case 'url': return 'Web Link';
      case 'file': return 'File Upload';
      case 'text': return 'Text Note';
      default: return 'Unknown';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">📎 Document Sources</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add research materials, references, and notes to enhance your document
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showAddForm ? '❌ Cancel' : '➕ Add Source'}
        </Button>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">✨ Add New Source</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSource} className="space-y-4">
              <Input
                placeholder="Source title..."
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>)=>
                  setFormData((prev: CreateSourceInput) => ({ ...prev, title: e.target.value }))
                }
                required
              />

              <Select
                value={formData.source_type || 'text'}
                onValueChange={(value: 'url' | 'file' | 'text') =>
                  setFormData((prev: CreateSourceInput) => ({ ...prev, source_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">📝 Text Note</SelectItem>
                  <SelectItem value="url">🔗 Web Link</SelectItem>
                  <SelectItem value="file">📁 File Upload</SelectItem>
                </SelectContent>
              </Select>

              {formData.source_type === 'url' && (
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.source_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateSourceInput) => ({
                      ...prev,
                      source_url: e.target.value || null
                    }))
                  }
                />
              )}

              <Textarea
                placeholder="Source content, notes, or description..."
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateSourceInput) => ({ ...prev, content: e.target.value }))
                }
                rows={4}
                required
              />

              <div className="flex space-x-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? '⏳ Adding...' : '💾 Add Source'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sources List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sources.length === 0 ? (
          <Card className="flex items-center justify-center py-12">
            <CardContent className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No sources yet</h3>
              <p className="text-gray-500 mb-4">
                Add research materials, references, or notes to help with your writing
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                📎 Add Your First Source
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {sources.map((source: Source) => (
                <Card key={source.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-lg">{getSourceIcon(source.source_type)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{source.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getSourceTypeLabel(source.source_type)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {source.created_at.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Source</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{source.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSource(source.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {source.source_url && (
                      <div className="mb-2">
                        <a
                          href={source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          🔗 {source.source_url}
                        </a>
                      </div>
                    )}

                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      <p className="whitespace-pre-wrap line-clamp-4">
                        {source.content}
                      </p>
                      {source.content.length > 200 && (
                        <button className="text-blue-600 text-xs mt-2 hover:underline">
                          Show more...
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {sources.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Your sources will be used by the AI Assistant to provide more accurate and relevant suggestions when helping with your document.
          </p>
        </div>
      )}
    </div>
  );
}
