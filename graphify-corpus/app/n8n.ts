/**
 * n8n Webhook Integration Helper
 * All backend workflows are triggered via n8n webhooks.
 * API keys stay in n8n credentials — never in the frontend.
 */

const rawBase = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const N8N_BASE = rawBase.replace(/\/webhook\/?$/, '');

async function callN8n<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${N8N_BASE}/webhook/${path.replace(/^\/?(webhook\/)?/, '')}`;
  console.log('[n8n] POST', url, JSON.stringify(body));

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[n8n] Error', res.status, errText);
    throw new Error(`n8n error (${res.status}): ${errText}`);
  }

  const text = await res.text();
  if (!text) throw new Error('Empty response from n8n webhook');
  try { return JSON.parse(text) as T; } catch { throw new Error('Invalid JSON response from n8n webhook'); }
}

/* ── Shared auth helper ── */
import { supabase } from '@/integrations/supabase/client';

async function getJwt(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

/* ── WF01: Lead Discovery ── */
export async function discoverLeads(input: {
  pinCode: string;
  city?: string;
  businessTypes?: string[];
  userId: string;
}) {
  const jwt = await getJwt();
  return callN8n<{ success: boolean; leads_count: number; message: string }>(
    'discover-leads',
    {
      pin_code: input.pinCode,
      city: input.city,
      business_types: input.businessTypes,
      user_id: input.userId,
      supabase_jwt: jwt,
    },
    jwt
  );
}

/* ── WF02: AI Outreach Scripts ── */
export async function generateOutreach(input: {
  leadId: string;
  channel: 'whatsapp' | 'sms' | 'email';
  language?: string;
  tone?: string;
  userId: string;
}) {
  const jwt = await getJwt();
  return callN8n('generate-outreach', {
    lead_id: input.leadId,
    channel: input.channel,
    language: input.language,
    tone: input.tone,
    user_id: input.userId,
    supabase_jwt: jwt,
  }, jwt);
}

/* ── WF03: Website Generator ── */
export async function generateWebsite(input: {
  leadId: string;
  userId: string;
  templateId?: string;
}) {
  const jwt = await getJwt();
  return callN8n('generate-website', {
    lead_id: input.leadId,
    user_id: input.userId,
    template_id: input.templateId,
    supabase_jwt: jwt,
  }, jwt);
}

/* ── WF04: Pipeline Update ── */
export async function updatePipeline(input: {
  leadId: string;
  newStage: string;
  notes?: string;
  userId: string;
}) {
  const jwt = await getJwt();
  return callN8n('update-pipeline', {
    lead_id: input.leadId,
    new_stage: input.newStage,
    notes: input.notes,
    user_id: input.userId,
    supabase_jwt: jwt,
  }, jwt);
}

/* ── WF05: Strategy Generator ── */
export async function generateStrategy(input: {
  leadId: string;
  userId: string;
}) {
  const jwt = await getJwt();
  return callN8n('generate-strategy', {
    lead_id: input.leadId,
    user_id: input.userId,
    supabase_jwt: jwt,
  }, jwt);
}

/* ── WF06: SMS Outreach ── */
export async function sendSms(input: {
  leadId: string;
  userId: string;
  phone?: string;
  message?: string;
  scriptId?: string;
}) {
  const jwt = await getJwt();
  return callN8n('send-sms', {
    lead_id: input.leadId,
    user_id: input.userId,
    phone: input.phone,
    custom_message: input.message,
    script_id: input.scriptId,
    supabase_jwt: jwt,
  }, jwt);
}

/* ── WF07: WhatsApp Campaign ── */
export async function sendWhatsApp(input: {
  leadId: string;
  userId: string;
  phone?: string;
  message?: string;
  scriptId?: string;
  includeImage?: boolean;
}) {
  const jwt = await getJwt();
  return callN8n('send-whatsapp', {
    lead_id: input.leadId,
    user_id: input.userId,
    phone: input.phone,
    custom_message: input.message,
    script_id: input.scriptId,
    include_image: input.includeImage,
    supabase_jwt: jwt,
  }, jwt);
}

/* ── WF08: Call Log Manager ── */
export async function logCall(input: {
  leadId: string;
  userId: string;
  outcome: string;
  durationSeconds?: number;
  notes?: string;
  followUpDate?: string;
  scriptId?: string;
}) {
  const jwt = await getJwt();
  return callN8n('log-call', {
    lead_id: input.leadId,
    user_id: input.userId,
    outcome: input.outcome,
    duration_seconds: input.durationSeconds,
    notes: input.notes,
    follow_up_date: input.followUpDate,
    script_id: input.scriptId,
    supabase_jwt: jwt,
  }, jwt);
}
