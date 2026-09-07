import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import { CENTRE, HOURS, NAV } from "@/lib/site-data";

export function SiteFooter() {
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
          <dl className="mt-4 space-y-2 text-sm">
            {HOURS.map((h) => (
              <div key={h.day} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <dt className="text-ink-muted">{h.day}</dt>
                <dd className="text-ink-foreground">{h.open}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="font-display text-lg text-ink-foreground">Explore</h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-ink-muted hover:text-ink-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/book" className="text-ink-muted hover:text-ink-foreground">
                Book a lane
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-ink-muted sm:px-6">
        © {new Date().getFullYear()} {CENTRE.name}. Proudly 5-pin, proudly Vegreville.
      </div>
    </footer>
  );
}
