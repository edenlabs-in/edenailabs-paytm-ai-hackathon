import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadsByStatus } from '@/hooks/useLeads';
import { updatePipeline } from '@/lib/n8n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Star,
  Phone,
  MapPin,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  X,
} from 'lucide-react';
import type { Lead, LeadStatus } from '@/types';

const COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500' },
  { key: 'interested', label: 'Interested', color: 'bg-green-500' },
  { key: 'client', label: 'Client', color: 'bg-accent' },
  { key: 'delivered', label: 'Delivered', color: 'bg-purple-500' },
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
        <h1 className="font-display text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-muted-foreground">Track leads from discovery to delivery.</p>
      </div>

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

      {/* Lead detail modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-md border-border bg-background mx-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedLead.business_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedLead.category} · {selectedLead.city}
                  </p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <a href={`tel:${selectedLead.phone}`} className="text-accent hover:underline">
                      {selectedLead.phone}
                    </a>
                  </div>
                )}
                {selectedLead.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedLead.address}</span>
                  </div>
                )}
                {selectedLead.google_maps_url && (
                  <a
                    href={selectedLead.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open in Google Maps
                  </a>
                )}
              </div>

              {/* Move to stage */}
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mb-2">
                  Move to stage
                </p>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.filter((c) => c.key !== selectedLead.status).map((col) => (
                    <Button
                      key={col.key}
                      size="sm"
                      variant="outline"
                      disabled={moving}
                      onClick={() => moveLead(selectedLead, col.key)}
                      className="rounded-none border-border text-xs"
                    >
                      <ArrowRight className="mr-1.5 h-3 w-3" />
                      {col.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
