import { useEffect, useState } from 'react';
import { AuthSection, clearStoredToken, getStoredToken } from './components/AuthSection';
import { Header } from './components/Header';
import { ChatSection } from './components/ChatSection';
import { ArrowRight, Sparkles, Bot, ShieldCheck, FileUp, Plus } from 'lucide-react';
import { askQuestion, createChatSession, getChatMessages, listChatSessions } from './lib/api';
import type { ChatSession, DocumentInfo, Message, View } from './types';

const DEFAULT_TOP_K = 4;
const MAX_PROMPTS_PER_CHAT = 10;

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [activeView, setActiveView] = useState<View>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [uploadedDocument, setUploadedDocument] = useState<DocumentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const isAuthenticated = Boolean(token);
  const usedPromptsInActiveChat = messages.filter((m) => m.type === 'user').length;
  const remainingPrompts = Math.max(0, MAX_PROMPTS_PER_CHAT - usedPromptsInActiveChat);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  const handleDocumentUpload = (docName: string) => {
    const newDoc: DocumentInfo = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      name: docName,
      type: docName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: new Date(),
    };
    setUploadedDocument(newDoc);
    setActiveView('chat');
  };

  const refreshSessions = async (authToken: string) => {
    const items = await listChatSessions(authToken);
    setSessions(items);
    if (!activeChatId && items.length > 0) {
      setActiveChatId(items[0].id);
    }
  };

  useEffect(() => {
    if (!token) {
      setSessions([]);
      setActiveChatId(null);
      return;
    }
    refreshSessions(token).catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token || !activeChatId) return;
    getChatMessages(token, activeChatId)
      .then((rows) => {
        const restored: Message[] = rows.map((m) => ({
          id: m.id,
          type: m.role === 'assistant' ? 'ai' : 'user',
          content: m.message,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      })
      .catch(() => setMessages([]));
  }, [token, activeChatId]);

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (isAuthenticated && remainingPrompts <= 0) {
      const aiMessage: Message = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-limit`,
        type: 'ai',
        content:
          'You have reached the 10-message limit for this chat. Please upgrade to premium to continue in this chat, or create a New Chat +.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      return;
    }

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
      const result = await askQuestion(trimmed, DEFAULT_TOP_K, token ?? undefined, activeChatId ?? undefined);
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
      if (result.chat_id && result.chat_id !== activeChatId) {
        setActiveChatId(result.chat_id);
      }
      if (token) {
        refreshSessions(token).catch(() => undefined);
      }
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
        onNavigate={setActiveView}
        isAuthenticated={isAuthenticated}
        onOpenAuth={() => openAuthModal('signin')}
        onLogout={
          isAuthenticated
            ? () => {
                clearStoredToken();
                setToken(null);
                setUploadedDocument(null);
                setMessages([]);
                setSessions([]);
                setActiveChatId(null);
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
                  {!isAuthenticated && (
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="px-6 py-3 bg-white text-slate-700 rounded-xl shadow border border-slate-200 hover:shadow-md transition-all duration-300"
                    >
                      Sign up
                    </button>
                  )}
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

        {activeView === 'chat' &&
          (isAuthenticated ? (
            <div className="h-full flex">
              <aside className="w-72 border-r border-slate-200 bg-white/70 backdrop-blur-sm p-3 flex flex-col gap-3">
                <button
                  onClick={async () => {
                    if (!token) return;
                    const created = await createChatSession(token, 'New Chat');
                    setSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
                    setActiveChatId(created.id);
                    setMessages([]);
                    setUploadedDocument(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                  <Plus className="w-4 h-4" /> New Chat
                </button>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {sessions.length === 0 && (
                    <p className="text-sm text-slate-500 px-2 py-3">No chats yet. Start a new one.</p>
                  )}
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setActiveChatId(session.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                        activeChatId === session.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="truncate text-sm">{session.title}</p>
                    </button>
                  ))}
                </div>
              </aside>
              <div className="flex-1 min-w-0">
                <ChatSection
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  documentName={uploadedDocument?.name}
                  isAnswering={isAnswering}
                  isGuest={!isAuthenticated}
                  onUpgradeClick={() => openAuthModal('signup')}
                  onDocumentUpload={handleDocumentUpload}
                  onCreateNewChat={async () => {
                    if (!token) return;
                    const created = await createChatSession(token, 'New Chat');
                    setSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
                    setActiveChatId(created.id);
                    setMessages([]);
                    setUploadedDocument(null);
                  }}
                  token={token}
                  maxPrompts={MAX_PROMPTS_PER_CHAT}
                  remainingPrompts={remainingPrompts}
                />
              </div>
            </div>
          ) : (
            <ChatSection
              messages={messages}
              onSendMessage={handleSendMessage}
              documentName={uploadedDocument?.name}
              isAnswering={isAnswering}
              isGuest={!isAuthenticated}
              onUpgradeClick={() => openAuthModal('signup')}
              onDocumentUpload={handleDocumentUpload}
              token={token}
            />
          ))}
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
                  if (activeView === 'home') setActiveView('chat');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
