import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, MessageSquare, ArrowRight } from "lucide-react";
import { generateStrategy } from "@/lib/n8n";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-amber-500/20 text-amber-400",
  interested: "bg-green-500/20 text-green-400",
  negotiating: "bg-purple-500/20 text-purple-400",
  converted: "bg-accent/20 text-accent",
  lost: "bg-destructive/20 text-destructive",
};

const statusOrder = ["new", "contacted", "interested", "negotiating", "converted", "lost"];

const Pipeline = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const strategyMutation = useMutation({
    mutationFn: (leadId: string) =>
      generateStrategy({ leadId, userId: user!.id }),
    onSuccess: () => {
      toast({ title: "Strategy generated", description: "Check the lead for the new strategy." });
    },
    onError: (err: Error) => {
      toast({ title: "Strategy failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <p className="text-muted-foreground">No leads yet. Discover some first!</p>
        <Button onClick={() => navigate("/dashboard/discover")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Discover Leads <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Group leads by status
  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = leads.filter((l) => (l.status || "new") === status);
    return acc;
  }, {} as Record<string, typeof leads>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Lead Pipeline</h1>
        <span className="text-sm text-muted-foreground">{leads.length} total leads</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {statusOrder.map((status) => {
          const group = grouped[status];
          if (!group || group.length === 0) return null;
          return (
            <div key={status} className="bg-card border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[status] + " border-0 uppercase text-xs tracking-wider"}>
                  {status}
                </Badge>
                <span className="text-xs text-muted-foreground">{group.length}</span>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {group.map((lead) => (
                  <div key={lead.id} className="p-3 bg-secondary/50 border border-border space-y-2">
                    <div className="font-medium text-sm text-foreground">{lead.business_name}</div>
                    <div className="text-xs text-muted-foreground">{lead.category} · {lead.city || lead.pin_code}</div>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-accent hover:bg-accent/10"
                        onClick={() => strategyMutation.mutate(lead.id)}
                        disabled={strategyMutation.isPending}
                      >
                        <Zap className="w-3 h-3 mr-1" /> Strategy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-foreground hover:bg-secondary"
                        onClick={() => navigate(`/dashboard/outreach?leadId=${lead.id}`)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" /> Outreach
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-foreground hover:bg-secondary"
                        onClick={() => navigate(`/dashboard/websites?leadId=${lead.id}`)}
                      >
                        <Globe className="w-3 h-3 mr-1" /> Website
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
