import { Search, Sparkles, LayoutTemplate, BarChart3, Shield, Rocket } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Lead Discovery",
    description: "Find businesses near you with no website, poor Google presence, or outdated pages.",
  },
  {
    icon: Sparkles,
    title: "AI Outreach Scripts",
    description: "Ogilvy‑inspired, channel‑specific copy for WhatsApp, SMS, and email — ready to send.",
  },
  {
    icon: LayoutTemplate,
    title: "Premium Templates",
    description: "Industry‑specific designs inspired by top brands. Your client gets a site that looks 10x.",
  },
  {
    icon: BarChart3,
    title: "Lead Pipeline",
    description: "Track every lead from first contact to signed client. Never lose a conversation again.",
  },
  {
    icon: Shield,
    title: "SEO Built In",
    description: "Every generated site comes with proper meta tags, headings, and structure for local search.",
  },
  {
    icon: Rocket,
    title: "One‑Click Launch",
    description: "Deploy to a live URL instantly. Share with your client and start getting them discovered.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-32 bg-secondary">
      <div className="container">
        <div className="mb-16">
          <p className="uppercase tracking-[0.3em] text-accent mb-4 font-display font-semibold text-base">
            Features
          </p>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[0.95]">
            Everything to<br />close & deliver
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-secondary p-8 md:p-10 group hover:bg-card transition-colors"
            >
              <feature.icon className="w-5 h-5 text-accent mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
