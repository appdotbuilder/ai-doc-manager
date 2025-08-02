import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentList } from '@/components/DocumentList';
import { SourceManager } from '@/components/SourceManager';
import { AiAssistant } from '@/components/AiAssistant';
import type { Document, CreateDocumentInput, User } from '../../server/src/schema';
import './App.css';

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
    <div className="min-h-screen neo-bg-card">
      {/* Neobrutalist Header */}
      <header className="neo-bg-primary neo-border-thick neo-shadow-lg">
        <div className="container">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="neo-text-3xl neo-bold">📝 DOCUMIND</h1>
              <p className="text-lg font-bold neo-uppercase">AI-Powered Document Editor</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="neo-bg-accent neo-border neo-shadow px-4 py-2">
                <span className="neo-bold neo-uppercase">👤 {currentUser.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container flex gap-8 h-[calc(100vh-140px)] py-6">
        {/* Neobrutalist Sidebar */}
        <div className="w-96 flex flex-col space-y-6">
          {/* Create Document */}
          <div className="neo-card">
            <h3 className="neo-text-xl neo-bold mb-4">✨ CREATE NEW DOCUMENT</h3>
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <input
                type="text"
                placeholder="DOCUMENT TITLE..."
                value={newDocumentTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewDocumentTitle(e.target.value)
                }
                required
                className="w-full"
              />
              <button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? '⏳ CREATING...' : '📄 CREATE DOCUMENT'}
              </button>
            </form>
          </div>

          {/* Document List */}
          <div className="neo-card flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="neo-text-xl neo-bold">📚 YOUR DOCUMENTS</h3>
              {documents.length > 0 && (
                <div className="neo-bg-secondary neo-border neo-shadow-sm px-3 py-1">
                  <span className="font-bold text-sm neo-uppercase">
                    {documents.length} DOCS
                  </span>
                </div>
              )}
            </div>
            <div className="h-full overflow-hidden">
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedDocument ? (
            <div className="neo-card flex-1 overflow-hidden">
              {/* Document Header */}
              <div className="neo-border-thick neo-bg-accent p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="neo-text-2xl neo-bold">{selectedDocument.title}</h2>
                    <p className="text-lg font-bold neo-uppercase mt-2">
                      LAST UPDATED: {selectedDocument.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="neo-bg-secondary neo-border neo-shadow px-4 py-2">
                    <span className="font-bold neo-uppercase">💾 AUTO-SAVED</span>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="editor" className="h-full flex flex-col">
                  <div className="px-6 mb-4">
                    <TabsList className="grid w-fit grid-cols-3 neo-border neo-shadow">
                      <TabsTrigger value="editor" className="neo-bold neo-uppercase">
                        ✏️ EDITOR
                      </TabsTrigger>
                      <TabsTrigger value="sources" className="neo-bold neo-uppercase">
                        📎 SOURCES
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="neo-bold neo-uppercase">
                        🤖 AI ASSISTANT
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="flex-1 overflow-hidden px-6 pb-6">
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
              </div>
            </div>
          ) : (
            <div className="neo-card flex-1 flex items-center justify-center">
              <div className="text-center py-16">
                <div className="text-8xl mb-6">📝</div>
                <h3 className="neo-text-2xl neo-bold mb-4">
                  WELCOME TO DOCUMIND
                </h3>
                <p className="text-lg font-bold neo-uppercase max-w-md mb-6">
                  SELECT A DOCUMENT FROM THE SIDEBAR TO START EDITING, 
                  OR CREATE A NEW ONE TO BEGIN YOUR AI-ASSISTED WRITING JOURNEY.
                </p>
                {documents.length === 0 && !isLoading && (
                  <div className="neo-bg-accent neo-border neo-shadow p-6 max-w-lg">
                    <p className="font-bold neo-uppercase">
                      💡 TIP: YOUR DOCUMENTS WILL BE ENHANCED WITH AI ASSISTANCE 
                      AND SOURCE MANAGEMENT FEATURES!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;