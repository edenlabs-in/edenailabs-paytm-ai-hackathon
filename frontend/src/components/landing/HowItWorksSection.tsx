import stepFindLeads from "@/assets/step-find-leads.jpg";
import stepOutreach from "@/assets/step-outreach.jpg";
import stepDeliver from "@/assets/step-deliver.jpg";
import sectionStreets from "@/assets/section-streets.jpg";

const steps = [
  {
    step: "01",
    title: "Find Local Leads",
    description: "Enter your city. We surface nearby businesses with weak or no online presence.",
    image: stepFindLeads,
  },
  {
    step: "02",
    title: "Send AI Outreach",
    description: "Generate persuasive WhatsApp, SMS, and email scripts powered by proven frameworks.",
    image: stepOutreach,
  },
  {
    step: "03",
    title: "Deliver a Premium Site",
    description: "Auto-generate a stunning website with industry‑specific design and SEO baked in.",
    image: stepDeliver,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-0">
      {/* Full-bleed image banner */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <img
          src={sectionStreets}
          alt="Bustling Indian market street"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-background/20" />
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="container pb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3 font-display font-semibold">
              How It Works
            </p>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-foreground">
              Three simple steps
            </h2>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="py-20 md:py-28">
        <div className="container">
          {steps.map((step) => (
            <div key={step.step} className="grid md:grid-cols-2 gap-10 items-center py-12 border-b border-border last:border-b-0 group">
              <div className="relative h-56 md:h-72 overflow-hidden bg-secondary">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                  width={1024}
                  height={640}
                />
              </div>
              <div>
                <span className="font-display font-bold text-accent tracking-widest text-3xl">{step.step}</span>
                <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
