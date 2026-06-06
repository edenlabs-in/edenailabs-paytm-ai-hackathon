import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent", description: "Check your inbox for the reset link." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-card border-border text-foreground" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-accent hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
