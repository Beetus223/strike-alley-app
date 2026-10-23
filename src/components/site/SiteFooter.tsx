import { useBusiness } from "@/lib/website-content";
import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import { HoursCompact } from "@/components/site/HoursTable";
import { CENTRE, FOOTER_LINKS, HOURS_NOTE, NAV } from "@/lib/site-data";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SiteFooter() {
 const CENTRE = useBusiness();
  const { user, signOut } = useAuth();
  return (
    <footer className="ink-section border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="brand-title text-2xl text-ink-foreground">{CENTRE.name}</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{CENTRE.tagline}</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span className="text-ink-muted">{CENTRE.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <a
                className="text-ink-muted hover:text-ink-foreground hover:underline"
                href={`tel:${CENTRE.phone.replace(/[^0-9]/g, "")}`}
              >
                {CENTRE.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <a
                className="break-all text-ink-muted hover:text-ink-foreground hover:underline"
                href={`mailto:${CENTRE.email}`}
              >
                {CENTRE.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg text-ink-foreground">Hours</h3>
          <HoursCompact />
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">{CENTRE.hoursNote}</p>
        </div>

        <div>
          <h3 className="font-display text-lg text-ink-foreground">Explore</h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {[...NAV, ...FOOTER_LINKS].map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="rounded-sm text-ink-muted transition-colors hover:text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {item.to === "/admin" && user ? "Staff account" : item.label}
                </Link>
              </li>
            ))}
          </ul>
          {user && <Button variant="ghost" size="sm" className="mt-3 text-ink-foreground" onClick={() => void signOut().catch(() => toast.error("Sign-out failed. Please try again."))}>Sign out</Button>}
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-ink-muted sm:px-6">
        © {new Date().getFullYear()} {CENTRE.name}. Proudly 5-pin, proudly Vegreville.
      </div>
    </footer>
  );
}
