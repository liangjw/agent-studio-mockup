import { Agent, AgentType } from '../types';

const guideSystemInstruction = `You are the Agent Forge Guide. Help users create or edit agents following this strict flow:

FOR CREATION:
1. Ask the user which type of agent they want to create: Dify, LangChain, or Skill.
2. Based on their choice:
   - If Dify: Ask for the Dify address.
   - If LangChain or Skill: Ask for the A2a service address.
3. Once they provide the address, call 'fetch_address_info' to get the metadata.
4. Present the fetched info (title and description) to the user.
5. Ask the user if they want to:
   - Continue with further guidance/customization (like setting version, tags, or runtime config).
   - Or create the agent immediately.
6. If they confirm creation, call 'create_agent' with the gathered info, ensuring the new schema is followed (code, name, description, type, meta, agent_config, capabilities, config).

FOR EDITING:
1. You will be provided with the current agent's details.
2. Ask the user what they would like to change (e.g., name, description, capabilities, or configuration).
3. Once the user provides the changes, call 'update_agent' with the updated properties.

Be helpful and concise.`;

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

interface ChatResponse {
  text?: string;
  suggestions?: string[];
  functionCalls?: ToolCall[];
}

interface ChatSession {
  messages: Array<{ role: string; content: string }>;
  systemInstruction: string;
  sendMessage: (input: { message: string }) => Promise<ChatResponse>;
}

const fetchAddressInfoTool = {
  name: 'fetch_address_info',
  description: "Detect and fetch metadata (title, description) from a Dify or A2a service address.",
  parameters: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'The URL of the Dify or A2a service.' },
      type: { type: 'string', enum: [AgentType.DIFY, AgentType.LANGCHAIN, AgentType.SKILL], description: 'The type of service.' }
    },
    required: ['address', 'type']
  }
};

const createAgentTool = {
  name: 'create_agent',
  description: 'Finalize and create the new AI agent with the specified schema.',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'A unique code for the agent.' },
      name: { type: 'string', description: 'The name of the agent.' },
      description: { type: 'string', description: "A brief description of the agent's purpose." },
      type: { type: 'string', enum: Object.values(AgentType), description: 'The category or type of the agent.' },
      meta: {
        type: 'object',
        properties: {
          version: { type: 'string', description: "The version of the agent (e.g., '1.0.0')." },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the agent.' }
        },
        required: ['version', 'tags']
      },
      agent_config: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'The Dify or A2a service address.' }
        },
        required: ['address']
      },
      capabilities: { type: 'array', items: { type: 'string' }, description: 'A list of agent capabilities.' },
      config: {
        type: 'object',
        properties: {
          timeout: { type: 'number', description: 'Runtime timeout in seconds.' }
        },
        description: 'Optional runtime configuration.'
      },
      icon: { type: 'string', description: 'A Lucide icon name.' }
    },
    required: ['code', 'name', 'description', 'type', 'meta', 'agent_config', 'capabilities']
  }
};

const updateAgentTool = {
  name: 'update_agent',
  description: "Update an existing AI agent's properties based on user request.",
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The updated name of the agent.' },
      description: { type: 'string', description: 'The updated description.' },
      meta: {
        type: 'object',
        properties: {
          version: { type: 'string', description: 'The updated version.' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags.' }
        }
      },
      agent_config: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'The updated service address.' }
        }
      },
      capabilities: { type: 'array', items: { type: 'string' }, description: 'Updated list of capabilities.' },
      config: {
        type: 'object',
        properties: {
          timeout: { type: 'number', description: 'Updated runtime timeout.' }
        }
      }
    }
  }
};

// Build a system prompt that instructs the model to use tools
function buildSystemWithTools(systemInstruction: string): string {
  return `${systemInstruction}

IMPORTANT: You have access to the following tools. When a user asks you to fetch info from an address, call 'fetch_address_info'. When a user confirms agent creation, call 'create_agent'. When editing an agent, call 'update_agent'.

Tool definitions:
${JSON.stringify([fetchAddressInfoTool, createAgentTool, updateAgentTool], null, 2)}

When calling a tool, respond ONLY with a JSON object in this exact format:
{"name": "tool_name", "args": {"param1": "value1", "param2": "value2"}}

Do NOT call any tool unless the user's request clearly warrants it.`;
}

async function chatWithWorker(
  messages: Array<{ role: string; content: string }>,
  systemInstruction: string
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      systemInstruction,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const data = await response.json();

  // Try to parse the response as a tool call (JSON object with name/args)
  try {
    const parsed = JSON.parse(data.response);
    if (parsed && typeof parsed === 'object' && 'name' in parsed && 'args' in parsed) {
      return { functionCalls: [parsed as ToolCall] };
    }
  } catch {
    // Not a tool call, return as text
  }

  return { text: data.response, suggestions: Array.isArray(data.suggestions) ? data.suggestions : [] };
}

export function startAgentCreationChat(): ChatSession {
  const systemWithTools = buildSystemWithTools(guideSystemInstruction);
  const messages: Array<{ role: string; content: string }> = [];

  return {
    messages,
    systemInstruction: systemWithTools,
    sendMessage: async ({ message }: { message: string }) => {
      messages.push({ role: 'user', content: message });
      const response = await chatWithWorker(messages, systemWithTools);
      const text = response.text || (response.functionCalls?.length ? '' : '');
      if (text) {
        messages.push({ role: 'assistant', content: text });
      }
      return response;
    },
  };
}

export function startAgentEditChat(currentAgent: Agent): ChatSession {
  const systemWithTools = buildSystemWithTools(
    `${guideSystemInstruction}\n\nCURRENT AGENT TO EDIT:\n${JSON.stringify(currentAgent, null, 2)}`
  );
  const messages: Array<{ role: string; content: string }> = [];

  return {
    messages,
    systemInstruction: systemWithTools,
    sendMessage: async ({ message }: { message: string }) => {
      messages.push({ role: 'user', content: message });
      const response = await chatWithWorker(messages, systemWithTools);
      const text = response.text || (response.functionCalls?.length ? '' : '');
      if (text) {
        messages.push({ role: 'assistant', content: text });
      }
      return response;
    },
  };
}
