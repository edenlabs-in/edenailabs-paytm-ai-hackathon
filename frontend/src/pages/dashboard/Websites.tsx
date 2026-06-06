import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, Loader2 } from "lucide-react";
import { generateWebsite } from "@/lib/n8n";
import { useToast } from "@/hooks/use-toast";

const Websites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedLead = searchParams.get("leadId") || "";
  const [selectedLead, setSelectedLead] = useState(preselectedLead);
  const [templateId, setTemplateId] = useState("default");
  const [loading, setLoading] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, business_name, category, city").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("id, name, category");
      if (error) throw error;
      return data;
    },
  });

  const { data: websites = [] } = useQuery({
    queryKey: ["websites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("websites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleGenerate = async () => {
    if (!selectedLead) return;
    setLoading(true);
    try {
      await generateWebsite({ leadId: selectedLead, userId: user!.id, templateId });
      toast({ title: "Website generation started!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-display font-bold text-foreground">Website Generator</h1>

      <div className="bg-card border border-border p-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Select Lead</Label>
          <select
            value={selectedLead}
            onChange={(e) => setSelectedLead(e.target.value)}
            className="w-full h-10 px-3 bg-secondary border border-border text-foreground text-sm"
          >
            <option value="">Choose a lead...</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.business_name} – {l.city}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Template</Label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full h-10 px-3 bg-secondary border border-border text-foreground text-sm"
          >
            <option value="default">Default Template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
            ))}
          </select>
        </div>

        <Button onClick={handleGenerate} disabled={loading || !selectedLead} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold h-12">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
          Generate Website
        </Button>
      </div>

      {websites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground">Generated Websites</h2>
          {websites.map((w) => (
            <div key={w.id} className="bg-card border border-border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-foreground">{w.business_name}</div>
                <div className="text-xs text-muted-foreground">{w.status} · {new Date(w.created_at!).toLocaleDateString()}</div>
              </div>
              {w.deployed_url && (
                <a href={w.deployed_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                  View Site →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Websites;
