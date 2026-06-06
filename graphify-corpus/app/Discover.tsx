import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { discoverLeads } from '@/lib/n8n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  MapPin,
  Phone,
  Star,
  ExternalLink,
  Loader2,
  Building2,
  Filter,
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'beauty_salon', label: 'Salons' },
  { value: 'hardware_store', label: 'Hardware' },
  { value: 'doctor', label: 'Clinics' },
  { value: 'gym', label: 'Gyms' },
  { value: 'store', label: 'Retail Stores' },
  { value: 'cafe', label: 'Cafés' },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'school', label: 'Schools' },
  { value: '', label: 'All Types' },
];

export default function Discover() {
  const { user, session } = useAuth();
  const { refetch } = useLeads();
  const { toast } = useToast();

  const [pinCode, setPinCode] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [radius, setRadius] = useState(5);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ count: number; message: string } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinCode)) {
      toast({ title: 'Invalid PIN code', description: 'Enter a valid 6-digit Indian PIN code', variant: 'destructive' });
      return;
    }
    if (!user || !session) return;

    setSearching(true);
    setResults(null);
    try {
      const res = await discoverLeads({
        pinCode,
        city: undefined,
        businessTypes: businessType ? [businessType] : undefined,
        userId: user.id,
      });
      setResults({ count: res.leads_count, message: res.message });
      refetch();
      toast({ title: `Found ${res.leads_count} leads`, description: 'Added to your pipeline' });
    } catch (err: any) {
      toast({ title: 'Discovery failed', description: err.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Discover Leads</h1>
        <p className="mt-1 text-muted-foreground">
          Enter a PIN code to find local businesses without a website.
        </p>
      </div>

      {/* Search form */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* PIN code input */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit PIN code (e.g. 400053)"
                  className="h-12 rounded-none border-border bg-secondary pl-10 font-display text-lg tracking-wider"
                  maxLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={searching || pinCode.length !== 6}
                className="h-12 rounded-none bg-accent text-accent-foreground hover:bg-accent/90 px-8 font-display font-semibold"
              >
                {searching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBusinessType(bt.value)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      businessType === bt.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                    }`}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius slider */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Radius: {radius} km</span>
              <input
                type="range"
                min={1}
                max={25}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="flex-1 accent-[hsl(38,90%,55%)]"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results feedback */}
      {results && (
        <Card className={`border ${results.count > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`rounded-full p-2 ${results.count > 0 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {results.count > 0
                  ? `Found ${results.count} businesses without a website`
                  : 'No new businesses found in this area'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {results.count > 0
                  ? 'Leads have been added to your pipeline. Go to Outreach to start contacting them.'
                  : 'Try a different PIN code or expand the search radius.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips section */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Tier 1 Cities',
            desc: 'Mumbai (400001-400104), Delhi (110001-110096), Bangalore (560001-560100)',
            icon: MapPin,
          },
          {
            title: 'High-Potential Types',
            desc: 'Restaurants, salons, and clinics have the highest conversion rate for website deals.',
            icon: Star,
          },
          {
            title: 'Search Strategy',
            desc: 'Start with a 3-5 km radius. Expand to 10-15 km for suburban areas.',
            icon: Search,
          },
        ].map((tip) => (
          <div key={tip.title} className="border border-border p-4 bg-card">
            <tip.icon className="h-4 w-4 text-accent mb-2" />
            <p className="text-sm font-medium">{tip.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
