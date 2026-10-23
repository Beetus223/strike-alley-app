import { useOfferings, useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Sparkles, Trophy, Users } from "lucide-react";
import heroLanes from "@/assets/hero-lanes-authentic.jpg.asset.json";
import how5Pin from "@/assets/how-5-pin-works.jpg.asset.json";
import leagueNight from "@/assets/league-night.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site/PageHeader";
import { HoursTable } from "@/components/site/HoursTable";
import { formatWhen, useAnnouncements, useEvents, useLeagues, usePricing } from "@/lib/content";
import { useHours } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vegreville Bowling Lanes | 5-Pin Bowling in Vegreville, AB" },
      {
        name: "description",
        content:
          "Vegreville's local place for bowling, leagues, birthday parties and family fun. Six 5-pin lanes, a full snack bar and lane bookings.",
      },
      { property: "og:title", content: "Vegreville Bowling Lanes | 5-Pin Bowling" },
      {
        property: "og:description",
        content: "Bowling, leagues, parties and family fun on six 5-pin lanes in Vegreville.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: heroLanes.url },
      { name: "twitter:image", content: heroLanes.url },
    ],
  }),
  component: Home,
});





function Home() {
  const { text, visible } = useWebsiteContent();
  const CENTRE = useBusiness();
const QUICK_FACTS = [
  { icon: Clock, label: text("home.038","Open today"), value: text("home.fact_open") },
  { icon: Users, label: text("home.039","6 lanes"), value: "Up to 6 bowlers per lane" },
  { icon: Sparkles, label: text("home.040","Glow bowling"), value: text("home.fact_glow") },
];
const ACTIVITIES = [
  {
    title: text("home.041","Open bowling"),
    body: text("home.042","Drop in with the family or book ahead. Bumpers, lightweight balls and ramps are always available at no extra cost."),
    to: "/bowling" as const,
    cta: text("home.043","Prices & lane info"),
  },
  {
    title: text("home.044","Leagues"),
    body: text("home.045","Four leagues run September through April, from Tuesday afternoon seniors to the Thursday men's classic. Spares are always welcome."),
    to: "/leagues" as const,
    cta: text("home.046","Find your league"),
  },
  {
    title: text("home.047","Birthday parties"),
    body: text("home.party_body"),
    to: "/parties" as const,
    cta: text("home.048","Party packages"),
  },
  {
    title: text("home.049","Group rentals"),
    body: text("home.050","Staff socials, school groups, fundraisers and team wind-ups. Take a few lanes or the whole six-lane house."),
    to: "/rentals" as const,
    cta: text("home.051","Rental options"),
  },
];

  const { data: hours } = useHours();
  const { data: packages } = useOfferings("birthday");
  const { data: events } = useEvents();
  const { data: pricing } = usePricing();
  const { data: leagues } = useLeagues();
  const { data: announcements } = useAnnouncements();

  return (
    <>
      {(announcements ?? []).length > 0 ? (
        <div className="border-b border-border bg-secondary">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            {(announcements ?? []).filter(a=>a.featured !== false).map((a) => (
              <p key={a.id} className="text-sm">
                <span className="font-semibold text-primary">{a.title}</span>{" "}
                <span className="text-muted-foreground">{a.message}</span>
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {/* 1 — Hero with authentic lanes photo */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={text("home.hero", heroLanes.url)}
          alt={text("home.001", "The wooden lanes and pinsetters at Vegreville Bowling Centre")}
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[600px] sm:px-6 sm:py-20 lg:min-h-[680px]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
            {text("home.002", "Vegreville, Alberta · Six 5-pin lanes")}</p>
          <h1 className="brand-title mt-4 max-w-3xl text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {text("home.003", "Vegreville's local place for bowling, leagues, parties and family fun.")}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            {text("home.004", "We've been rolling five pins on 50 Street for over sixty years. Come by for an afternoon with the kids, a league night with friends, or a party we set up for you.")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button hidden={!visible("home.actions_visible")} asChild size="lg">
              <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("home.005", "Book a lane")}</a>
            </Button>
            <Button hidden={!visible("home.actions_visible")}
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link to="/hours">{text("home.006", "View hours")}</Link>
            </Button>
            <Button hidden={!visible("home.actions_visible")}
              asChild
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link to="/bowling">{text("home.007", "See prices")}</Link>
            </Button>
          </div>

          <dl className="mt-10 grid gap-3 sm:grid-cols-3">
            {QUICK_FACTS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <Icon className="h-5 w-5 text-white" aria-hidden />
                <dt className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/75">
                  {label}
                </dt>
                <dd className="font-display text-lg text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2 — Neutral: activities */}
      <Section
        tone="neutral"
        title={text("home.008", "Everything under one roof")}
        description={text("home.009", "Six lanes, a snack bar and room for the whole crew — whatever you're planning.")}
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
            src={text("home.how", how5Pin.url)}
            alt={text("home.010", "An adult and a child bowling together at Vegreville Bowling Centre")}
            width={1400}
            height={1000}
            loading="lazy"
            className="aspect-[7/5] w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {text("home.011", "New to the game?")}</p>
            <h2 className="brand-title mt-3 text-3xl sm:text-4xl">{text("home.012", "How 5-pin works")}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {text("home.013", "Canadian 5-pin uses a small handheld ball with no finger holes, five pins and three balls per frame. Pins score 2-3-5-3-2 from the outside in, so a full deck is 15 points and a perfect game is 450.")}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">{text("home.014", "Strike")}</span>
                <span className="text-muted-foreground">{text("home.015", "15 pins, plus your next two balls")}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">{text("home.016", "Spare")}</span>
                <span className="text-muted-foreground">{text("home.017", "15 pins, plus your next ball")}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">{text("home.018", "Headpin")}</span>
                <span className="text-muted-foreground">
                  {text("home.019", "needed for a count — corner pins alone don't score")}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">{text("home.020", "Game")}</span>
                <span className="text-muted-foreground">
                  {text("home.021", "10 frames, three balls each, lighter balls for every age")}</span>
              </li>
            </ul>
            <Button hidden={!visible("home.actions_visible")} asChild className="mt-7">
              <Link to="/bowling">{text("home.022", "Prices & lane info")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 — Dark feature: what's on + glow teaser */}
      <Section
        tone="dark"
        title={text("home.023", "What's on this week")}
        description={text("home.024", "Something different on the lanes most nights of the week.")}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(events ?? []).filter(e => e.featured).map((e) => (
            <article
              key={e.id}
              className="flex flex-col rounded-xl border border-white/12 bg-white/[0.04] p-6 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="w-fit rounded-full border border-gold/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                {e.category}
              </span>
              <h3 className="mt-4 text-xl text-ink-foreground">{e.title}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                <CalendarDays className="h-4 w-4" aria-hidden />
                {formatWhen(e)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{e.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button hidden={!visible("home.actions_visible")} asChild variant="secondary">
            <Link to="/events">{text("home.025", "See the full calendar")}</Link>
          </Button>
          <Button hidden={!visible("home.actions_visible")}
            asChild
            className="bg-[oklch(0.72_0.24_340)] text-[oklch(0.15_0.03_300)] shadow-[0_0_28px_-6px_oklch(0.72_0.24_340/0.65)] hover:bg-[oklch(0.76_0.22_340)]"
          >
            <Link to="/glow">{text("home.026", "Glow bowling Fri & Sat")}</Link>
          </Button>
        </div>
      </Section>

      {/* 5 — Light: pricing */}
      <Section
        title={text("home.027", "Walk-in pricing")}
        description={text("home.028", "Taxes included. Cash, debit and tap accepted at the counter.")}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(pricing ?? []).map((p) => (
            <div key={p.id} className="card-soft rounded-xl p-6">
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
              <Trophy className="h-8 w-8 shrink-0 text-primary" aria-hidden /> {text("home.029", "League nights")}</h2>
            <ul className="mt-7 space-y-4">
              {(leagues ?? []).map((l) => (
                <li key={l.id} className="card-soft rounded-xl p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg">{l.name}</h3>
                    <span className="text-sm font-semibold text-primary">
                      {l.night} · {l.start_time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.format}</p>
                </li>
              ))}
            </ul>
            <Button hidden={!visible("home.actions_visible")} asChild className="mt-7">
              <Link to="/leagues">{text("home.030", "Explore our leagues")}</Link>
            </Button>
          </div>
          <img
            src={text("home.league", leagueNight.url)}
            alt={text("home.031", "Bowlers in team shirts celebrating at the scoring table on league night")}
            width={1400}
            height={1000}
            loading="lazy"
            className="aspect-[7/5] w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]"
          />
        </div>
      </section>

      {/* 7 — Light: find us */}
      <Section title={text("home.032", "Find us")} description={CENTRE.address}>
        <div className="grid gap-8 lg:grid-cols-2">
          <HoursTable />
          <div className="card-soft rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" aria-hidden /> {text("home.033", "Downtown Vegreville")}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {text("home.034", "Free street parking out front, a level entrance and an accessible washroom. Call")}{" "}
              {CENTRE.phone} {text("home.035", "if you need a hand getting set up.")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button hidden={!visible("home.actions_visible")} asChild>
                <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("home.036", "Book a lane")}</a>
              </Button>
              <Button hidden={!visible("home.actions_visible")} asChild variant="outline">
                <Link to="/contact">{text("home.037", "Contact & directions")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
