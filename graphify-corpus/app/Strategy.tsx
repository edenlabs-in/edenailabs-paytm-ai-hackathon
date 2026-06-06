import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { generateStrategy } from '@/lib/n8n';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Loader2,
  Target,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Star,
} from 'lucide-react';
import type { Lead, Strategy as StrategyType } from '@/types';

export default function Strategy() {
  const { user, session } = useAuth();
  const { leads } = useLeads();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [generating, setGenerating] = useState(false);
  const [strategies, setStrategies] = useState<StrategyType[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch existing strategies
  useEffect(() => {
    if (!user) return;
    supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setStrategies(data ?? []));
  }, [user]);

  async function handleGenerate() {
    if (!selectedLead || !user || !session) return;
    setGenerating(true);
    try {
      // Try n8n first
      let n8nWorked = false;
      try {
        const res = await generateStrategy({
          leadId: selectedLead.id,
          userId: user.id,
        });
        // If n8n returned actual data with responseNode, it saved to Supabase already
        if (res && typeof res === 'object') {
          n8nWorked = true;
          toast({ title: 'Strategy generated', description: `AI strategy ready for ${selectedLead.business_name}` });
        }
      } catch (n8nErr: any) {
        console.warn('[Strategy] n8n failed, using fallback:', n8nErr.message);
      }

      // Fallback: insert directly into Supabase
      if (!n8nWorked) {
        const fallbackStrategy = {
          executive_summary: `Strategy for ${selectedLead.business_name}: A ${selectedLead.category || 'local'} business${selectedLead.google_rating ? ` rated ${selectedLead.google_rating}★` : ''} in ${selectedLead.city || 'the area'}. Recommend website + Google Maps optimization.`,
          pitch_angle: 'Digital visibility for local customers',
          difficulty_score: 3,
          service_package: { recommended_services: ['website', 'google_maps'], starter_price: '₹4,999', timeline: '5 days' },
          outreach_plan: { best_channel: 'whatsapp', best_time: '2-4 PM weekdays', opening_line: `Hi, I noticed ${selectedLead.business_name} doesn't have a website yet...` },
          status: 'draft',
        };

        const { error } = await supabase.from('strategies').insert({
          lead_id: selectedLead.id,
          user_id: user.id,
          content_json: fallbackStrategy,
          executive_summary: fallbackStrategy.executive_summary,
          pitch_angle: fallbackStrategy.pitch_angle,
          difficulty_score: fallbackStrategy.difficulty_score,
          recommended_services: fallbackStrategy.service_package.recommended_services,
          pricing_suggestion: fallbackStrategy.service_package.starter_price,
          status: 'draft',
        });

        if (error) throw error;
        toast({ title: 'Strategy generated', description: `Fallback strategy created for ${selectedLead.business_name}` });
      }

      // Refetch strategies
      const { data } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setStrategies(data);
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  const leadsWithoutStrategy = leads.filter(
    (l) => !strategies.some((s) => s.lead_id === l.id)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">AI Strategy Generator</h1>
        <p className="mt-1 text-muted-foreground">
          Generate customized business approach plans for each lead using AI.
        </p>
      </div>

      {/* Lead selector + generate button */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">Select a lead</p>
          {leadsWithoutStrategy.length === 0 && leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads found. Discover leads first using the PIN code search.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(leadsWithoutStrategy.length > 0 ? leadsWithoutStrategy : leads).slice(0, 9).map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`flex items-center gap-3 border p-3 text-left transition-colors ${
                    selectedLead?.id === lead.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lead.business_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{lead.category} · {lead.city}</p>
                  </div>
                  {lead.google_rating && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" /> {lead.google_rating}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={!selectedLead || generating}
            className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold px-6"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            {generating ? 'Generating strategy…' : 'Generate AI Strategy'}
          </Button>
        </CardContent>
      </Card>

      {/* Strategies list */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold">Generated Strategies</h2>
        {strategies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No strategies yet. Select a lead above and generate one.</p>
        ) : (
          strategies.map((s) => {
            const data = s.content_json as Record<string, any>;
            const expanded = expandedId === s.id;
            const lead = leads.find((l) => l.id === s.lead_id);
            return (
              <Card key={s.id} className="border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setExpandedId(expanded ? null : s.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{lead?.business_name || 'Unknown Business'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {s.executive_summary || data.executive_summary || ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {s.difficulty_score && (
                      <span className="text-xs text-muted-foreground">
                        Difficulty: {s.difficulty_score}/5
                      </span>
                    )}
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-border p-5 space-y-4">
                    {/* Pitch Angle */}
                    {(s.pitch_angle || data.pitch_angle) && (
                      <div className="flex gap-3">
                        <Target className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-accent">Pitch Angle</p>
                          <p className="text-sm text-muted-foreground mt-1">{s.pitch_angle || data.pitch_angle}</p>
                        </div>
                      </div>
                    )}
                    {/* Pricing */}
                    {(s.pricing_suggestion || data.service_package) && (
                      <div className="flex gap-3">
                        <DollarSign className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-green-400">Pricing</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {s.pricing_suggestion || data.service_package?.starter_price}
                            {data.service_package?.growth_price && ` — ${data.service_package.growth_price}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Outreach Plan */}
                    {data.outreach_plan && (
                      <div className="flex gap-3">
                        <Clock className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Best Approach</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {data.outreach_plan.best_channel} at {data.outreach_plan.best_time}
                          </p>
                          {data.outreach_plan.opening_line && (
                            <p className="text-xs italic text-muted-foreground mt-1">
                              &ldquo;{data.outreach_plan.opening_line}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Objections */}
                    {data.objections_and_handlers && (
                      <div className="flex gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Objection Handling</p>
                          <div className="mt-1 space-y-2">
                            {data.objections_and_handlers.map((o: any, i: number) => (
                              <div key={i} className="text-sm">
                                <p className="text-muted-foreground">&ldquo;{o.objection}&rdquo;</p>
                                <p className="text-foreground/80 ml-3 mt-0.5">→ {o.response}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Next Action */}
                    {data.next_best_action && (
                      <div className="flex gap-3 bg-accent/5 border border-accent/20 p-3">
                        <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-accent">Next Best Action</p>
                          <p className="text-sm mt-1">{data.next_best_action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
