
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentList } from '@/components/DocumentList';
import { SourceManager } from '@/components/SourceManager';
import { AiAssistant } from '@/components/AiAssistant';
import type { Document, CreateDocumentInput, User } from '../../server/src/schema';

function App() {
  // Current user (in real app, this would come from auth)
  const [currentUser] = useState<User>({
    id: 1,
    email: 'user@example.com',
    name: 'Demo User',
    created_at: new Date()
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');

  // Load user's documents
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getDocuments.query({
        user_id: currentUser.id,
        limit: 50,
        offset: 0
      });
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Since handlers are stubs, show demo data
      const demoDocuments: Document[] = [
        {
          id: 1,
          title: 'Research Paper Draft',
          content: '<h1>Introduction</h1><p>This is my research paper about AI in education...</p>',
          user_id: currentUser.id,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 2,
          title: 'Meeting Notes',
          content: '<h2>Weekly Team Meeting</h2><ul><li>Project updates</li><li>AI integration discussion</li></ul>',
          user_id: currentUser.id,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        }
      ];
      setDocuments(demoDocuments);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocumentTitle.trim()) return;

    setIsCreating(true);
    try {
      const newDocData: CreateDocumentInput = {
        title: newDocumentTitle,
        content: '',
        user_id: currentUser.id
      };

      const newDocument = await trpc.createDocument.mutate(newDocData);
      setDocuments((prev: Document[]) => [newDocument, ...prev]);
      setNewDocumentTitle('');
      setSelectedDocument(newDocument);
    } catch (error) {
      console.error('Failed to create document:', error);
      // Demo fallback
      const demoDocument: Document = {
        id: Date.now(),
        title: newDocumentTitle,
        content: '',
        user_id: currentUser.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      setDocuments((prev: Document[]) => [demoDocument, ...prev]);
      setSelectedDocument(demoDocument);
      setNewDocumentTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectDocument = async (docId: number) => {
    try {
      const document = await trpc.getDocument.query({
        id: docId,
        user_id: currentUser.id
      });
      setSelectedDocument(document);
    } catch (error) {
      console.error('Failed to load document:', error);
      // Fallback to local document
      const localDoc = documents.find(d => d.id === docId);
      if (localDoc) {
        setSelectedDocument(localDoc);
      }
    }
  };

  const handleDocumentUpdate = (updatedDocument: Document) => {
    setDocuments((prev: Document[]) =>
      prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
    );
    setSelectedDocument(updatedDocument);
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await trpc.deleteDocument.mutate({
        id: docId,
        user_id: currentUser.id
      });
      setDocuments((prev: Document[]) => prev.filter(doc => doc.id !== docId));
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      // Demo fallback
      setDocuments((prev: Document[]) => prev.filter(doc => doc.id !== docId));
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📝 DocuMind</h1>
              <p className="text-sm text-gray-600">AI-Powered Document Editor</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                👤 {currentUser.name}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6 h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-80 flex flex-col space-y-4">
          {/* Create Document */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">✨ Create New Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDocument} className="space-y-3">
                <Input
                  placeholder="Document title..."
                  value={newDocumentTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDocumentTitle(e.target.value)
                  }
                  required
                />
                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? '⏳ Creating...' : '📄 Create Document'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Document List */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📚 Your Documents</CardTitle>
              {documents.length > 0 && (
                <Badge variant="outline" className="w-fit">
                  {documents.length} documents
                </Badge>
              )}
            </CardHeader>
            <CardContent className="h-full overflow-hidden p-0">
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedDocument ? (
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedDocument.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {selectedDocument.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    💾 Auto-saved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <Tabs defaultValue="editor" className="h-full flex flex-col">
                  <TabsList className="mx-6 mt-4 grid w-fit grid-cols-3">
                    <TabsTrigger value="editor">✏️ Editor</TabsTrigger>
                    <TabsTrigger value="sources">📎 Sources</TabsTrigger>
                    <TabsTrigger value="ai">🤖 AI Assistant</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="editor" className="h-full m-0">
                      <DocumentEditor
                        document={selectedDocument}
                        onUpdate={handleDocumentUpdate}
                      />
                    </TabsContent>
                    
                    <TabsContent value="sources" className="h-full m-0">
                      <SourceManager documentId={selectedDocument.id} />
                    </TabsContent>
                    
                    <TabsContent value="ai" className="h-full m-0">
                      <AiAssistant
                        document={selectedDocument}
                        onContentGenerated={(content: string) => {
                          const updatedDoc: Document = {
                            ...selectedDocument,
                            content: selectedDocument.content + content,
                            updated_at: new Date()
                          };
                          handleDocumentUpdate(updatedDoc);
                        }}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Welcome to DocuMind
                </h3>
                <p className="text-gray-500 max-w-md">
                  Select a document from the sidebar to start editing, or create a new one to begin your AI-assisted writing journey.
                </p>
                {documents.length === 0 && !isLoading && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Tip:</strong> Your documents will be enhanced with AI assistance and source management features!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
