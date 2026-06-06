import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, ExternalLink, X, Star, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Lead, LeadStatus } from '@/types';

const STAGES: { key: LeadStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Processing' },
  { key: 'client', label: 'KYC Done' },
  { key: 'delivered', label: 'RBI Compliant' },
];

export function MerchantModal({
  lead, onClose, onMove, moving = false,
}: {
  lead: Lead;
  onClose: () => void;
  onMove?: (stage: LeadStatus) => void;
  moving?: boolean;
}) {
  const navigate = useNavigate();
  const currentIdx = STAGES.findIndex((s) => s.key === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg border-border bg-background" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold leading-tight">{lead.business_name}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{lead.category || 'merchant'}</span>
                {lead.city && <span>· {lead.city}</span>}
                {lead.google_rating && (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" /> {lead.google_rating}
                  </span>
                )}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* KYC journey */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display mb-2">KYC journey</p>
            <div className="flex items-center">
              {STAGES.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${i <= currentIdx ? 'bg-accent' : 'bg-border'}`} />
                    <span className={`mt-1 text-[9px] whitespace-nowrap ${i === currentIdx ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`h-px flex-1 mx-1 ${i < currentIdx ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-2 text-sm border-t border-border pt-4">
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${lead.phone}`} className="text-accent hover:underline">{lead.phone}</a>
              </div>
            )}
            {lead.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{lead.address}</span>
              </div>
            )}
            {lead.google_maps_url && (
              <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-xs text-accent hover:underline">
                <ExternalLink className="h-3 w-3" /> Open in Google Maps
              </a>
            )}
            {lead.notes && <p className="text-xs text-muted-foreground pt-1">{lead.notes}</p>}
          </div>

          {/* Move to stage */}
          {onMove && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display mb-2">Move to stage</p>
              <div className="flex flex-wrap gap-2">
                {STAGES.filter((s) => s.key !== lead.status).map((s) => (
                  <Button key={s.key} size="sm" variant="outline" disabled={moving}
                          onClick={() => onMove(s.key)} className="rounded-none border-border text-xs">
                    <ArrowRight className="mr-1.5 h-3 w-3" /> {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quick action */}
          <div className="flex gap-2 border-t border-border pt-4">
            <Button size="sm" onClick={() => navigate('/outreach')}
                    className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Contact for KYC
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/pipeline')}
                    className="rounded-none border-border">
              View in Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
