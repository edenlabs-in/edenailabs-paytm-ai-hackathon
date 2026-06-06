# n8n Setup Instructions for Seriousprenuer

## Step 1: Set Environment Variables in n8n

Go to **Settings** (gear icon) → **Variables** in your n8n instance and add.

**IMPORTANT:** n8n Cloud free tier uses **Variables** (accessed via `$vars.NAME`), NOT environment variables (`$env.NAME`). All workflow JSONs use `$vars.` syntax.

Add these variables:

| Variable Name | Value | Where to find it |
|---|---|---|
| `SUPABASE_URL` | `https://sijvpggsijwrvzfyjfrz.supabase.co` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | (your anon key) | Supabase → Settings → API Keys (Legacy) |
| `SUPABASE_SERVICE_ROLE_KEY` | (your service role key) | Supabase → Settings → API Keys (Legacy) |
| `GOOGLE_API_KEY` | (your Google Cloud API key) | Google Cloud Console → Credentials |
| `GOOGLE_CSE_ID` | (your Custom Search Engine ID) | programmablesearchengine.google.com |

## Step 2: Import Workflows

For each JSON file (WF03 through WF08):

1. Open n8n dashboard
2. Click **"+ Add Workflow"** or the **+** button
3. Click the **three dots** (⋮) menu at top → **"Import from File"**
   - OR: Create a new workflow, click ⋮ → **"Import from JSON"** and paste the contents
4. Click **Save**
5. Click **"Inactive"** toggle to make it **Active**

### Import Order:
1. WF03-website-generator.json
2. WF04-pipeline-manager.json
3. WF05-strategy-generator.json
4. WF06-sms-outreach.json
5. WF07-whatsapp-campaign.json
6. WF08-call-log-manager.json

## Step 3: Verify Webhook URLs

After activating each workflow, check the webhook URLs. They should be:

| Workflow | Webhook Path | Full URL |
|---|---|---|
| WF-01 | `/webhook/discover-leads` | `https://sach4much.app.n8n.cloud/webhook/discover-leads` |
| WF-02 | `/webhook/generate-outreach` | `https://sach4much.app.n8n.cloud/webhook/generate-outreach` |
| WF-03 | `/webhook/generate-website` | `https://sach4much.app.n8n.cloud/webhook/generate-website` |
| WF-04 | `/webhook/update-pipeline` | `https://sach4much.app.n8n.cloud/webhook/update-pipeline` |
| WF-05 | `/webhook/generate-strategy` | `https://sach4much.app.n8n.cloud/webhook/generate-strategy` |
| WF-06 | `/webhook/send-sms` | `https://sach4much.app.n8n.cloud/webhook/send-sms` |
| WF-07 | `/webhook/send-whatsapp` | `https://sach4much.app.n8n.cloud/webhook/send-whatsapp` |
| WF-08 | `/webhook/log-call` | `https://sach4much.app.n8n.cloud/webhook/log-call` |

## Step 4: Test a Workflow

Test WF-04 (Pipeline Manager) first since it's the simplest:

```bash
curl -X POST https://sach4much.app.n8n.cloud/webhook/update-pipeline \
  -H "Content-Type: application/json" \
  -d '{"lead_id": "test-123", "new_stage": "contacted", "user_id": "test-user", "notes": "test"}'
```

Expected response: `{"success": true, "new_stage": "contacted", "message": "Pipeline updated"}`

## Key Changes in Fixed JSONs (vs original)

1. **Removed** root-level fields: `trigger`, `input`, `description`, `notes`, `whatsapp_setup_guide`, `pricing_india_2026`
2. **Added** `typeVersion` to every node (required by n8n)
3. **Replaced** Supabase native nodes with HTTP Request nodes using Supabase REST API (uses `$vars.` for credentials)
4. **All Supabase calls** use `$vars.SUPABASE_SERVICE_ROLE_KEY` via HTTP headers
5. **All calls** use `$vars.` syntax (n8n Variables), NOT `$env.` (not supported on Cloud free tier)
