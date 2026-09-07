import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import { CENTRE, HOURS, NAV } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-2xl neon-text">{CENTRE.name}</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{CENTRE.tagline}</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span>{CENTRE.address}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <a className="hover:underline" href={`tel:${CENTRE.phone.replace(/[^0-9]/g, "")}`}>
                {CENTRE.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <a className="hover:underline" href={`mailto:${CENTRE.email}`}>
                {CENTRE.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xl">Hours</h3>
          <dl className="mt-4 space-y-1.5 text-sm">
            {HOURS.map((h) => (
              <div key={h.day} className="flex justify-between gap-4 border-b border-border/60 pb-1.5">
                <dt className="text-muted-foreground">{h.day}</dt>
                <dd>{h.open}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="font-display text-xl">Explore</h3>
          <ul className="mt-4 grid grid-cols-2 gap-1.5 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/book" className="text-muted-foreground hover:text-foreground">
                Book a lane
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} {CENTRE.name}. Proudly 5-pin, proudly Vegreville.
      </div>
    </footer>
  );
}
