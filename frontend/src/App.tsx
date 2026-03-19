import { useState } from 'react';
import { AuthSection, clearStoredToken, getStoredToken } from './components/AuthSection';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ChatSection } from './components/ChatSection';
import { ArrowRight, Sparkles, Bot, ShieldCheck, FileUp } from 'lucide-react';
import { askQuestion } from './lib/api';
import type { DocumentInfo, Message, View } from './types';

const DEFAULT_TOP_K = 4;

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [activeView, setActiveView] = useState<View>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [uploadedDocument, setUploadedDocument] = useState<DocumentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const isAuthenticated = Boolean(token);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  const handleDocumentUpload = (doc: DocumentInfo) => {
    setUploadedDocument(doc);
    setActiveView('chat');
  };

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      type: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAnswering(true);
    setActiveView('chat');

    try {
      const result = await askQuestion(trimmed, DEFAULT_TOP_K, token ?? undefined);
      const sources = (result.sources ?? []).map((source, idx) => {
        const typed = source as Record<string, unknown>;
        const pageValue = typed.page ?? typed.page_number;
        return {
          page: typeof pageValue === 'number' ? pageValue : Number(pageValue) || idx + 1,
          page_number: typeof pageValue === 'number' ? pageValue : Number(pageValue) || idx + 1,
          text:
            typeof typed.text === 'string'
              ? typed.text
              : typeof typed === 'object'
                ? JSON.stringify(typed)
                : 'No text provided',
        };
      });

      const aiMessage: Message = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-ai`,
        type: 'ai',
        content: result.answer ?? 'No answer returned.',
        sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: Message = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-error`,
        type: 'ai',
        content:
          error instanceof Error ? error.message : 'Something went wrong while contacting the backend.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <Header
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'upload' && !isAuthenticated) {
            openAuthModal('signin');
            return;
          }
          setActiveView(view);
        }}
        isAuthenticated={isAuthenticated}
        onOpenAuth={() => openAuthModal('signin')}
        onLogout={
          isAuthenticated
            ? () => {
                clearStoredToken();
                setToken(null);
                setUploadedDocument(null);
                setActiveView('home');
              }
            : undefined
        }
      />

      <main className="flex-1 overflow-hidden">
        {activeView === 'home' && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-700">
              <section className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm">
                  <Sparkles className="w-4 h-4" />
                  Ninja chatbot online
                </div>
                <h1 className="text-4xl md:text-6xl leading-tight bg-gradient-to-r from-indigo-700 via-purple-600 to-sky-600 bg-clip-text text-transparent">
                  Welcome! I am your ninja chatbot.
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                  Talk to me about anything, and we can discuss and chat freely. Sign up to drop your
                  documents and chat about them with citation-backed answers.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveView('chat')}
                    className="group px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Start chatting
                    <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => (isAuthenticated ? setActiveView('upload') : openAuthModal('signup'))}
                    className="px-6 py-3 bg-white text-slate-700 rounded-xl shadow border border-slate-200 hover:shadow-md transition-all duration-300"
                  >
                    Upload docs
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 pt-2 text-sm text-slate-600">
                  <div className="p-3 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-600" /> Free guest chat
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-indigo-600" /> Smart document Q&A
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Secure account workspace
                  </div>
                </div>
              </section>

              <section className="relative h-[420px] rounded-3xl bg-slate-900 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 hero-gradient-orb" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-300 to-indigo-500 chatbot-core-pulse shadow-[0_0_80px_rgba(99,102,241,0.6)]" />
                    <div className="absolute -inset-6 rounded-full border border-indigo-300/40 chatbot-ring-spin" />
                    <div className="absolute -inset-14 rounded-full border border-cyan-300/30 chatbot-ring-spin-reverse" />
                    <div className="absolute top-8 left-8 w-3 h-3 rounded-full bg-white" />
                    <div className="absolute top-8 right-8 w-3 h-3 rounded-full bg-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-4 text-slate-100 chatbot-float">
                  <p className="text-sm text-slate-200">Ninja bot</p>
                  <p className="text-base">Ask me anything. I answer in milliseconds.</p>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeView === 'upload' && isAuthenticated && (
          <UploadSection onDocumentUpload={handleDocumentUpload} token={token} />
        )}

        {activeView === 'upload' && !isAuthenticated && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-lg">
              <h2 className="text-2xl text-slate-900 mb-2">Sign in required</h2>
              <p className="text-slate-600 mb-5">
                Upload and document-grounded chat are protected features. Continue with an account to unlock them.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-5 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'chat' && (
          <ChatSection
            messages={messages}
            onSendMessage={handleSendMessage}
            documentName={uploadedDocument?.name}
            isAnswering={isAnswering}
            isGuest={!isAuthenticated}
            onUpgradeClick={() => openAuthModal('signup')}
          />
        )}
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 z-10"
              aria-label="Close sign in"
            >
              x
            </button>
            <div className="bg-white/95 rounded-2xl shadow-2xl border border-slate-200">
              <AuthSection
                initialMode={authInitialMode}
                title={authInitialMode === 'signup' ? 'Create your ninja account' : 'Welcome back'}
                subtitle="Sign in to upload docs and chat with your own knowledge base."
                onClose={() => setShowAuthModal(false)}
                onAuthenticated={(nextToken) => {
                  setToken(nextToken);
                  setShowAuthModal(false);
                  if (activeView === 'home') setActiveView('upload');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
