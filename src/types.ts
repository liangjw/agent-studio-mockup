export enum AgentType {
  DIFY = 'Dify',
  LANGCHAIN = 'LangChain',
  SKILL = 'Skill',
  CHATBOT = 'Chatbot',
  ASSISTANT = 'Assistant',
  RESEARCHER = 'Researcher',
  CREATIVE = 'Creative',
  TECHNICAL = 'Technical'
}

export interface AgentMeta {
  version: string;
  tags: string[];
  [key: string]: any;
}

export interface AgentConfig {
  address: string;
  [key: string]: any;
}

export interface RuntimeConfig {
  timeout?: number;
  maxRetries?: number;
  [key: string]: any;
}

export interface Agent {
  code: string;
  name: string;
  description: string;
  type: AgentType;
  meta: AgentMeta;
  agent_config: AgentConfig;
  capabilities: string[];
  config?: RuntimeConfig;
  createdAt: string;
  icon?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  suggestions?: string[];
}
