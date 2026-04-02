import React from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  Zap, 
  Brain, 
  Search, 
  PenTool, 
  Settings, 
  MoreVertical, 
  Calendar,
  Cpu
} from 'lucide-react';
import { Agent, AgentType } from '../types';
import { cn } from '../lib/utils';

const iconMap: Record<string, any> = {
  Bot, Zap, Brain, Search, PenTool, Cpu
};

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const Icon = iconMap[agent.icon || 'Bot'] || Bot;

  const typeColors: Record<AgentType, string> = {
    [AgentType.DIFY]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    [AgentType.LANGCHAIN]: 'bg-orange-50 text-orange-600 border-orange-100',
    [AgentType.SKILL]: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    [AgentType.CHATBOT]: 'bg-blue-50 text-blue-600 border-blue-100',
    [AgentType.ASSISTANT]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [AgentType.RESEARCHER]: 'bg-purple-50 text-purple-600 border-purple-100',
    [AgentType.CREATIVE]: 'bg-pink-50 text-pink-600 border-pink-100',
    [AgentType.TECHNICAL]: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 hover:bg-slate-100 rounded text-slate-400">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          typeColors[agent.type].split(' ')[0],
          typeColors[agent.type].split(' ')[1]
        )}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate">{agent.name}</h3>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase tracking-wider",
              typeColors[agent.type]
            )}>
              {agent.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
            {agent.description}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap, idx) => (
            <span 
              key={idx}
              className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 text-slate-400">+{agent.capabilities.length - 3}</span>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>v{agent.meta.version}</span>
          </div>
          <button className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
            Launch <Zap size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
