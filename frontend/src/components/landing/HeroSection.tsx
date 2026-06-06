import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-entrepreneur.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-end">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Indian entrepreneur working at a modern desk"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-background/30" />
      </div>

      {/* Content at the bottom */}
      <div className="relative z-10 container pb-28 pt-32">
        {/* Small label */}
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6 font-display font-semibold">
          Your Smart-Hustle Platform
        </p>

        {/* Large headline — Ratko style */}
        <h1 className="text-5xl md:text-7xl lg:text-[100px] font-bold tracking-tight leading-[0.9] mb-8 max-w-4xl">
          Find businesses.
          <br />
          <span className="text-accent">Get them online.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed mb-10">
          Discover nearby Indian businesses with minimal to no online presence, 
          send AI‑crafted outreach, deliver premium Websites and Social Media 
          presence — Facebook, Instagram, X, LinkedIn &amp; Google Search.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none px-8 h-12 text-sm font-display font-semibold tracking-wide">
            <Link to="/signup">
              Start Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary rounded-none px-8 h-12 text-sm">
            <a href="#how-it-works">Learn More</a>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/50 bg-background/60 backdrop-blur-md">
        <div className="container py-5 grid grid-cols-3 max-w-2xl gap-8">
          {[
            { value: "500+", label: "Leads Found" },
            { value: "3 min", label: "To First Outreach" },
            { value: "₹0", label: "To Start" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl md:text-2xl font-display font-bold text-accent">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
