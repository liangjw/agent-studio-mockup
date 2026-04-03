## Agent Forge

A web UI for managing AI agents. Built with React + Vite for the frontend and Cloudflare Workers for the backend API.

## Run Locally

### Frontend (UI only)

```bash
npm install
npm run dev
```

> Note: `npm run dev` starts only the frontend dev server. The `/api/chat` endpoint will return 404 because it's served by the Cloudflare Worker backend, not Vite.

### Backend (API + Frontend)

To run the full stack including the `/api/chat` endpoint, use Wrangler:

```bash
npm install
wrangler dev --port 3003
```

This starts the Cloudflare Worker locally, which serves both the frontend assets and the `/api/chat` API.

**Required environment variables** (set in your `.env.local` file or Cloudflare Worker settings):

- `CF_ACCOUNT_ID` — Your Cloudflare account ID
- `CF_API_TOKEN` — Cloudflare API token with Workers AI permissions

## Deploy

```bash
npm run build
wrangler deploy
```

Requires `CF_ACCOUNT_ID` and `CF_API_TOKEN` to be set in Cloudflare Worker environment variables.
