import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useScripts } from '@/hooks/useScripts';
import { logCall, sendSms, sendWhatsApp, generateOutreach } from '@/lib/n8n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Phone,
  MessageSquare,
  Send,
  Star,
  Clock,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { Lead, Script } from '@/types';

// ──────────────────────────────────────────────────────
// Reusable lead selector
// ──────────────────────────────────────────────────────
function LeadPicker({
  leads,
  selected,
  onSelect,
}: {
  leads: Lead[];
  selected: Lead | null;
  onSelect: (l: Lead) => void;
}) {
  if (leads.length === 0)
    return <p className="text-sm text-muted-foreground">No leads. Discover leads first.</p>;
  return (
    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
      {leads.map((l) => (
        <button
          key={l.id}
          onClick={() => onSelect(l)}
          className={`flex items-center gap-2 border px-3 py-2 text-left text-xs transition-colors ${
            selected?.id === l.id ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-foreground/20'
          }`}
        >
          <span className="truncate max-w-[140px]">{l.business_name}</span>
          {l.google_rating && (
            <span className="flex items-center gap-0.5 text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400" /> {l.google_rating}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Script selector
// ──────────────────────────────────────────────────────
function ScriptList({
  scripts,
  selected,
  onSelect,
}: {
  scripts: Script[];
  selected: Script | null;
  onSelect: (s: Script) => void;
}) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {scripts.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className={`w-full text-left border p-3 transition-colors ${
            selected?.id === s.id ? 'border-accent bg-accent/5' : 'border-border hover:bg-secondary'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{s.title}</span>
            {s.type === 'sms' && (
              <span className="text-[10px] text-muted-foreground">{s.char_count} chars</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{s.content}</p>
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// CALLING TAB
// ──────────────────────────────────────────────────────
function CallingTab() {
  const { user, session } = useAuth();
  const { leads } = useLeads();
  const { scripts } = useScripts('call');
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleLogCall() {
    if (!lead || !outcome || !user || !session) return;
    setSaving(true);
    try {
      await logCall({
        leadId: lead.id,
        scriptId: script?.id,
        outcome,
        notes,
        userId: user.id,
      });
      toast({ title: 'Call logged', description: `${lead.business_name} marked as ${outcome}` });
      setOutcome('');
      setNotes('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // Inline the script content with lead data
  let scriptPreview = script?.content || '';
  if (lead) {
    scriptPreview = scriptPreview
      .replace(/{business_name}/g, lead.business_name)
      .replace(/{bo_name}/g, lead.business_name)
      .replace(/{category}/g, lead.category || 'business')
      .replace(/{city}/g, lead.city || '')
      .replace(/{user_name}/g, 'Seriousprenuer');
  }

  return (
    <div className="space-y-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">1. Select a lead to call</p>
      <LeadPicker leads={leads} selected={lead} onSelect={setLead} />

      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">2. Choose a script</p>
      <ScriptList scripts={scripts} selected={script} onSelect={setScript} />

      {/* Teleprompter */}
      {script && lead && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-display font-semibold text-accent uppercase tracking-wider">Teleprompter</p>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> Call {lead.phone}
                </a>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{scriptPreview}</p>
          </CardContent>
        </Card>
      )}

      {/* Log outcome */}
      {lead && (
        <>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">3. Log call outcome</p>
          <div className="flex flex-wrap gap-2">
            {['answered', 'interested', 'callback', 'not_interested', 'voicemail', 'no_answer'].map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={`px-3 py-1.5 text-xs border capitalize ${
                  outcome === o ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'
                }`}
              >
                {o.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-none border-border bg-secondary text-sm"
            rows={2}
          />
          <Button
            onClick={handleLogCall}
            disabled={!outcome || saving}
            className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-display"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Log Call
          </Button>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// SMS TAB
// ──────────────────────────────────────────────────────
function SmsTab() {
  const { user, session } = useAuth();
  const { leads } = useLeads();
  const { scripts } = useScripts('sms');
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const msgContent = customMsg || (script?.content || '');
  const charCount = msgContent.length;
  const smsCount = charCount <= 160 ? 1 : charCount <= 306 ? 2 : 3;

  async function handleSend() {
    if (!lead || !user || !session) return;
    setSending(true);
    try {
      await sendSms({
        leadId: lead.id,
        scriptId: script?.id,
        message: customMsg || undefined,
        userId: user.id,
      });
      toast({ title: 'SMS sent', description: `Message sent to ${lead.business_name}` });
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(msgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">1. Select a lead</p>
      <LeadPicker leads={leads} selected={lead} onSelect={setLead} />

      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">2. Choose script or write custom</p>
      <ScriptList scripts={scripts} selected={script} onSelect={(s) => { setScript(s); setCustomMsg(''); }} />

      <Textarea
        placeholder="Or write a custom SMS message…"
        value={customMsg}
        onChange={(e) => { setCustomMsg(e.target.value); setScript(null); }}
        className="rounded-none border-border bg-secondary text-sm"
        rows={3}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{charCount} characters · {smsCount} SMS segment{smsCount > 1 ? 's' : ''}</span>
        <span className={charCount > 459 ? 'text-red-400' : ''}>
          {charCount > 459 ? 'Exceeds 459 char limit' : `${459 - charCount} chars remaining`}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="rounded-none border-border"
          disabled={!msgContent}
        >
          {copied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          onClick={handleSend}
          disabled={!lead || sending || !msgContent}
          className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-display"
        >
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send SMS
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// WHATSAPP TAB
// ──────────────────────────────────────────────────────
function WhatsAppTab() {
  const { user, session } = useAuth();
  const { leads } = useLeads();
  const { scripts } = useScripts('whatsapp');
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const msgContent = customMsg || (script?.content || '');

  async function handleGenAI() {
    if (!lead || !user || !session) return;
    setAiGenerating(true);
    try {
      await generateOutreach({
        leadId: lead.id,
        channel: 'whatsapp',
        language: 'english',
        userId: user.id,
      });
      toast({ title: 'AI scripts generated', description: 'Check your outreach history' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSend() {
    if (!lead || !user || !session) return;
    setSending(true);
    try {
      await sendWhatsApp({
        leadId: lead.id,
        scriptId: script?.id,
        message: customMsg || undefined,
        includeImage: true,
        userId: user.id,
      });
      toast({ title: 'WhatsApp sent', description: `Message sent to ${lead.business_name}` });
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    let text = msgContent;
    if (lead) {
      text = text
        .replace(/{bo_name}/g, lead.business_name)
        .replace(/{business_name}/g, lead.business_name)
        .replace(/{category}/g, lead.category || 'business')
        .replace(/{city}/g, lead.city || '')
        .replace(/{google_rating}/g, String(lead.google_rating || ''));
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">1. Select a lead</p>
      <LeadPicker leads={leads} selected={lead} onSelect={setLead} />

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">2. Choose script</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenAI}
          disabled={!lead || aiGenerating}
          className="text-xs text-accent"
        >
          {aiGenerating ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" />}
          Generate AI Scripts
        </Button>
      </div>
      <ScriptList scripts={scripts} selected={script} onSelect={(s) => { setScript(s); setCustomMsg(''); }} />

      <Textarea
        placeholder="Or write a custom WhatsApp message…"
        value={customMsg}
        onChange={(e) => { setCustomMsg(e.target.value); setScript(null); }}
        className="rounded-none border-border bg-secondary text-sm"
        rows={4}
      />

      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="rounded-none border-border"
          disabled={!msgContent}
        >
          {copied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {lead?.phone && (
          <Button
            variant="outline"
            className="rounded-none border-border"
            asChild
          >
            <a
              href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msgContent)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Open in WhatsApp
            </a>
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={!lead || sending || !msgContent}
          className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-display"
        >
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send via API
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// MAIN OUTREACH PAGE
// ──────────────────────────────────────────────────────
export default function Outreach() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Outreach</h1>
        <p className="mt-1 text-muted-foreground">
          Contact business owners via calling, SMS, or WhatsApp with pre-built scripts.
        </p>
      </div>

      <Tabs defaultValue="calling" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="calling"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm data-[state=active]:border-accent data-[state=active]:text-accent"
          >
            <Phone className="mr-2 h-4 w-4" /> Calling
          </TabsTrigger>
          <TabsTrigger
            value="sms"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm data-[state=active]:border-accent data-[state=active]:text-accent"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> SMS
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm data-[state=active]:border-accent data-[state=active]:text-accent"
          >
            <Send className="mr-2 h-4 w-4" /> WhatsApp
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="calling"><CallingTab /></TabsContent>
          <TabsContent value="sms"><SmsTab /></TabsContent>
          <TabsContent value="whatsapp"><WhatsAppTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
