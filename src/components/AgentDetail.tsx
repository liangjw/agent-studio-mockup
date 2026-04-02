import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Bot, 
  Zap, 
  Brain, 
  Settings, 
  Play, 
  Code, 
  Shield, 
  Edit,
  Save,
  X,
  Globe,
  Terminal
} from 'lucide-react';
import { Agent, AgentType } from '../types';
import { cn } from '../lib/utils';

const iconMap: Record<string, any> = {
  Bot, Zap, Brain
};

interface AgentDetailProps {
  agent: Agent;
  onBack: () => void;
  onRun: () => void;
  onEdit: (agent: Agent) => void;
}

export default function AgentDetail({ agent, onBack, onRun, onEdit }: AgentDetailProps) {
  const [activeTab, setActiveTab] = useState<'agent' | 'runtime'>('agent');
  const Icon = iconMap[agent.icon || 'Bot'] || Bot;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-5xl mx-auto pb-20"
    >
      {/* Header - More Compact */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-2xl font-bold text-slate-900">{agent.name}</h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 font-medium uppercase tracking-wider">
              {agent.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Globe size={12} />
            {agent.agent_config.address || 'Local Agent'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => onEdit(agent)}
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
          <button 
            onClick={onRun}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Play size={16} />
            Run Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Left Column: Info & Advanced Config */}
        <div className="col-span-3 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
              <Shield size={16} className="text-indigo-600" />
              Description
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed border border-slate-100">
              {agent.description}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
              <Code size={16} className="text-indigo-600" />
              Capabilities
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {agent.capabilities.map((cap, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <Zap size={12} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 truncate">{cap}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Advanced Config with Tabs */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Settings size={16} className="text-indigo-600" />
                Advanced Configuration
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('agent')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    activeTab === 'agent' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Agent Config
                </button>
                <button 
                  onClick={() => setActiveTab('runtime')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    activeTab === 'runtime' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Runtime Config
                </button>
              </div>
            </div>
            <div className="p-6 bg-slate-900">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[11px] text-indigo-300 overflow-x-auto"
                >
                  <div className="flex items-center gap-2 mb-3 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    <Terminal size={12} />
                    {activeTab === 'agent' ? 'agent_config.json' : 'runtime_config.json'}
                  </div>
                  <pre className="leading-relaxed">
                    {JSON.stringify(activeTab === 'agent' ? agent.agent_config : (agent.config || {}), null, 2)}
                  </pre>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Meta */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-wider text-slate-400">Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Code</span>
                <span className="font-mono font-medium text-slate-900">{agent.code}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Version</span>
                <span className="font-medium text-slate-900">{agent.meta.version}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-900">{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 text-[11px] block mb-1.5">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {agent.meta.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] text-slate-500">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
