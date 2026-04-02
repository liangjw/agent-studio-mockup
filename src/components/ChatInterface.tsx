import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2, X, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { startAgentCreationChat, startAgentEditChat } from '../services/geminiService';
import { Message, Agent } from '../types';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  onAgentCreated: (agent: Agent) => void;
  onAgentUpdated: (agent: Agent) => void;
  onClose: () => void;
  editingAgent?: Agent | null;
}

export default function ChatInterface({ onAgentCreated, onAgentUpdated, onClose, editingAgent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      if (editingAgent) {
        setMessages([
          {
            id: '1',
            role: 'model',
            text: `I'm ready to help you edit **${editingAgent.name}**. What would you like to change? (e.g., "Update the description", "Add a tag", or "Change the timeout")`,
            timestamp: new Date()
          }
        ]);
        chatRef.current = await startAgentEditChat(editingAgent);
      } else {
        setMessages([
          {
            id: '1',
            role: 'model',
            text: "Hello! I'm your Agent Forge Guide. I'll help you design your custom AI agent. What kind of agent do you have in mind today?",
            timestamp: new Date()
          }
        ]);
        chatRef.current = await startAgentCreationChat();
      }
    };
    initChat();
  }, [editingAgent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: input });
      
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'fetch_address_info') {
            const { address, type } = call.args as any;
            
            let hostname = address;
            try {
              const urlToParse = address.includes('://') ? address : `https://${address}`;
              hostname = new URL(urlToParse).hostname;
            } catch (e) {}

            const fetchedInfo = {
              name: `${type} Agent (${hostname})`,
              description: `Automated agent synchronized from ${address}. This agent inherits capabilities from the source ${type} service.`,
              icon: type === 'Dify' ? 'Zap' : 'Brain'
            };
            
            const toolResponse = await chatRef.current.sendMessage({
              message: `I've detected the following info from ${address}: 
              Name: ${fetchedInfo.name}
              Description: ${fetchedInfo.description}
              
              Would you like to continue with more guidance or create this agent immediately?`
            });

            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: toolResponse.text || "Info fetched. What's next?",
              timestamp: new Date()
            }]);
          } else if (call.name === 'create_agent') {
            const agentData = call.args as any;
            const newAgent: Agent = {
              ...agentData,
              createdAt: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `✨ **Agent Created!** I've successfully forged **${newAgent.name}** (Code: ${newAgent.code}). Redirecting you to the details...`,
              timestamp: new Date()
            }]);
            
            setTimeout(() => onAgentCreated(newAgent), 1500);
          } else if (call.name === 'update_agent') {
            const updateData = call.args as any;
            if (editingAgent) {
              const updatedAgent: Agent = {
                ...editingAgent,
                ...updateData,
                meta: {
                  ...editingAgent.meta,
                  ...(updateData.meta || {})
                },
                agent_config: {
                  ...editingAgent.agent_config,
                  ...(updateData.agent_config || {})
                },
                config: {
                  ...(editingAgent.config || {}),
                  ...(updateData.config || {})
                }
              };

              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: `✅ **Agent Updated!** I've applied the changes to **${updatedAgent.name}**.`,
                timestamp: new Date()
              }]);

              setTimeout(() => onAgentUpdated(updatedAgent), 1500);
            }
          }
        }
      } else {
        const modelMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response.text || "I'm sorry, I couldn't process that.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, modelMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
    // We use a timeout to ensure the state update is processed before handleSend
    setTimeout(() => {
      const btn = document.getElementById('chat-send-btn');
      btn?.click();
    }, 0);
  };

  const showTypeOptions = !editingAgent && (messages.length === 1 || 
    (messages[messages.length - 1]?.role === 'model' && 
     (messages[messages.length - 1]?.text.toLowerCase().includes('type') || 
      messages[messages.length - 1]?.text.toLowerCase().includes('kind of agent'))));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "flex flex-col h-full bg-white shadow-2xl border border-slate-200 overflow-hidden",
        editingAgent ? "rounded-3xl" : "rounded-2xl"
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
            {editingAgent ? <Edit3 size={20} /> : <Sparkles size={20} />}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{editingAgent ? 'Agent Editor' : 'Agent Forge Guide'}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {editingAgent ? `Editing ${editingAgent.name}` : 'Online & Ready to Help'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
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
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-slate-100 text-slate-800 rounded-tl-none"
            )}>
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-white">
                <ReactMarkdown>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {/* Quick Options for Agent Type */}
        {showTypeOptions && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 ml-12"
          >
            {['Dify', 'LangChain', 'Skill'].map((type) => (
              <button
                key={type}
                onClick={() => handleQuickReply(type)}
                className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
              >
                {type} Agent
              </button>
            ))}
          </motion.div>
        )}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span className="text-sm text-slate-500 italic">Forging response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your agent..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
          <button
            id="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-center text-slate-400 uppercase tracking-wider font-medium">
          Powered by Gemini 3 Flash
        </p>
      </div>
    </motion.div>
  );
}
