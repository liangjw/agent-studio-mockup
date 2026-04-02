import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Zap, 
  Terminal, 
  Cpu,
  History as HistoryIcon,
  Plus,
  MessageSquare,
  ChevronDown,
  Activity,
  ExternalLink
} from 'lucide-react';
import { Agent } from '../types';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

interface AgentPlaygroundProps {
  agent: Agent;
  onBack: () => void;
}

export default function AgentPlayground({ agent, onBack }: AgentPlaygroundProps) {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'default',
      title: 'New Conversation',
      messages: [
        {
          id: '1',
          role: 'agent',
          text: `Hello! I am **${agent.name}** (v${agent.meta.version}). I'm connected via \`${agent.agent_config.address}\` and ready to assist you. How can I help?`,
          timestamp: new Date()
        }
      ],
      updatedAt: new Date()
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('default');
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Close history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      title: `Conversation ${sessions.length + 1}`,
      messages: [
        {
          id: '1',
          role: 'agent',
          text: `Hello! I am **${agent.name}**. Starting a fresh session. How can I help?`,
          timestamp: new Date()
        }
      ],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowHistory(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    // Update session title if it's the first user message
    const isFirstUserMsg = !messages.some(m => m.role === 'user');
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: isFirstUserMsg ? (input.length > 20 ? input.substring(0, 20) + '...' : input) : s.title,
          messages: [...s.messages, userMsg],
          updatedAt: new Date()
        };
      }
      return s;
    }));

    setInput('');
    setIsProcessing(true);

    // Simulate agent processing
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: `This is a simulated response from **${agent.name}**. In a production environment, I would process your request using the capabilities: ${agent.capabilities.join(', ')}.`,
        timestamp: new Date()
      };
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, agentMsg],
            updatedAt: new Date()
          };
        }
        return s;
      }));
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col h-[calc(100vh-3rem)] max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 relative z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{agent.name}</h2>
              <p className="text-[10px] text-slate-500 font-medium">v{agent.meta.version}</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 ml-2" />

          {/* History Toggle */}
          <div className="relative" ref={historyRef}>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium",
                showHistory 
                  ? "bg-white border-indigo-200 text-indigo-600 shadow-sm" 
                  : "bg-transparent border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
              )}
            >
              <HistoryIcon size={16} />
              <span className="max-w-[120px] truncate">{activeSession.title}</span>
              <ChevronDown size={14} className={cn("transition-transform", showHistory && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Chat History</span>
                    <button 
                      onClick={createNewSession}
                      className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                      title="New Session"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setShowHistory(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
                          activeSessionId === session.id 
                            ? "bg-indigo-50 text-indigo-600" 
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <MessageSquare size={14} className={activeSessionId === session.id ? "text-indigo-500" : "text-slate-400"} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{session.title}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {session.messages.length} messages • {session.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-white text-slate-600 border border-slate-200" : "bg-indigo-600 text-white"
                )}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                )}>
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                    {msg.text}
                  </div>
                  <div className={cn(
                    "mt-1.5 text-[9px] font-medium opacity-50 uppercase tracking-wider",
                    msg.role === 'user' ? "text-right" : ""
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-slate-400 italic">Agent is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Message ${agent.name}...`}
                className="w-full pl-4 pr-[180px] py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
              />
              <div className="absolute right-2 flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                  <Cpu size={14} className="text-indigo-500" />
                  Gemini 1.5 Pro
                  <ChevronDown size={12} className="opacity-50" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Runtime Info */}
        <div className="w-72 border-l border-slate-100 bg-slate-50/50 p-6 space-y-6 hidden lg:block">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12} />
              Observability
            </h3>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Langfuse Tracing</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Monitor agent performance, token usage, and execution traces in real-time.
              </p>
              <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <ExternalLink size={14} />
                Open Langfuse
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
