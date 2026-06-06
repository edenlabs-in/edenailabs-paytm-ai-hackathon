import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50">
      <div className="container flex items-center justify-between h-20">
        <span className="font-display font-bold tracking-tight text-foreground text-3xl">
          PAYTM.
        </span>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[13px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-[13px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-[13px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Log in
          </Link>
          <Button asChild className="text-[13px] bg-accent text-accent-foreground hover:bg-accent/90 rounded-none px-6 h-10 font-display font-semibold tracking-wide">
            <Link to="/signup">Get Started</Link>
          </Button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-foreground">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-6 flex flex-col gap-4">
            {["How It Works", "Features", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors py-2"
              >
                {item}
              </a>
            ))}
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
              Log in
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
