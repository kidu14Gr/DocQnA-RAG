import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, User, Bot, FileText, Sparkles } from 'lucide-react';
import type { Message, Source } from '../types';

interface ChatSectionProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  documentName?: string;
  isAnswering: boolean;
  isGuest?: boolean;
  onUpgradeClick?: () => void;
}

export function ChatSection({
  messages,
  onSendMessage,
  documentName,
  isAnswering,
  isGuest = false,
  onUpgradeClick,
}: ChatSectionProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnswering]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto px-4 py-6">
      {documentName && (
        <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 animate-in fade-in slide-in-from-top duration-500">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500">Chatting with</p>
            <p className="text-slate-900 truncate">{documentName}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
        {messages.length === 0 && !isAnswering && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-900">Ask anything about your document</h3>
                <p className="text-slate-500 text-sm max-w-md">
                  {isGuest
                    ? 'I can chat about any topic. Sign in to upload documents and get citation-backed answers.'
                    : "I'll provide detailed answers with exact citations from your document"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {(isGuest
                  ? [
                      'Tell me a fun fact about space',
                      'Help me plan my day',
                      'Explain quantum computing simply',
                    ]
                  : ['Summarize the main points', 'What are the key findings?', 'Explain the methodology']
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {isGuest && onUpgradeClick && (
                <button
                  onClick={onUpgradeClick}
                  className="mt-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow hover:shadow-lg transition-all duration-300"
                >
                  Sign in to unlock document chat
                </button>
              )}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-in fade-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {message.type === 'user' ? (
              <UserMessage content={message.content} />
            ) : (
              <AIMessage content={message.content} sources={message.sources} />
            )}
          </div>
        ))}

        {isAnswering && (
          <div className="animate-in fade-in slide-in-from-bottom duration-300">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="flex items-end space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isGuest ? 'Ask me anything...' : 'Ask a question about your document...'}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            disabled={isAnswering}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAnswering}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-start space-x-3 max-w-3xl">
        <div className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md">
          <p>{content}</p>
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function AIMessage({ content, sources }: { content: string; sources?: Source[] }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3 max-w-3xl">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-md border border-slate-200">
            <p className="text-slate-700 whitespace-pre-line">{content}</p>
          </div>

          {sources && sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 px-2">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => {
                  const pageNumber = source.page ?? source.page_number ?? idx + 1;
                  return (
                    <div
                      key={idx}
                      className="group bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                          <FileText className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">
                          Page {pageNumber}
                        </span>
                      </div>
                      {source.text && (
                        <p
                          className="text-xs text-slate-400 mt-1 group-hover:text-slate-600 transition-colors"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {source.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-md border border-slate-200">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
