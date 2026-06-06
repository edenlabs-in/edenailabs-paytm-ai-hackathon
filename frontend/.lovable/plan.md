

# Fix AI Strategy Generation Bug

## Problem
1. `callN8n` in `n8n.ts` silently returns `{success: true}` on empty responses, masking real errors
2. Strategy.tsx relies entirely on n8n succeeding, with no fallback when it fails (CORS, API errors)

## Changes

### 1. Fix `src/lib/n8n.ts` — lines 33-35
Replace the silent empty-body fallback with proper error handling:
- If response text is empty → throw `Error('Empty response from n8n webhook')`
- If JSON.parse fails → throw `Error('Invalid JSON response from n8n webhook')`
- Only return parsed data on success

### 2. Fix `src/pages/Strategy.tsx` — `handleGenerate` (lines 43-89)
Replace the current polling approach with a try/catch + direct Supabase fallback:

- Wrap `generateStrategy()` in try/catch
- If n8n returns actual strategy data, use it directly
- If n8n fails (throws error from CORS, empty response, etc.), generate a **fallback strategy** using lead data and insert it directly into Supabase via the client
- After either path, immediately refetch strategies from Supabase and update state
- Remove the polling loop entirely — either n8n returns data (responseNode mode) or the fallback saves directly
- The fallback strategy includes: executive_summary, pitch_angle, difficulty_score, service_package, outreach_plan based on the selected lead's properties

### Technical Detail
- The fallback inserts into `strategies` table with columns: `lead_id`, `user_id`, `content_json`, `executive_summary`, `pitch_angle`, `difficulty_score`, `recommended_services`, `pricing_suggestion`, `status`
- RLS policy `own_data` on strategies allows insert when `auth.uid() = user_id` — this will work since we set `user_id` to the authenticated user's ID
- `content_json` column is `jsonb NOT NULL DEFAULT '{}'` — we'll pass the full fallback object

