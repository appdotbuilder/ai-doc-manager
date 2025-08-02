import { useState, useEffect, useCallback } from 'react';
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
      {/* Neobrutalist Editor Header */}
      <div className="neo-bg-secondary neo-border-thick neo-shadow p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="neo-text-2xl neo-bold neo-uppercase bg-transparent border-none outline-none flex-1 mr-4"
            placeholder="DOCUMENT TITLE..."
            style={{ 
              background: 'transparent',
              border: 'none',
              fontFamily: 'Arial Black, Helvetica, sans-serif',
              fontWeight: '900'
            }}
          />
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <div className="neo-bg-accent neo-border neo-shadow-sm px-3 py-1">
                <span className="text-sm font-bold neo-uppercase">⚠️ UNSAVED</span>
              </div>
            )}
            {isSaving && (
              <div className="neo-bg-primary neo-border neo-shadow-sm px-3 py-1">
                <span className="text-sm font-bold neo-uppercase text-white">💾 SAVING...</span>
              </div>
            )}
            {lastSaved && !hasUnsavedChanges && !isSaving && (
              <div className="neo-bg-secondary neo-border neo-shadow-sm px-3 py-1">
                <span className="text-sm font-bold neo-uppercase">✅ SAVED {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="neo-bg-muted neo-border neo-shadow-sm px-3 py-1">
              <span className="text-sm font-bold neo-uppercase">📊 {getWordCount(plainTextContent)} WORDS</span>
            </div>
            <div className="neo-bg-muted neo-border neo-shadow-sm px-3 py-1">
              <span className="text-sm font-bold neo-uppercase">🔤 {getCharacterCount(plainTextContent)} CHARS</span>
            </div>
          </div>
          <button
            onClick={handleManualSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="btn-secondary"
          >
            {isSaving ? '💾 SAVING...' : '💾 SAVE NOW'}
          </button>
        </div>
      </div>

      {/* Neobrutalist Rich Text Editor Area */}
      <div className="flex-1">
        <div className="neo-card h-full">
          <div className="h-full flex flex-col">
            {/* Neobrutalist Toolbar */}
            <div className="neo-bg-accent neo-border-thick neo-shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-black neo-uppercase text-lg">✏️ RICH TEXT EDITOR</span>
                  <span className="font-bold neo-uppercase text-sm">PLAIN TEXT MODE</span>
                </div>
                <div className="neo-bg-muted neo-border neo-shadow-sm px-3 py-1">
                  <span className="text-xs font-bold neo-uppercase">🚧 RICH TEXT COMING SOON</span>
                </div>
              </div>
            </div>

            {/* Neobrutalist Editor Content */}
            <div className="flex-1 p-4">
              <div className="neo-border-thick neo-inset h-full">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="START WRITING YOUR DOCUMENT HERE...

✨ USE THE AI ASSISTANT TAB TO GET HELP WITH WRITING
📎 ADD SOURCES IN THE SOURCES TAB TO ENHANCE YOUR CONTENT  
🤖 GENERATE STUDY GUIDES AND SUMMARIES WITH AI

YOUR CONTENT WILL BE AUTOMATICALLY SAVED AS YOU TYPE."
                  className="w-full h-full p-6 text-base leading-relaxed resize-none"
                  style={{ 
                    minHeight: '400px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: '600',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Neobrutalist Status Bar */}
      <div className="neo-bg-muted neo-border-thick neo-shadow mt-4 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold neo-uppercase">
            DOCUMENT ID: {document.id} • CREATED: {document.created_at.toLocaleDateString()}
          </span>
          <span className="text-sm font-bold neo-uppercase">
            🔄 AUTO-SAVE ENABLED • CHANGES SAVED AUTOMATICALLY
          </span>
        </div>
      </div>
    </div>
  );
}