import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Agent, AgentType } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const fetchAddressInfoTool: FunctionDeclaration = {
  name: "fetch_address_info",
  description: "Detect and fetch metadata (title, description) from a Dify or A2a service address.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      address: { type: Type.STRING, description: "The URL of the Dify or A2a service." },
      type: { type: Type.STRING, enum: [AgentType.DIFY, AgentType.LANGCHAIN, AgentType.SKILL], description: "The type of service." }
    },
    required: ["address", "type"]
  }
};

const createAgentTool: FunctionDeclaration = {
  name: "create_agent",
  description: "Finalize and create the new AI agent with the specified schema.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: { type: Type.STRING, description: "A unique code for the agent." },
      name: { type: Type.STRING, description: "The name of the agent." },
      description: { type: Type.STRING, description: "A brief description of the agent's purpose." },
      type: { 
        type: Type.STRING, 
        enum: Object.values(AgentType),
        description: "The category or type of the agent." 
      },
      meta: {
        type: Type.OBJECT,
        properties: {
          version: { type: Type.STRING, description: "The version of the agent (e.g., '1.0.0')." },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags for the agent." }
        },
        required: ["version", "tags"]
      },
      agent_config: {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING, description: "The Dify or A2a service address." }
        },
        required: ["address"]
      },
      capabilities: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of agent capabilities." 
      },
      config: {
        type: Type.OBJECT,
        properties: {
          timeout: { type: Type.NUMBER, description: "Runtime timeout in seconds." }
        },
        description: "Optional runtime configuration."
      },
      icon: { type: Type.STRING, description: "A Lucide icon name." }
    },
    required: ["code", "name", "description", "type", "meta", "agent_config", "capabilities"]
  }
};

const updateAgentTool: FunctionDeclaration = {
  name: "update_agent",
  description: "Update an existing AI agent's properties based on user request.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The updated name of the agent." },
      description: { type: Type.STRING, description: "The updated description." },
      meta: {
        type: Type.OBJECT,
        properties: {
          version: { type: Type.STRING, description: "The updated version." },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Updated tags." }
        }
      },
      agent_config: {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING, description: "The updated service address." }
        }
      },
      capabilities: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Updated list of capabilities." 
      },
      config: {
        type: Type.OBJECT,
        properties: {
          timeout: { type: Type.NUMBER, description: "Updated runtime timeout." }
        }
      }
    }
  }
};

export const guideSystemInstruction = `You are the Agent Forge Guide. Help users create or edit agents following this strict flow:

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

export async function startAgentCreationChat() {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: guideSystemInstruction,
      tools: [{ functionDeclarations: [fetchAddressInfoTool, createAgentTool, updateAgentTool] }],
    },
  });
}

export async function startAgentEditChat(currentAgent: Agent) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `${guideSystemInstruction}\n\nCURRENT AGENT TO EDIT:\n${JSON.stringify(currentAgent, null, 2)}`,
      tools: [{ functionDeclarations: [updateAgentTool] }],
    },
  });
  return chat;
}
