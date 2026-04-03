export interface Env {
  ASSETS: { fetch: typeof fetch };
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
}

interface ChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  systemInstruction?: string;
  tools?: Array<{ functionDeclarations: unknown[] }>;
}

const SYSTEM_PROMPT = `You are the Agent Forge Guide. Help users create or edit agents following this strict flow:

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

async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as ChatRequest;
    const { messages, systemInstruction } = body;

    const accountId = env.CF_ACCOUNT_ID;
    const apiToken = env.CF_API_TOKEN;
    if (!accountId || !apiToken) {
      return new Response(JSON.stringify({ error: 'CF_ACCOUNT_ID or CF_API_TOKEN not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemInstruction || SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
          ],
          max_tokens: 256,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const data = await cfResponse.json() as { result?: { response?: string }; errors?: unknown[] };
    const responseText = data?.result?.response || '';

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleFetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API route
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }
    return new Response('Not Found', { status: 404 });
  }

  // Static assets or SPA fallback — delegate to the built-in assets binding
  // The ASSETS binding serves the dist/ directory from the deployment
  const assetUrl = new URL(request.url);
  // Strip the worker root path prefix if present (e.g., /agent-studio-mockup)
  let assetPath = assetUrl.pathname;
  assetPath = assetPath.replace(/^\/agent-studio-mockup/, '');

  // Try to fetch the static asset
  let assetRequest = new Request(assetUrl.origin + assetPath);
  let response = await env.ASSETS.fetch(assetRequest);

  // If asset not found, serve index.html for SPA
  if (response.status === 404) {
    assetRequest = new Request(assetUrl.origin + '/index.html');
    response = await env.ASSETS.fetch(assetRequest);
  }

  // Add cache headers for static assets
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.startsWith('application/javascript') ||
      contentType.startsWith('text/css') ||
      contentType.startsWith('image/')) {
    response = new Response(response.body, {
      ...response,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return response;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleFetch(request, env);
  },
};
