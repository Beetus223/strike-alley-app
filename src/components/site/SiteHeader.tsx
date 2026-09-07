import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Phone } from "lucide-react";
import { NAV, CENTRE } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl">
            5
          </span>
          <span className="leading-none">
            <span className="block font-display text-xl tracking-wide neon-text sm:text-2xl">
              Vegreville Bowling
            </span>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Lanes · Since 1962
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <a
            href={`tel:${CENTRE.phone.replace(/[^0-9]/g, "")}`}
            className="hidden items-center gap-2 text-sm text-muted-foreground hover:text-foreground xl:flex"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {CENTRE.phone}
          </a>
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            {user ? "My bowling" : "Sign in"}
          </Link>
          <Button asChild size="sm" className="font-display text-base tracking-wide">
            <Link to="/book">Book a lane</Link>
          </Button>
          <button
            type="button"
            className="rounded-md p-2 text-foreground lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-border/70 lg:hidden", open ? "block" : "hidden")}>
        <nav aria-label="Mobile" className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:px-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={user ? "/dashboard" : "/auth"}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {user ? "My bowling" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
