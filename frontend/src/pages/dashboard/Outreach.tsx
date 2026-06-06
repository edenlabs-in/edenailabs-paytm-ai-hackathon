import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Phone, Send, Loader2 } from "lucide-react";
import { sendSms, sendWhatsApp, logCall } from "@/lib/n8n";
import { useToast } from "@/hooks/use-toast";

const Outreach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedLead = searchParams.get("leadId") || "";
  const [selectedLead, setSelectedLead] = useState(preselectedLead);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, business_name, phone").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectedLeadData = leads.find((l) => l.id === selectedLead);

  const handleSms = async () => {
    if (!selectedLead || !phone || !message) return;
    setLoading(true);
    try {
      await sendSms({ leadId: selectedLead, userId: user!.id, phone, message });
      toast({ title: "SMS sent!" });
      setMessage("");
    } catch (err: any) {
      toast({ title: "SMS failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsapp = async () => {
    if (!selectedLead || !phone || !message) return;
    setLoading(true);
    try {
      await sendWhatsApp({ leadId: selectedLead, userId: user!.id, phone, message });
      toast({ title: "WhatsApp sent!" });
      setMessage("");
    } catch (err: any) {
      toast({ title: "WhatsApp failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCallLog = async () => {
    if (!selectedLead || !callOutcome) return;
    setLoading(true);
    try {
      await logCall({ leadId: selectedLead, userId: user!.id, outcome: callOutcome, notes: callNotes || undefined });
      toast({ title: "Call logged!" });
      setCallOutcome("");
      setCallNotes("");
    } catch (err: any) {
      toast({ title: "Log failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold text-foreground">Outreach</h1>

      {/* Lead selector */}
      <div className="space-y-2">
        <Label className="text-foreground">Select Lead</Label>
        <select
          value={selectedLead}
          onChange={(e) => {
            setSelectedLead(e.target.value);
            const lead = leads.find((l) => l.id === e.target.value);
            if (lead?.phone) setPhone(lead.phone);
          }}
          className="w-full h-10 px-3 bg-card border border-border text-foreground text-sm"
        >
          <option value="">Choose a lead...</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.business_name}</option>
          ))}
        </select>
      </div>

      {selectedLead && (
        <Tabs defaultValue="whatsapp" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
              <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
              <Send className="w-3 h-3 mr-1" /> SMS
            </TabsTrigger>
            <TabsTrigger value="call" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
              <Phone className="w-3 h-3 mr-1" /> Call Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="bg-card border border-border p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Hi, I noticed your business..." className="bg-secondary border-border text-foreground" />
            </div>
            <Button onClick={handleWhatsapp} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Send WhatsApp
            </Button>
          </TabsContent>

          <TabsContent value="sms" className="bg-card border border-border p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Hi, I noticed your business..." className="bg-secondary border-border text-foreground" />
            </div>
            <Button onClick={handleSms} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send SMS
            </Button>
          </TabsContent>

          <TabsContent value="call" className="bg-card border border-border p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Outcome</Label>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                className="w-full h-10 px-3 bg-secondary border border-border text-foreground text-sm"
              >
                <option value="">Select outcome...</option>
                <option value="interested">Interested</option>
                <option value="callback">Wants Callback</option>
                <option value="not_interested">Not Interested</option>
                <option value="no_answer">No Answer</option>
                <option value="wrong_number">Wrong Number</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Notes</Label>
              <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3} placeholder="Call notes..." className="bg-secondary border-border text-foreground" />
            </div>
            <Button onClick={handleCallLog} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
              Log Call
            </Button>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Outreach;
