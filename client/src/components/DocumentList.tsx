import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Document } from '../../../server/src/schema';

interface DocumentListProps {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (docId: number) => void;
  onDeleteDocument: (docId: number) => void;
  isLoading: boolean;
}

export function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  isLoading
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (docId: number) => {
    setDeletingId(docId);
    try {
      await onDeleteDocument(docId);
    } finally {
      setDeletingId(null);
    }
  };

  const getContentPreview = (content: string): string => {
    // Strip HTML tags and get first 60 characters
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 60 ? textContent.substring(0, 60) + '...' : textContent;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="spinner"></div>
        <p className="text-center font-bold neo-uppercase">LOADING DOCUMENTS...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">📄</div>
        <p className="font-bold neo-uppercase text-lg">NO DOCUMENTS YET</p>
        <p className="font-bold neo-uppercase text-sm mt-2">CREATE YOUR FIRST DOCUMENT ABOVE!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {documents.map((document: Document) => (
          <div
            key={document.id}
            className={`neo-border neo-shadow p-4 cursor-pointer neobrutalist-hover transition-all ${
              selectedDocument?.id === document.id
                ? 'neo-bg-accent transform translate-x-1 translate-y-1'
                : 'neo-bg-card hover:neo-bg-secondary'
            }`}
            onClick={() => onSelectDocument(document.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-black text-sm neo-uppercase truncate flex-1 mr-2">
                {document.title}
              </h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="text-lg hover:transform hover:scale-110 transition-transform"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="neo-card neo-border-thick neo-shadow-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="neo-text-xl neo-bold neo-uppercase">
                      DELETE DOCUMENT
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-bold neo-uppercase">
                      ARE YOU SURE YOU WANT TO DELETE "{document.title}"? THIS ACTION CANNOT BE UNDONE.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-4">
                    <AlertDialogCancel className="btn-secondary">
                      CANCEL
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(document.id)}
                      disabled={deletingId === document.id}
                      className="btn-destructive"
                    >
                      {deletingId === document.id ? 'DELETING...' : 'DELETE'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {document.content && (
              <p className="text-sm font-bold mb-3 line-clamp-2">
                {getContentPreview(document.content)}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="neo-bg-muted neo-border neo-shadow-sm px-2 py-1">
                <span className="text-xs font-bold neo-uppercase">
                  {document.updated_at.toLocaleDateString()}
                </span>
              </div>
              {selectedDocument?.id === document.id && (
                <div className="neo-bg-primary neo-border neo-shadow-sm px-3 py-1">
                  <span className="text-xs font-bold neo-uppercase text-white">
                    ⚡ ACTIVE
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}