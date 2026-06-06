import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { updatePipeline } from '@/lib/n8n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone, MessageSquare, Send, Copy, Check, Clock, Star, UserCheck, AlertTriangle, Loader2,
  CreditCard, Landmark, Percent, Store, Gift,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Lead } from '@/types';

// ── PAYTM KYC + cross-sell scripts (merchant-facing) ──
const SCRIPTS: Record<'call' | 'sms' | 'whatsapp', { title: string; content: string }[]> = {
  call: [
    { title: 'KYC Intro', content: 'Namaste {merchant}! Calling from PAYTM. Our records show your merchant KYC is still pending — completing it keeps your account RBI-compliant and unlocks instant settlements. It takes just 5 minutes. Can I help you finish it right now?' },
    { title: 'Cross-sell: Credit', content: 'Hi {merchant}, PAYTM here. Based on your transaction history you are pre-approved for an instant working-capital credit line up to ₹50,000 — but we first need your KYC complete. Shall I guide you through it?' },
    { title: '30-day Deadline Nudge', content: 'Hello {merchant}, a quick reminder from PAYTM — your KYC must be completed within 30 days to avoid a hold on settlements. I can complete it with you on this call. Is this a good time?' },
  ],
  sms: [
    { title: 'KYC reminder (160)', content: '{merchant}: your PAYTM KYC is pending. Finish it in 5 min to stay RBI-compliant & get instant settlements. Reply KYC for help. -PAYTM' },
    { title: 'Credit offer (160)', content: '{merchant}: You are pre-approved for a 50,000 PAYTM credit line. Complete your KYC to unlock it. Reply YES. -PAYTM' },
  ],
  whatsapp: [
    { title: 'KYC + Benefits', content: 'Namaste {merchant}! 👋\n\nYour PAYTM merchant KYC is pending. Completing it (just 5 min) keeps you *RBI-compliant* and unlocks:\n✅ Instant settlements\n✅ Pre-approved credit line\n✅ Merchant insurance & Postpaid\n\nReply *KYC* and we will help you finish today. ⏳ 30-day deadline applies.' },
    { title: 'Cross-sell Bundle', content: 'Hi {merchant}! 🎉 Based on your sales, PAYTM has a special bundle for you: *0% processing for 3 months* + *₹50,000 instant credit*. Just complete your KYC to claim it. Reply YES.' },
  ],
};

// Cross-sell offers — the discount IS the CAC (what we'd spend acquiring this merchant elsewhere),
// passed to them as a lucrative incentive instead of burned on ads. Sized to the merchant's profile.
function crossSellFor(lead: Lead) {
  const r = lead.google_rating || 4;
  const loan = r >= 4.3 ? 50000 : r >= 4 ? 25000 : 15000;
  const rateCut = Math.round(loan * 0.04); // 4% below market = exactly the CAC, handed to the merchant
  const credit = r >= 4.3 ? '₹1,00,000' : r >= 4 ? '₹50,000' : '₹25,000';
  return [
    {
      product: 'Micro-Finance Loan', icon: Percent, cac: rateCut,
      offer: `₹${loan.toLocaleString('en-IN')} @ 7.5% — 4% below market`,
      detail: `The 4% rate cut = ₹${rateCut.toLocaleString('en-IN')}. That saving IS our CAC — given to the merchant instead of an ad spend.`,
    },
    {
      product: '0% EMI · PAYTM Marketplace', icon: Store, cac: 500, highlight: true,
      offer: 'Buy white goods → daily supplies at 0% EMI from nearby merchants',
      detail: 'Money rotates inside the PAYTM ecosystem (à la HDFC SmartBuy) — every rupee stays in-network.',
    },
    {
      product: 'Postpaid / BNPL', icon: CreditCard, cac: 300,
      offer: '0% interest for the first 90 days',
      detail: 'Interest-free window funded by the acquisition budget.',
    },
    {
      product: 'Working-Capital Credit Line', icon: Landmark, cac: 600,
      offer: `${credit} pre-approved · processing fee waived`,
      detail: 'Pre-approved from transaction history — released the moment KYC is done.',
    },
  ];
}

