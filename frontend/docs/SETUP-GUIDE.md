# Seriousprenuer — Setup & Configuration Guide

## Quick Start

### 1. Supabase Setup
1. Go to https://supabase.com → New Project
2. Project name: `seriousprenuer`
3. Database password: (save securely)
4. Region: `ap-south-1` (Mumbai)
5. Get credentials from Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for n8n backend use only)

### 2. Google APIs Setup
1. Go to https://console.cloud.google.com
2. Create project: `seriousprenuer`
3. Enable APIs:
   - Places API (New)
   - Custom Search JSON API
   - Generative Language API (Gemini)
4. Create API Key → restrict to these APIs only
5. Create a Custom Search Engine at https://programmablesearchengine.google.com
6. Get: `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`

### 3. n8n Configuration
1. Login to https://n8n.io (sach4much)
2. Create credentials:
   - Google API Key
   - Supabase API (URL + Service Role Key)
3. Import workflow templates from `/n8n-workflows/` folder
4. Activate webhooks

### 4. Frontend Configuration
Add to Lovable.dev environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_N8N_WEBHOOK_URL=your_n8n_webhook_base_url
```

---

## Environment Variables Reference

| Variable | Where Used | Description |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `VITE_N8N_WEBHOOK_URL` | Frontend | n8n webhook base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | n8n only | Supabase admin key (never in frontend!) |
| `GOOGLE_API_KEY` | n8n only | Google Cloud API key |
| `GOOGLE_CSE_ID` | n8n only | Custom Search Engine ID |

---

## Git Workflow

Branch strategy:
- `main` — production-ready code
- `develop` — integration branch
- `feature/xxx` — feature branches
- `fix/xxx` — bug fix branches

Commit convention:
- `feat: add lead discovery page`
- `fix: resolve outreach generation error`
- `chore: update dependencies`
- `docs: update PRD with new features`
- Iteration numbering: `v0.1.0`, `v0.2.0`, etc.
