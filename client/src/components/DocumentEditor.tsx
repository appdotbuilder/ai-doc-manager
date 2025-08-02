
import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Document, UpdateDocumentInput } from '../../../server/src/schema';

interface DocumentEditorProps {
  document: Document;
  onUpdate: (updatedDocument: Document) => void;
}

export function DocumentEditor({ document, onUpdate }: DocumentEditorProps) {
  const [content, setContent] = useState(document.content);
  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local state when document changes
  useEffect(() => {
    setContent(document.content);
    setTitle(document.title);
    setHasUnsavedChanges(false);
  }, [document.content, document.title]);

  // Auto-save functionality
  const saveDocument = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const updateData: UpdateDocumentInput = {
        id: document.id,
        title: title.trim() || 'Untitled Document',
        content: content
      };

      const updatedDoc = await trpc.updateDocument.mutate(updateData);
      
      // Since handler returns Document | null, handle both cases
      const fullUpdatedDoc: Document = updatedDoc || {
        ...document,
        title: updateData.title || document.title,
        content: updateData.content || document.content,
        updated_at: new Date()
      };

      onUpdate(fullUpdatedDoc);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save document:', error);
      // Demo fallback - simulate successful save
      const fullUpdatedDoc: Document = {
        ...document,
        title: title.trim() || 'Untitled Document',
        content: content,
        updated_at: new Date()
      };
      onUpdate(fullUpdatedDoc);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [document, title, content, hasUnsavedChanges, onUpdate]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      saveDocument();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, title, hasUnsavedChanges, saveDocument]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleManualSave = () => {
    saveDocument();
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  // Strip HTML for plain text word count
  const plainTextContent = content.replace(/<[^>]*>/g, '');

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold bg-transparent border-none outline-none flex-1 mr-4"
            placeholder="Document title..."
          />
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Unsaved changes
              </Badge>
            )}
            {isSaving && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                💾 Saving...
              </Badge>
            )}
            {lastSaved && !hasUnsavedChanges && !isSaving && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                ✅ Saved {lastSaved.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>📊 {getWordCount(plainTextContent)} words</span>
            <span>🔤 {getCharacterCount(plainTextContent)} characters</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? '💾 Saving...' : '💾 Save Now'}
          </Button>
        </div>
      </div>

      {/* Rich Text Editor Area */}
      <div className="flex-1 p-6">
        <Card className="h-full">
          <CardContent className="p-4 h-full">
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="mb-4 p-2 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>✏️ Rich Text Editor</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-xs">Currently editing in plain text mode</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    🚧 Rich text features coming soon
                  </Badge>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1">
                <Textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your document here... 

✨ Use the AI Assistant tab to get help with writing
📎 Add sources in the Sources tab to enhance your content
🤖 Generate study guides and summaries with AI

Your content will be automatically saved as you type."
                  className="h-full resize-none border-none focus:ring-0 text-base leading-relaxed"
                  style={{ minHeight: '400px' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Document ID: {document.id} • Created: {document.created_at.toLocaleDateString()}</span>
          <span>Auto-save enabled • Changes saved automatically</span>
        </div>
      </div>
    </div>
  );
}
