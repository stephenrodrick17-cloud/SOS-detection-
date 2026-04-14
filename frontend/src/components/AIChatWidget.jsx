import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const AIChatWidget = ({ analysisContext = null, initialMessage = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-open and explain when analysis completes
  useEffect(() => {
    if (analysisContext && analysisContext.detections) {
      setMessages([]);
      setIsOpen(true);
      setHasNewMessage(false);
      // Trigger AI explanation with a slight delay for smooth UX
      const triggerExplanation = async () => {
        const text = 'Explain this infrastructure damage analysis to me in detail.';
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        setMessages([userMsg]);
        setLoading(true);
        try {
          const response = await fetch(`${BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              analysis_context: analysisContext,
              conversation_history: [],
            }),
          });
          const data = await response.json();
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
        } catch {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get analysis. Make sure the backend is running and GEMINI_API_KEY is set.', timestamp: new Date(), isError: true }]);
        } finally {
          setLoading(false);
        }
      };
      const t = setTimeout(triggerExplanation, 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisContext]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && !analysisContext) {
      setMessages([{
        role: 'assistant',
        content: "👋 Hello! I'm **RoadGuard AI**. Run an AI detection, then ask me to explain the results — or ask anything about road damage, costs, and repairs!",
        timestamp: new Date()
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText, ctxOverride = null) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          analysis_context: ctxOverride || analysisContext || null,
          conversation_history: history
        })
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      }]);

      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check that the backend server is running and your GEMINI_API_KEY is configured.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const QUICK_PROMPTS = [
    "What does this damage mean?",
    "How urgent is the repair?",
    "Explain the cost breakdown",
    "What causes potholes?",
  ];


  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="ai-chat-toggle"
        onClick={() => { setIsOpen(prev => !prev); setHasNewMessage(false); }}
        className={`fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 group ${
          isOpen 
            ? 'bg-slate-800 border border-slate-700 rotate-12' 
            : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/40 hover:scale-110 hover:-translate-y-1'
        }`}
        title="RoadGuard AI Assistant"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <Bot size={26} className="text-white" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-bounce border-2 border-slate-950" />
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed z-[9998] transition-all duration-400 ease-out ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
        } ${
          isExpanded 
            ? 'bottom-0 right-0 left-0 top-0 rounded-none' 
            : 'bottom-24 right-6 w-[420px] h-[600px] rounded-[2rem]'
        }`}
      >
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden rounded-[2rem]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight leading-none">RoadGuard AI</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">
                    Active Intelligence
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                title="Clear chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Sparkles size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] text-lg leading-relaxed font-medium ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none shadow-lg shadow-orange-500/10'
                      : msg.isError
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-none'
                        : 'bg-slate-800 text-white rounded-tl-none shadow-xl'
                  }`}
                >
                  <FormattedMessage content={msg.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-white animate-spin" />
                </div>
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (shown when no context or few messages) */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-orange-400 hover:border-orange-500/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Inquire about infrastructure telemetry..."
                  rows={1}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-base font-medium rounded-[1.5rem] px-6 py-4 resize-none focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-600 max-h-48"
                  style={{ minHeight: '60px' }}
                />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                id="ai-chat-send"
                className="w-11 h-11 flex-shrink-0 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition-all hover:scale-110 active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center font-bold uppercase tracking-widest">
              Powered by Google Gemini AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// Renders markdown-like formatting
const FormattedMessage = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Bold formatting
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-black text-white">{part}</strong> : part
        );

        // Bullet points
        if (line.startsWith('•') || line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
              <span>{rendered}</span>
            </div>
          );
        }

        // Numbered list
        if (line.match(/^\d+\.\s/)) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-orange-400 font-black flex-shrink-0">{line.match(/^(\d+)\./)[1]}.</span>
              <span>{parts.slice(1).map((part, j) => j % 2 === 1 ? <strong key={j} className="font-black text-white">{part}</strong> : part)}</span>
            </div>
          );
        }

        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
};

export default AIChatWidget;
