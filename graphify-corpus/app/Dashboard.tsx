import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Phone, Brain, Kanban, TrendingUp, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();
  const { leads, loading } = useLeads();
  const navigate = useNavigate();

  const stats = {
    total: leads.length,
    newLeads: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    interested: leads.filter((l) => l.status === 'interested').length,
    clients: leads.filter((l) => l.status === 'client').length,
    delivered: leads.filter((l) => l.status === 'delivered').length,
  };

  const recentLeads = leads.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s your hustle overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Search, color: 'text-blue-400' },
          { label: 'Contacted', value: stats.contacted, icon: Phone, color: 'text-amber-400' },
          { label: 'Interested', value: stats.interested, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Clients Won', value: stats.clients + stats.delivered, icon: Star, color: 'text-accent' },
        ].map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-sm bg-secondary p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{loading ? '—' : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Discover Leads', desc: 'Search by PIN code', icon: Search, to: '/discover', accent: true },
          { label: 'AI Strategy', desc: 'Generate business plans', icon: Brain, to: '/strategy', accent: false },
          { label: 'Outreach', desc: 'Call, SMS, WhatsApp', icon: Phone, to: '/outreach', accent: false },
          { label: 'Pipeline', desc: 'Track your deals', icon: Kanban, to: '/pipeline', accent: false },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.to)}
            className={`group flex flex-col items-start gap-3 p-5 text-left transition-colors border ${
              a.accent
                ? 'border-accent/30 bg-accent/5 hover:bg-accent/10'
                : 'border-border bg-card hover:bg-secondary'
            }`}
          >
            <a.icon className={`h-5 w-5 ${a.accent ? 'text-accent' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-sm font-medium">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent leads */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent Leads</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pipeline')} className="text-xs text-accent">
            View all
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading leads…</p>
        ) : recentLeads.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No leads yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Enter a PIN code to discover businesses near you
              </p>
              <Button
                size="sm"
                className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-display"
                onClick={() => navigate('/discover')}
              >
                Discover Leads
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between border border-border bg-card p-4 hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => navigate(`/pipeline`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lead.business_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.category} · {lead.city || lead.pin_code}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {lead.google_rating && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {lead.google_rating}
                    </span>
                  )}
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      lead.status === 'new'
                        ? 'bg-blue-500/10 text-blue-400'
                        : lead.status === 'interested'
                        ? 'bg-green-500/10 text-green-400'
                        : lead.status === 'client'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
