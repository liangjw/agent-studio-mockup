import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Server, Workflow, Cpu, ShieldCheck, Cog, HardDrive, MousePointerClick, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

const nodes = [
  { id: 0, icon: Bot, title: 'Frontend Chatbot', subtitle: 'User Interface', x: 12, y: 45 },
  { id: 1, icon: Server, title: 'Session & Routing', subtitle: 'Gateway Module', x: 35, y: 45 },
  { id: 2, icon: Workflow, title: 'LangChain Agent', subtitle: 'ReAct Orchestrator', x: 68, y: 55 },
  { id: 3, icon: Cpu, title: 'LLM Engine', subtitle: 'Reasoning (Gemini)', x: 68, y: 25 },
  { id: 4, icon: Cog, title: 'Agent CRUD Service', subtitle: 'Gateway Module', x: 35, y: 65 },
  { id: 5, icon: HardDrive, title: 'MariaDB', subtitle: 'Persistence Layer', x: 35, y: 88 },
];

const steps = [
  { from: 0, to: 1, label: 'Intent: "Update Agent"', color: '#4f46e5' },
  { from: 1, to: 2, label: 'Forward Request', color: '#4f46e5' },
  { from: 2, to: 3, label: 'Prompt (Thought)', color: '#8b5cf6' },
  { from: 3, to: 2, label: 'Action: update_agent', color: '#8b5cf6' },
  { from: 2, to: 4, label: 'Call CRUD API', color: '#f59e0b' },
  { from: 4, to: 5, label: 'SQL: UPDATE agents...', color: '#10b981' },
  { from: 5, to: 4, label: 'DB Success', color: '#10b981' },
  { from: 4, to: 2, label: 'Observation: Success', color: '#f59e0b' },
  { from: 2, to: 3, label: 'Context (Thought)', color: '#8b5cf6' },
  { from: 3, to: 2, label: 'Final Answer', color: '#8b5cf6' },
  { from: 2, to: 1, label: 'Service Response', color: '#4f46e5' },
  { from: 1, to: 0, label: 'UI Sync', color: '#4f46e5' },
];

const connections = [
  [0, 1], [1, 2], [2, 3], [2, 4], [4, 5]
];

export const ArchitectureAnimation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStep(0);
  };

  return (
    <div 
      className="relative w-full h-full bg-slate-50 overflow-hidden cursor-pointer select-none"
      onClick={handleNext}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 text-center pointer-events-none z-10">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Interactive ReAct Flow</h1>
        <p className="text-sm text-slate-500">Click anywhere to advance the data flow step-by-step</p>
      </div>

      {/* Agent Gateway Bounding Box */}
      <div 
        className="absolute border-2 border-dashed border-slate-300 bg-slate-100/50 rounded-3xl pointer-events-none z-0"
        style={{ left: '24%', top: '32%', width: '22%', height: '44%' }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-100 px-4 py-1 rounded-full border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Agent Gateway</span>
        </div>
      </div>

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {connections.map(([from, to], i) => {
          const n1 = nodes[from];
          const n2 = nodes[to];
          return (
            <line
              key={i}
              x1={`${n1.x}%`}
              y1={`${n1.y}%`}
              x2={`${n2.x}%`}
              y2={`${n2.y}%`}
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeDasharray="6 6"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const Icon = node.icon;
        const isActive = currentStep < steps.length && (steps[currentStep].from === node.id || steps[currentStep].to === node.id);
        
        return (
          <div
            key={node.id}
            className="absolute flex flex-col items-center gap-3 w-32 -ml-16 -mt-10 transition-all duration-300 pointer-events-none z-10"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300",
              node.id === 0 ? "bg-indigo-600 text-white" : node.id === 5 ? "bg-slate-900 text-white" : "bg-white text-indigo-600 border-2 border-slate-200",
              isActive && node.id !== 0 && node.id !== 5 && "border-indigo-400 shadow-indigo-100"
            )}>
              <Icon size={28} />
            </div>
            <div className="text-center">
              <h3 className="text-xs font-bold text-slate-800 leading-tight">{node.title}</h3>
              <p className="text-[9px] font-medium text-slate-500 mt-0.5">{node.subtitle}</p>
            </div>
          </div>
        );
      })}

      {/* Data Pulse */}
      <AnimatePresence mode="wait">
        {currentStep < steps.length ? (
          <motion.div
            key={currentStep}
            initial={{ left: `${nodes[steps[currentStep].from].x}%`, top: `${nodes[steps[currentStep].from].y}%`, opacity: 0, scale: 0.8 }}
            animate={{ left: `${nodes[steps[currentStep].to].x}%`, top: `${nodes[steps[currentStep].to].y}%`, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute -ml-20 -mt-4 w-40 flex flex-col items-center pointer-events-none z-20"
          >
            <div 
              className="px-3 py-1.5 text-white text-[10px] font-bold rounded-full shadow-md whitespace-nowrap"
              style={{ backgroundColor: steps[currentStep].color, boxShadow: `0 4px 12px ${steps[currentStep].color}66` }}
            >
              {steps[currentStep].label}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32 flex flex-col items-center z-20"
          >
            <div className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm flex items-center gap-2 mb-4">
              <ShieldCheck size={18} />
              Flow Complete
            </div>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm font-medium text-sm pointer-events-auto"
            >
              <RotateCcw size={16} />
              Restart Animation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200 shadow-sm pointer-events-none z-20">
        <MousePointerClick size={14} className="text-slate-400" />
        <span className="text-xs font-medium text-slate-600">
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
        <div className="flex gap-1 ml-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentStep ? "bg-indigo-600" : i < currentStep ? "bg-indigo-200" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
