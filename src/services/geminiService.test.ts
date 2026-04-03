import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Import after mocking
import {
  startAgentCreationChat,
  startAgentEditChat,
} from './geminiService';
import { AgentType } from '../types';

describe('geminiService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('chatWithWorker (via startAgentCreationChat)', () => {
    it('returns text response when API succeeds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Hello! How can I help?', suggestions: ['Dify', 'LangChain'] }),
      });

      const session = startAgentCreationChat();
      const response = await session.sendMessage({ message: 'Hi' });

      expect(response.text).toBe('Hello! How can I help?');
      expect(response.suggestions).toEqual(['Dify', 'LangChain']);
      expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    it('returns function call when response is a tool call JSON', async () => {
      const toolCall = { name: 'fetch_address_info', args: { address: 'https://example.com', type: AgentType.DIFY } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ response: JSON.stringify(toolCall), suggestions: [] }),
      });

      const session = startAgentCreationChat();
      const response = await session.sendMessage({ message: 'fetch info' });

      expect(response.functionCalls).toHaveLength(1);
      expect(response.functionCalls![0].name).toBe('fetch_address_info');
      expect(response.functionCalls![0].args).toEqual({ address: 'https://example.com', type: AgentType.DIFY });
    });

    it('throws error when API returns non-OK status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const session = startAgentCreationChat();
      await expect(session.sendMessage({ message: 'hi' })).rejects.toThrow('Chat API error: 500');
    });

    it('throws error when API returns 404', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const session = startAgentCreationChat();
      await expect(session.sendMessage({ message: 'hi' })).rejects.toThrow('Chat API error: 404');
    });

    it('extracts suggestions from response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Some response', suggestions: ['新建', '编辑', '删除'] }),
      });

      const session = startAgentCreationChat();
      const response = await session.sendMessage({ message: 'hello' });

      expect(response.suggestions).toEqual(['新建', '编辑', '删除']);
    });

    it('maintains message history across multiple calls', async () => {
      let capturedBodies: any[] = [];
      mockFetch.mockImplementation((url, opts) => {
        capturedBodies.push(JSON.parse(opts.body as string));
        return Promise.resolve({
          ok: true,
          json: async () => ({ response: 'response', suggestions: [] }),
        });
      });

      const session = startAgentCreationChat();
      await session.sendMessage({ message: 'first' });
      await session.sendMessage({ message: 'second' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // First call: user message (assistant appended after API resolves)
      expect(capturedBodies[0].messages).toHaveLength(1);
      expect(capturedBodies[0].messages[0]).toEqual({ role: 'user', content: 'first' });
      // Second call: previous user + previous assistant + new user
      expect(capturedBodies[1].messages).toHaveLength(3);
      expect(capturedBodies[1].messages[0]).toEqual({ role: 'user', content: 'first' });
      expect(capturedBodies[1].messages[1]).toEqual({ role: 'assistant', content: 'response' });
      expect(capturedBodies[1].messages[2]).toEqual({ role: 'user', content: 'second' });
    });
  });

  describe('startAgentEditChat', () => {
    it('sends current agent data as system instruction', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Ready to edit', suggestions: [] }),
      });

      const agent = {
        code: 'test-001',
        name: 'Test Agent',
        description: 'A test agent',
        type: AgentType.DIFY,
        meta: { version: '1.0.0', tags: ['test'] },
        agent_config: { address: 'https://test.com' },
        capabilities: ['coding'],
        config: { timeout: 30 },
        createdAt: '2024-01-01T00:00:00Z',
        icon: 'Bot',
      };

      const session = startAgentEditChat(agent as any);
      await session.sendMessage({ message: 'change name' });

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body);
      expect(body.systemInstruction).toContain('CURRENT AGENT TO EDIT:');
      expect(body.systemInstruction).toContain('Test Agent');
      expect(body.systemInstruction).toContain('test-001');
    });
  });
});