// Best time to reach a merchant = their business down-time (low transaction hours).
function downTime(category?: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('restaurant') || c.includes('cafe') || c.includes('food')) return '3:00–5:00 PM (post-lunch lull)';
  if (c.includes('salon') || c.includes('beauty') || c.includes('spa')) return '11:00 AM–12:30 PM (before rush)';
  if (c.includes('gym')) return '12:00–4:00 PM (between sessions)';
  return '2:00–4:00 PM (mid-afternoon, low footfall)';
}

export default function Outreach() {
  const { user, session } = useAuth();
  const { leads, refetch } = useLeads();
  const { toast } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [channel, setChannel] = useState<'call' | 'sms' | 'whatsapp'>('call');
  const [scriptIdx, setScriptIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [strikes, setStrikes] = useState<Record<string, number>>({});

  const fill = (t: string) =>
    t.replace(/{merchant}/g, lead?.business_name || 'there').replace(/{city}/g, lead?.city || '');

  const scripts = SCRIPTS[channel];
  const message = fill(scripts[Math.min(scriptIdx, scripts.length - 1)].content);
  const strikeCount = lead ? strikes[lead.id] || 0 : 0;

  function copy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // KYC outcome -> moves the merchant along the pipeline (also writes an activity log).
  async function mark(stage: string, label: string) {
    if (!lead || !user || !session) return;
    setBusy(true);
    try {
      await updatePipeline({ leadId: lead.id, newStage: stage, userId: user.id });
      refetch();
      toast({ title: `Marked: ${label}`, description: `${lead.business_name} → ${label}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  function strike() {
    if (!lead) return;
    const n = (strikes[lead.id] || 0) + 1;
    setStrikes({ ...strikes, [lead.id]: n });
    if (n >= 3) {
      toast({ title: '3 failed attempts', description: 'Time to dispatch a human field agent.', variant: 'destructive' });
    } else {
      toast({ title: `Attempt ${n} logged`, description: 'KYC not completed yet.' });
    }
  }

  function dispatchAgent() {
    if (!lead) return;
    toast({ title: '🧑‍💼 Field agent dispatched', description: `A PAYTM agent will visit ${lead.business_name} to complete KYC in person.` });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Outreach</h1>
        <p className="mt-1 text-muted-foreground">Contact merchants to complete KYC — by call, SMS, or WhatsApp.</p>
      </div>

      {/* 1. Pick a merchant */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">1. Select a merchant</p>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No merchants yet. Discover some first.</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {leads.map((l) => (
              <button
                key={l.id}
                onClick={() => { setLead(l); setScriptIdx(0); }}
                className={`flex items-center gap-2 border px-3 py-2 text-left text-xs transition-colors ${
                  lead?.id === l.id ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-foreground/20'
                }`}
              >
                <span className="truncate max-w-[150px]">{l.business_name}</span>
                {l.google_rating && (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-amber-400" /> {l.google_rating}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lead && (
        <>
          {/* Down-time recommendation */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-4 w-4 text-accent flex-shrink-0" />
              <p className="text-sm">
                <span className="text-muted-foreground">Best time to reach </span>
                <span className="font-medium">{lead.business_name}</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-accent font-medium">{downTime(lead.category)}</span>
                <span className="text-xs text-muted-foreground"> — their down-time, inferred from transaction history</span>
              </p>
            </CardContent>
          </Card>

          {/* Cross-sell offers (CAC built in as the discount) */}
          {(() => {
            const offers = crossSellFor(lead);
            const totalCac = offers.reduce((s, o) => s + o.cac, 0);
            return (
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium">KYC incentives to offer — {lead.business_name}</p>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-green-400">CAC-funded</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pitch these to get KYC done fast. Each discount <span className="text-foreground font-medium">is the CAC</span> —
                    what we&apos;d spend acquiring this merchant on ads, handed to them as a financial-product incentive instead.
                  </p>
                  <div className="space-y-2">
                    {offers.map((o) => (
                      <div key={o.product} className={`flex items-start gap-3 border p-3 ${o.highlight ? 'border-accent/50 bg-accent/5' : 'border-border/60'}`}>
                        <o.icon className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{o.product}</p>
                            {o.highlight && <span className="text-[8px] uppercase tracking-wider text-accent border border-accent/40 px-1 py-px">New</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{o.offer}</p>
                          {o.detail && <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{o.detail}</p>}
                        </div>
                        <span className="text-[11px] text-green-400 whitespace-nowrap flex-shrink-0">CAC: ₹{o.cac.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">Total acquisition budget returned to the merchant as incentives</span>
                    <span className="text-sm font-bold text-accent">₹{totalCac.toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* 2. Channel + script */}
          <Tabs value={channel} onValueChange={(v) => { setChannel(v as any); setScriptIdx(0); }} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
              {(['call', 'sms', 'whatsapp'] as const).map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm capitalize data-[state=active]:border-accent data-[state=active]:text-accent"
                >
                  {c === 'call' ? <Phone className="mr-2 h-4 w-4" /> : c === 'sms' ? <MessageSquare className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6 space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">2. Choose a script</p>
              <div className="flex flex-wrap gap-2">
                {scripts.map((s, i) => (
                  <button
                    key={s.title}
                    onClick={() => setScriptIdx(i)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      scriptIdx === i ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
                  {channel === 'sms' && (
                    <p className="mt-3 text-xs text-muted-foreground">{message.length} characters · {message.length <= 160 ? 1 : message.length <= 306 ? 2 : 3} SMS</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button onClick={copy} variant="outline" className="rounded-none border-border">
                  {copied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy message'}
                </Button>
                {channel === 'call' && lead.phone && (
                  <Button variant="outline" className="rounded-none border-border" asChild>
                    <a href={`tel:${lead.phone}`}><Phone className="mr-2 h-4 w-4" /> Call {lead.phone}</a>
                  </Button>
                )}
                {channel === 'whatsapp' && lead.phone && (
                  <Button variant="outline" className="rounded-none border-border" asChild>
                    <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="mr-2 h-4 w-4" /> Open in WhatsApp
                    </a>
                  </Button>
                )}
              </div>

              {/* 3. Log the outcome → advances the KYC pipeline */}
              <div className="pt-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mb-2">3. Log the outcome</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => mark('contacted', 'Contacted')} className="rounded-none bg-secondary text-foreground hover:bg-secondary/70">
                    {busy ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null} Answered
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => mark('interested', 'Processing')} className="rounded-none bg-green-600/80 text-white hover:bg-green-600">
                    KYC Processing
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => mark('client', 'KYC Done')} className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90">
                    <UserCheck className="mr-1.5 h-3 w-3" /> KYC Done
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={strike} className="rounded-none border-border text-muted-foreground">
                    In doubt
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={strike} className="rounded-none border-border text-muted-foreground">
                    No answer
                  </Button>
                </div>
              </div>

              {/* 3-strikes → dispatch a human field agent */}
              {strikeCount > 0 && (
                <Card className={`border ${strikeCount >= 3 ? 'border-red-500/40 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${strikeCount >= 3 ? 'text-red-400' : 'text-amber-400'}`} />
                      <p className="text-sm">
                        <span className="font-medium">{strikeCount}/3</span> failed attempts on {lead.business_name}.
                        {strikeCount >= 3 ? ' Escalate to a human field agent.' : ' Auto-escalates at 3.'}
                      </p>
                    </div>
                    {strikeCount >= 3 && (
                      <Button size="sm" onClick={dispatchAgent} className="rounded-none bg-red-600 text-white hover:bg-red-700">
                        <UserCheck className="mr-1.5 h-3 w-3" /> Dispatch Field Agent
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </Tabs>
        </>
      )}
    </div>
  );
}
