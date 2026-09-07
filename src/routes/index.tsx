import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Sparkles, Trophy, Users } from "lucide-react";
import heroLanes from "@/assets/hero-lanes.jpg";
import fivePins from "@/assets/five-pins.jpg";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site/PageHeader";
import { CENTRE, EVENTS, HOURS, LEAGUES, PRICING } from "@/lib/site-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vegreville Bowling Lanes | 5-Pin Bowling in Vegreville, AB" },
      {
        name: "description",
        content:
          "Eight lanes of 5-pin bowling in Vegreville, Alberta. Glow bowling, leagues, birthday parties, snack bar and lane bookings.",
      },
      { property: "og:title", content: "Vegreville Bowling Lanes | 5-Pin Bowling" },
      {
        property: "og:description",
        content: "Glow bowling, leagues, parties and eight 5-pin lanes in downtown Vegreville.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroLanes}
          alt="Neon-lit lanes at Vegreville Bowling Lanes with families bowling"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">
            Vegreville, Alberta · Eight lanes
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[0.95] neon-text sm:text-7xl lg:text-8xl">
            Five pins. Full house. Every weekend.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {CENTRE.tagline} Book a lane for the family, join a league, or take over the whole house
            for your party.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-display text-lg tracking-wide">
              <Link to="/book">Request a lane</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-display text-lg tracking-wide">
              <Link to="/leagues">Join a league</Link>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { icon: Clock, label: "Open today", value: "4 PM – 10 PM" },
              { icon: Sparkles, label: "Glow bowl", value: "Fri & Sat, 8 PM" },
              { icon: Users, label: "Lane capacity", value: "6 bowlers" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="neon-panel rounded-xl p-4">
                <Icon className="h-5 w-5 text-accent" aria-hidden />
                <dt className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {label}
                </dt>
                <dd className="font-display text-xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section title="What's on this week" description="Something different on the lanes most nights.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.map((e) => (
            <article key={e.title} className="neon-panel flex flex-col rounded-xl p-5">
              <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest text-accent">
                {e.tag}
              </span>
              <h3 className="mt-3 text-2xl">{e.title}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-accent">
                <CalendarDays className="h-4 w-4" aria-hidden />
                {e.when}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{e.blurb}</p>
            </article>
          ))}
        </div>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link to="/events">See the full calendar</Link>
          </Button>
        </div>
      </Section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <img
            src={fivePins}
            alt="Five Canadian 5-pin bowling pins with red bands standing on a lane"
            width={1200}
            height={900}
            loading="lazy"
            className="w-full rounded-2xl object-cover"
          />
          <div>
            <h2 className="text-4xl">New to 5-pin?</h2>
            <p className="mt-3 text-muted-foreground">
              Canadian 5-pin uses a small handheld ball with no finger holes, five pins, and three
              balls per frame. Pins are worth 2-3-5-3-2 from the outside in, so a full deck is 15
              points and a perfect game is 450.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>· Strike = 15 pins, plus your next two balls</li>
              <li>· Spare = 15 pins, plus your next ball</li>
              <li>· Headpin needed — the corner pin counts as a foul-free miss</li>
              <li>· 10 frames, three balls each, lighter balls for every age</li>
            </ul>
            <Button asChild className="mt-6">
              <Link to="/bowling">Prices & lane info</Link>
            </Button>
          </div>
        </div>
      </section>

      <Section title="Walk-in pricing" description="Taxes included. Cash, debit and tap accepted.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING.map((p) => (
            <div key={p.label} className="rounded-xl border border-border p-5">
              <p className="font-display text-3xl text-accent">{p.price}</p>
              <p className="mt-1 font-medium">{p.label}</p>
              <p className="text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-3 text-4xl">
              <Trophy className="h-8 w-8 text-primary" aria-hidden /> League nights
            </h2>
            <ul className="mt-6 space-y-4">
              {LEAGUES.map((l) => (
                <li key={l.slug} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-2xl">{l.name}</h3>
                    <span className="text-sm text-accent">
                      {l.night} · {l.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.format}</p>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6">
              <Link to="/leagues">League details & standings</Link>
            </Button>
          </div>
          <div>
            <h2 className="flex items-center gap-3 text-4xl">
              <MapPin className="h-8 w-8 text-accent" aria-hidden /> Find us
            </h2>
            <p className="mt-3 text-muted-foreground">{CENTRE.address}</p>
            <dl className="mt-5 divide-y divide-border rounded-xl border border-border">
              {HOURS.map((h) => (
                <div key={h.day} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{h.day}</dt>
                  <dd>{h.open}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/contact">Contact & directions</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
