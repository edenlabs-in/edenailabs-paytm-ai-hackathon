import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ctaImage from "@/assets/cta-handshake.jpg";

const CTASection = () => {
  return (
    <section id="pricing" className="relative py-0">
      {/* Full-bleed background */}
      <div className="relative w-full min-h-[80vh] flex items-center">
        <img
          src={ctaImage}
          alt="Indian solopreneur closing a deal with a local shop owner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-background/40" />

        {/* Content */}
        <div className="relative z-10 container py-20">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6 font-display font-semibold">
              Free to start — no card required
            </p>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95] mb-6">
              Your first client is closer than you think
            </h2>
            
            <p className="text-base text-muted-foreground mb-10 leading-relaxed">
              Sign up, find businesses in your area, and land your first website project this week. Seriously.
            </p>

            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none px-8 h-12 text-sm font-display font-semibold tracking-wide">
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <div className="mt-14 pt-8 border-t border-border/50 grid grid-cols-3 gap-6">
              {[
                { value: "1 client", label: "Free tier" },
                { value: "AI scripts", label: "Ready to send" },
                { value: "Premium", label: "Auto‑generated" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-display font-bold text-accent">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
