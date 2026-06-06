import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Loader2 } from "lucide-react";
import { discoverLeads } from "@/lib/n8n";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const BUSINESS_TYPES = [
  "Restaurant", "Salon", "Gym", "Clinic", "Bakery",
  "Tutor", "Grocery", "Boutique", "Mechanic", "Pharmacy",
];

const Discover = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pinCode, setPinCode] = useState("");
  const [city, setCity] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSearch = async () => {
    if (!pinCode) {
      toast({ title: "Enter a pin code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await discoverLeads({
        pinCode,
        city: city || undefined,
        businessTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        userId: user!.id,
      });
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Leads discovered!", description: "Check your pipeline for new leads." });
    } catch (err: any) {
      toast({ title: "Discovery failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Discover Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">Find businesses near you that need a website</p>
      </div>

      <div className="bg-card border border-border p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Pin Code *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="e.g. 400001"
                className="pl-10 bg-secondary border-border text-foreground"
                maxLength={6}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">City (optional)</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
              className="bg-secondary border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Business Types</Label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedTypes.includes(type)
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold h-12"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</>
          ) : (
            <><Search className="w-4 h-4 mr-2" /> Discover Leads</>
          )}
        </Button>
      </div>

      {results && (
        <div className="bg-card border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-2">Results</h3>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-64">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Discover;
