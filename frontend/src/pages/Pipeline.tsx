import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadsByStatus } from '@/hooks/useLeads';
import { updatePipeline } from '@/lib/n8n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, MapPin } from 'lucide-react';
import { MerchantModal } from '@/components/MerchantModal';
import type { Lead, LeadStatus } from '@/types';

// Display labels map the existing DB status values to PAYTM's KYC journey (no DB change needed).
const COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500' },
  { key: 'interested', label: 'Processing', color: 'bg-green-500' },
  { key: 'client', label: 'KYC Done', color: 'bg-accent' },
  { key: 'delivered', label: 'RBI Compliant', color: 'bg-purple-500' },
];

export default function Pipeline() {
  const { user, session } = useAuth();
  const { grouped, loading, refetch } = useLeadsByStatus();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [moving, setMoving] = useState(false);

  async function moveLead(lead: Lead, newStage: LeadStatus) {
    if (!user || !session) return;
    setMoving(true);
    try {
      await updatePipeline({
        leadId: lead.id,
        newStage,
        userId: user.id,
      });
      refetch();
      toast({ title: 'Lead moved', description: `${lead.business_name} → ${newStage}` });
      setSelectedLead(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Merchant KYC Pipeline</h1>
        <p className="mt-1 text-muted-foreground">Track merchants from discovery to RBI-compliant KYC.</p>
      </div>

      {/* KYC summary */}
      {!loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(() => {
            const pending = (grouped.new?.length || 0) + (grouped.contacted?.length || 0) + (grouped.interested?.length || 0);
            const done = grouped.client?.length || 0;
            const compliant = grouped.delivered?.length || 0;
            return [
              { label: 'Pending KYC', value: pending, cls: 'text-amber-400' },
              { label: 'KYC Done', value: done, cls: 'text-accent' },
              { label: 'RBI Compliant', value: compliant, cls: 'text-purple-400' },
            ].map((s) => (
              <Card key={s.label} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-display">{s.label}</span>
                  <span className={`text-2xl font-display font-bold ${s.cls}`}>{s.value}</span>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = grouped[col.key] || [];
            return (
              <div key={col.key} className="min-w-[260px] flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.length === 0 && (
                    <div className="border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                      No leads
                    </div>
                  )}
                  {items.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="w-full text-left border border-border bg-card p-3 hover:bg-secondary transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{lead.business_name}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        {lead.category && <span>{lead.category}</span>}
                        {lead.google_rating && (
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <Star className="h-2.5 w-2.5 fill-amber-400" /> {lead.google_rating}
                          </span>
                        )}
                      </div>
                      {lead.city && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" /> {lead.city}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Merchant detail modal (shared) */}
      {selectedLead && (
        <MerchantModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onMove={(stage) => moveLead(selectedLead, stage)}
          moving={moving}
        />
      )}
    </div>
  );
}
