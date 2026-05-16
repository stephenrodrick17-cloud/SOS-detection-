import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, RotateCcw, Maximize2, Minimize2, MessageSquare, Terminal, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const AIChatWidget = ({ analysisContext = null }) => {
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
    if (analysisContext && (analysisContext.detections || analysisContext.statistics)) {
      setMessages([]);
      setIsOpen(true);
      setHasNewMessage(false);
      let isMounted = true;
      
      const triggerExplanation = async () => {
        const text = analysisContext.detections 
          ? 'Conduct a technical engineering deep-dive into these specific structural anomalies.' 
          : 'Analyze these infrastructure trends and provide a strategic briefing.';
        
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        if (!isMounted) return;
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
            })
          });
          
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          
          const data = await response.json();
          if (isMounted) {
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
          }
        } catch (error) {
          if (isMounted) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: '### ⚠️ Connection Interrupted\nI was unable to establish a secure link with the neural processing unit. Please verify the backend status.', 
              timestamp: new Date(), 
              isError: true 
            }]);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      
      const t = setTimeout(triggerExplanation, 600);
      return () => {
        isMounted = false;
        clearTimeout(t);
      };
    }
  }, [analysisContext]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && !analysisContext) {
      setMessages([{
        role: 'assistant',
        content: "### 🤖 Neural Interface Active\nGreetings. I am **RoadGuard AI**, your strategic infrastructure advisor. I have access to real-time YOLOv8 telemetry and geospatial data.\n\nHow can I assist your command today?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, analysisContext]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => !m.isError)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          analysis_context: analysisContext || null,
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
        content: "### ❌ Operational Error\nFailed to synchronize with OpenRouter. Check your API configuration and system logs.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const QUICK_PROMPTS = [
    { label: "Deep Analysis", icon: <Cpu size={12} />, text: "Perform a structural deep-dive" },
    { label: "Cost Briefing", icon: <Sparkles size={12} />, text: "Break down repair costs & machinery" },
    { label: "IRC Standards", icon: <Terminal size={12} />, text: "Explain relevant IRC engineering codes" }
  ];

  return (
    <>
      {/* Floating Toggle */}
      <button
        onClick={() => { setIsOpen(prev => !prev); setHasNewMessage(false); }}
        className={`fixed bottom-8 right-8 z-[9999] w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 group ${
          isOpen 
            ? 'bg-slate-900 border border-slate-700 rotate-90 scale-90' 
            : 'bg-orange-500 shadow-orange-500/40 hover:scale-110 hover:-translate-y-2'
        }`}
      >
        {isOpen ? <X size={24} className="text-white" /> : (
          <div className="relative">
            <MessageSquare size={28} className="text-white" />
            {hasNewMessage && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-orange-500" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed z-[9998] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
        } ${
          isExpanded 
            ? 'inset-8 rounded-[2.5rem]' 
            : 'bottom-28 right-8 w-[450px] h-[650px] rounded-[2.5rem]'
        } bg-slate-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-3xl`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Neural Advisor</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v2.4.0 Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-3 hover:bg-white/5 rounded-xl text-slate-400 transition-all">
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/5 rounded-xl text-slate-400 transition-all"><X size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1 border border-white/5">
                  <Sparkles size={14} className="text-orange-500" />
                </div>
              )}
              <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-tr-none' 
                    : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none shadow-xl'
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center animate-spin">
                <RotateCcw size={14} className="text-orange-500" />
              </div>
              <div className="flex gap-1 mt-3">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-900/30 border-t border-white/5 space-y-4">
          {!loading && messages.length < 5 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => sendMessage(p.text)}
                  className="px-4 py-2 bg-slate-800/50 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 rounded-xl text-[10px] font-bold text-slate-400 hover:text-orange-500 transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}
          <div className="relative group">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Inquire about telemetry data..."
              rows={1}
              className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all resize-none max-h-32"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:grayscale transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;
