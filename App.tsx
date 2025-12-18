import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, ChatConfig } from './types';
import { DEFAULT_CONFIG, ICONS } from './constants';
import { geminiService } from './services/geminiService';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChatConfig>(() => {
    const saved = localStorage.getItem('ichat_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          apiKeys: parsed.apiKeys || []
        };
      } catch (e) {
        return DEFAULT_CONFIG as ChatConfig;
      }
    }
    return DEFAULT_CONFIG as ChatConfig;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    localStorage.setItem('ichat_config', JSON.stringify(config));
  }, [config]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!config.apiKeys || config.apiKeys.length === 0) {
      setError("Please add at least one API Key in settings.");
      setIsSettingsOpen(true);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    const botId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botId,
      role: 'model',
      content: "",
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, botMsg]);

    try {
      await geminiService.sendMessage(newMessages, config, (streamedText) => {
        setMessages(prev => prev.map(m => 
          m.id === botId ? { ...m, content: streamedText } : m
        ));
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get response from Gemini.";
      setError(errorMessage);
      // Remove the empty bot message on error
      setMessages(prev => prev.filter(m => m.id !== botId));
    } finally {
      setIsLoading(false);
      // Re-focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    if (window.confirm("Clear all messages?")) {
      setMessages([]);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <ICONS.Bot />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight text-white">iChat Portal</h1>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5 uppercase tracking-widest flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${(config.apiKeys && config.apiKeys.length > 0) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              {config.modelName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-xl transition-all duration-200"
            title="Clear Chat"
          >
            <ICONS.Trash />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200"
            title="Settings"
          >
            <ICONS.Settings />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 max-w-sm mx-auto select-none">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative p-8 bg-slate-900/50 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
                <div className="w-16 h-16 flex items-center justify-center bg-slate-800 rounded-2xl mb-4 mx-auto">
                   <ICONS.Bot />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Ready to assist</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Deployed on your iStoreOS node. Securely tunnelled via Cloudflare.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["Check system status", "Write a shell script", "Analyze network"].map(t => (
                <button 
                  key={t}
                  onClick={() => setInput(t)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out`}
            >
              <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`mt-1 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border border-blue-400/20'
                }`}>
                  {msg.role === 'user' ? <ICONS.User /> : <ICONS.Bot />}
                </div>
                <div className={`group relative px-5 py-3.5 rounded-2xl shadow-xl transition-all ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none border border-blue-500/50' 
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed break-words">
                    {msg.content || (isLoading && msg.id === messages[messages.length - 1].id && (
                      <span className="flex gap-1.5 items-center py-1">
                        <span className="w-1.5 h-1.5 bg-current opacity-40 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-current opacity-60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-current opacity-80 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                    ))}
                  </div>
                  <span className={`absolute bottom-[-1.2rem] text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${msg.role === 'user' ? 'right-0 text-slate-500' : 'left-0 text-slate-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {error && (
          <div className="flex justify-center max-w-lg mx-auto p-4 animate-in slide-in-from-top-2">
            <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 text-red-400 px-5 py-3 rounded-2xl text-xs flex items-center gap-3 shadow-2xl shadow-red-500/10">
              <div className="p-1.5 bg-red-500/20 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <span className="flex-1 font-medium">{error}</span>
              <button onClick={() => setError(null)} className="hover:text-white p-1">✕</button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto relative flex items-end gap-3">
          <div className="relative flex-1 group">
            <textarea
              ref={inputRef}
              className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl px-5 py-4 min-h-[58px] max-h-48 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-slate-200 resize-none shadow-2xl placeholder:text-slate-600"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-4 rounded-2xl transition-all duration-300 shadow-xl flex-shrink-0 flex items-center justify-center ${
              !input.trim() || isLoading
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 active:scale-95 shadow-blue-900/30'
            }`}
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <ICONS.Send />
            )}
          </button>
        </div>
        <div className="max-w-4xl mx-auto flex justify-between items-center mt-4 px-1">
          <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">
            iStoreOS Internal Portal v1.0
          </p>
          <div className="flex gap-4">
             <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Latency: --ms</span>
             <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Secure Tunnel Active</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal 
          config={config} 
          onSave={setConfig} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;