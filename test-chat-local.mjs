/**
 * Local test server - mirrors the Worker /api/chat logic but calls
 * Cloudflare AI REST API directly instead of using the AI binding.
 * Run: node test-chat-local.mjs
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import express from 'express';

const app = express();
app.use(express.json());

const {
  CF_ACCOUNT_ID,
  CF_API_TOKEN,
} = process.env;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('❌  Missing env vars. Set in .env.local:');
  console.error('   CF_ACCOUNT_ID=1b9e0ecaf3e47a93cac9513c53b2ca75');
  console.error('   CF_API_TOKEN=your_cf_api_token');
  process.exit(1);
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

const SUGGESTION_SUFFIX = `

IMPORTANT: After your response text, you MUST append EXACTLY this marker and a JSON array of 1-4 short Chinese button labels (max 6 characters each) representing the user's likely next actions. Do NOT use any other marker. The array MUST be valid JSON. If no good suggestions, use an empty array.

###SUGGESTIONS
["选项1", "选项2", "选项3"]`;

app.post('/api/chat', async (req, res) => {
  const { messages, systemInstruction } = req.body;

  console.log(`\n📨 Request received. ${messages?.length ?? 0} messages`);
  console.log('Last message:', messages?.[messages.length - 1]?.content?.substring(0, 80));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const start = Date.now();
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: (systemInstruction || SYSTEM_PROMPT) + SUGGESTION_SUFFIX },
            ...(messages ?? []).map(m => ({
              role: m.role === 'model' ? 'assistant' : m.role,
              content: m.content,
            })),
          ],
          max_tokens: 256,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);
    const data = await cfResponse.json();
    const responseText = data?.result?.response ?? '';

    let suggestions = [];
    let displayText = responseText;

    const markerMatch = responseText.match(/###SUGGESTIONS\s*([\s\S]+)$/);
    if (markerMatch) {
      displayText = responseText.substring(0, markerMatch.index).trim();
      try {
        suggestions = JSON.parse(markerMatch[1].trim());
        suggestions = suggestions.slice(0, 4).map(s => s.substring(0, 6));
      } catch (e) {
        console.error('Failed to parse suggestions:', markerMatch[1]);
        suggestions = [];
      }
    }

    console.log(`✅ Response (${Date.now() - start}ms): ${displayText.substring(0, 100)}`);
    console.log(`💡 Suggestions:`, suggestions);

    res.json({ response: displayText, suggestions });
  } catch (err) {
    clearTimeout(timeout);
    console.error(`❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.listen(8787, () => {
  console.log('\n🚀 Local chat server running at http://localhost:8787');
  console.log('   POST http://localhost:8787/api/chat\n');
  console.log('Using account:', CF_ACCOUNT_ID);
  console.log('Model: @cf/meta/llama-3-8b-instruct\n');
});
