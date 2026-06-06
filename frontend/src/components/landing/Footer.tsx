const Footer = () => {
  return (
    <footer className="py-10 border-t border-border">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-display font-bold text-sm text-foreground">
          PAYTM.
        </span>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PAYTM. Built for hustlers who mean business.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
