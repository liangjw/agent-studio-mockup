import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutDashboard, 
  Settings, 
  HelpCircle, 
  Search,
  Filter,
  Bot,
  Sparkles,
  Network,
  ArrowLeft
} from 'lucide-react';
import { Agent, AgentType } from './types';
import AgentCard from './components/AgentCard';
import ChatInterface from './components/ChatInterface';
import AgentDetail from './components/AgentDetail';
import AgentPlayground from './components/AgentPlayground';
import { ArchitectureAnimation } from './components/ArchitectureAnimation';
import { cn } from './lib/utils';

const INITIAL_AGENTS: Agent[] = [
  {
    code: 'arch-001',
    name: 'Code Architect',
    description: 'Expert in system design and TypeScript patterns. Helps with refactoring and architecture reviews.',
    type: AgentType.TECHNICAL,
    meta: {
      version: '1.2.0',
      tags: ['Engineering', 'Architecture']
    },
    agent_config: {
      address: 'local://architect'
    },
    capabilities: ['Architecture', 'Refactoring', 'TypeScript'],
    config: {
      timeout: 30
    },
    createdAt: '2024-03-15T10:00:00Z',
    icon: 'Cpu'
  }
];

type ViewState = 'dashboard' | 'detail' | 'playground' | 'architecture';

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgentCode, setSelectedAgentCode] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAgent = agents.find(a => a.code === selectedAgentCode);

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAgentCreated = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
    setIsCreating(false);
    setSelectedAgentCode(newAgent.code);
    setView('detail');
  };

  const handleSelectAgent = (code: string) => {
    setSelectedAgentCode(code);
    setView('detail');
  };

  const handleRunAgent = () => {
    setView('playground');
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.code === updatedAgent.code ? updatedAgent : a));
    setEditingAgent(null);
    setIsCreating(false);
  };

  const handleStartEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsCreating(true);
  };

  const handleBack = () => {
    if (view === 'playground' || view === 'architecture') {
      setView('detail');
    } else {
      setView('dashboard');
      setSelectedAgentCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Bot size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Agent Forge</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button 
            onClick={() => { setView('dashboard'); setSelectedAgentCode(null); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all",
              view === 'dashboard' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard size={20} />
            Agents
          </button>
          <button 
            onClick={() => setView('architecture')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all",
              view === 'architecture' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Network size={20} />
            Architecture
          </button>
        </nav>

        <div className="p-4 mt-auto">
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-6 min-h-screen">
        <AnimatePresence mode="wait">
          {view === 'architecture' ? (
            <motion.div
              key="architecture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-500"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-xl font-bold">System Architecture Flow</h2>
              </div>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
                <ArchitectureAnimation />
              </div>
            </motion.div>
          ) : view === 'playground' && selectedAgent ? (
            <AgentPlayground 
              key="playground"
              agent={selectedAgent}
              onBack={handleBack}
            />
          ) : view === 'detail' && selectedAgent ? (
            <AgentDetail 
              key="detail"
              agent={selectedAgent} 
              onBack={handleBack}
              onRun={handleRunAgent}
              onEdit={handleStartEdit}
            />
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto"
            >
              {/* Header */}
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">My Agents</h2>
                  <p className="text-sm text-slate-500">Manage and deploy your custom AI workforce.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                >
                  <Plus size={18} />
                  Create New Agent
                </button>
              </header>

              {/* Search & Filter */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
                  <Filter size={16} />
                  Filters
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredAgents.map((agent) => (
                    <div key={agent.code} onClick={() => handleSelectAgent(agent.code)} className="cursor-pointer">
                      <AgentCard agent={agent} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredAgents.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No agents found</h3>
                  <p className="text-slate-500">Try adjusting your search or create a new agent.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Creation/Edit Overlay */}
      <AnimatePresence>
        {isCreating && (
          <div className={cn(
            "fixed inset-0 z-50 flex p-4 transition-all duration-500",
            editingAgent ? "justify-end pointer-events-none" : "items-center justify-center"
          )}>
            {!editingAgent && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsCreating(false); setEditingAgent(null); }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
            )}
            <motion.div 
              initial={editingAgent ? { x: 400, opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={editingAgent ? { x: 400, opacity: 0 } : { scale: 0.9, opacity: 0 }}
              className={cn(
                "relative pointer-events-auto",
                editingAgent ? "w-[400px] h-[calc(100vh-32px)]" : "w-full max-w-2xl h-[80vh]"
              )}
            >
              <ChatInterface 
                onAgentCreated={handleAgentCreated}
                onAgentUpdated={handleUpdateAgent}
                editingAgent={editingAgent}
                onClose={() => { setIsCreating(false); setEditingAgent(null); }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
