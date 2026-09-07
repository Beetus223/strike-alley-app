import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Sparkles, Trophy, Users } from "lucide-react";
import heroLanes from "@/assets/hero-lanes-authentic.jpg.asset.json";
import pinsWarm from "@/assets/pins-warm.jpg";
import leagueNight from "@/assets/league-night.jpg";
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
          "Vegreville's local place for bowling, leagues, birthday parties and family fun. Eight 5-pin lanes, a full snack bar and lane bookings.",
      },
      { property: "og:title", content: "Vegreville Bowling Lanes | 5-Pin Bowling" },
      {
        property: "og:description",
        content: "Bowling, leagues, parties and family fun on eight 5-pin lanes in Vegreville.",
      },
    ],
  }),
  component: Home,
});

const QUICK_FACTS = [
  { icon: Clock, label: "Open today", value: "4 PM – 10 PM" },
  { icon: Users, label: "Lane capacity", value: "6 bowlers" },
  { icon: Sparkles, label: "Glow bowling", value: "Fri & Sat, 8 PM" },
];

const ACTIVITIES = [
  {
    title: "Open bowling",
    body: "Drop in with the family or book ahead. Bumpers, lightweight balls and ramps are always available at no extra cost.",
    to: "/bowling" as const,
    cta: "Prices & lane info",
  },
  {
    title: "Leagues",
    body: "Four leagues run September through April, from Tuesday afternoon seniors to the Thursday men's classic. Spares are always welcome.",
    to: "/leagues" as const,
    cta: "Find your league",
  },
  {
    title: "Birthday parties",
    body: "Two hours of lanes, shoes, food and a host who handles the setup and the cleanup. Packages start at $18 a guest.",
    to: "/parties" as const,
    cta: "Party packages",
  },
  {
    title: "Group rentals",
    body: "Staff socials, school groups, fundraisers and team wind-ups. Take a few lanes or the whole eight-lane house.",
    to: "/rentals" as const,
    cta: "Rental options",
  },
];

function Home() {
  return (
    <>
      {/* 1 — Light hero */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Vegreville, Alberta · Eight 5-pin lanes
            </p>
            <h1 className="brand-title mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Vegreville's local place for bowling, leagues, parties and family fun.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              We've been rolling five pins on 50 Street for over sixty years. Come by for an
              afternoon with the kids, a league night with friends, or a party we set up for you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg">
                <Link to="/book">Book a lane</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">View hours</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="sm:w-auto">
                <Link to="/bowling">Explore activities</Link>
              </Button>
            </div>

            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              {QUICK_FACTS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card-soft rounded-xl p-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <dt className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="font-display text-lg">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
            <img
              src={heroWarm}
              alt="Families bowling on the wooden lanes at Vegreville Bowling Lanes"
              width={1920}
              height={1080}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2 — Neutral: activities */}
      <Section
        tone="neutral"
        title="Everything under one roof"
        description="Eight lanes, a snack bar and room for the whole crew — whatever you're planning."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVITIES.map((a) => (
            <article key={a.title} className="card-soft flex flex-col rounded-xl p-6">
              <h3 className="text-xl">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
              <Link
                to={a.to}
                className="mt-4 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {a.cta} →
              </Link>
            </article>
          ))}
        </div>
      </Section>

      {/* 3 — Light: authentic image + 5-pin explainer */}
      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <img
            src={pinsWarm}
            alt="Five Canadian 5-pin bowling pins with red bands standing on a wooden lane"
            width={1400}
            height={1000}
            loading="lazy"
            className="aspect-[7/5] w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              New to the game?
            </p>
            <h2 className="brand-title mt-3 text-3xl sm:text-4xl">How 5-pin works</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Canadian 5-pin uses a small handheld ball with no finger holes, five pins and three
              balls per frame. Pins score 2-3-5-3-2 from the outside in, so a full deck is 15 points
              and a perfect game is 450.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">Strike</span>
                <span className="text-muted-foreground">15 pins, plus your next two balls</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">Spare</span>
                <span className="text-muted-foreground">15 pins, plus your next ball</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">Headpin</span>
                <span className="text-muted-foreground">
                  needed for a count — corner pins alone don't score
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">Game</span>
                <span className="text-muted-foreground">
                  10 frames, three balls each, lighter balls for every age
                </span>
              </li>
            </ul>
            <Button asChild className="mt-7">
              <Link to="/bowling">Prices & lane info</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 — Dark feature: what's on + glow teaser */}
      <Section
        tone="dark"
        title="What's on this week"
        description="Something different on the lanes most nights of the week."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.map((e) => (
            <article
              key={e.title}
              className="flex flex-col rounded-xl border border-white/12 bg-white/[0.04] p-6 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="w-fit rounded-full border border-gold/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                {e.tag}
              </span>
              <h3 className="mt-4 text-xl text-ink-foreground">{e.title}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                <CalendarDays className="h-4 w-4" aria-hidden />
                {e.when}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{e.blurb}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/events">See the full calendar</Link>
          </Button>
          <Button
            asChild
            className="bg-[oklch(0.72_0.24_340)] text-[oklch(0.15_0.03_300)] shadow-[0_0_28px_-6px_oklch(0.72_0.24_340/0.65)] hover:bg-[oklch(0.76_0.22_340)]"
          >
            <Link to="/glow">Glow bowling Fri & Sat</Link>
          </Button>
        </div>
      </Section>

      {/* 5 — Light: pricing */}
      <Section
        title="Walk-in pricing"
        description="Taxes included. Cash, debit and tap accepted at the counter."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING.map((p) => (
            <div key={p.label} className="card-soft rounded-xl p-6">
              <p className="font-display text-3xl text-primary">{p.price}</p>
              <p className="mt-1 font-semibold">{p.label}</p>
              <p className="text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 6 — Neutral: leagues photo + list */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div>
            <h2 className="brand-title flex items-center gap-3 text-3xl sm:text-4xl">
              <Trophy className="h-8 w-8 shrink-0 text-primary" aria-hidden /> League nights
            </h2>
            <ul className="mt-7 space-y-4">
              {LEAGUES.map((l) => (
                <li key={l.slug} className="card-soft rounded-xl p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg">{l.name}</h3>
                    <span className="text-sm font-semibold text-primary">
                      {l.night} · {l.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.format}</p>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7">
              <Link to="/leagues">League details & standings</Link>
            </Button>
          </div>
          <img
            src={leagueNight}
            alt="Bowlers in team shirts celebrating at the scoring table on league night"
            width={1400}
            height={1000}
            loading="lazy"
            className="aspect-[7/5] w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]"
          />
        </div>
      </section>

      {/* 7 — Light: find us */}
      <Section title="Find us" description={CENTRE.address}>
        <div className="grid gap-8 lg:grid-cols-2">
          <dl className="card-soft divide-y divide-border rounded-xl">
            {HOURS.map((h) => (
              <div key={h.day} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">{h.day}</dt>
                <dd className="font-medium">{h.open}</dd>
              </div>
            ))}
          </dl>
          <div className="card-soft rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" aria-hidden /> Downtown Vegreville
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Free street parking out front, a level entrance and an accessible washroom. Call{" "}
              {CENTRE.phone} if you need a hand getting set up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/book">Book a lane</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Contact & directions</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
