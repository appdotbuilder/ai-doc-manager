
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-3">📄</div>
        <p className="text-sm">No documents yet.</p>
        <p className="text-xs mt-1">Create your first document above!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {documents.map((document: Document) => (
          <div
            key={document.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              selectedDocument?.id === document.id
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectDocument(document.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm truncate flex-1 mr-2">
                {document.title}
              </h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    🗑️
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{document.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(document.id)}
                      disabled={deletingId === document.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deletingId === document.id ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {document.content && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {getContentPreview(document.content)}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {document.updated_at.toLocaleDateString()}
              </Badge>
              {selectedDocument?.id === document.id && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Active
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
