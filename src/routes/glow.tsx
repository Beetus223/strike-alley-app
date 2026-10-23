import { usePricing } from "@/lib/content";
import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Music, Sparkles, Ticket, Users } from "lucide-react";
import glowLanes from "@/assets/neon-glow-bowling-alley.png.asset.json";
import { Button } from "@/components/ui/button";
import { CENTRE } from "@/lib/site-data";

export const Route = createFileRoute("/glow")({
  head: () => ({
    meta: [
      { title: "Glow Bowling | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Glow bowling every Friday and Saturday from 7 PM in Vegreville: blacklights, music and six lit-up 5-pin lanes.",
      },
      { property: "og:title", content: "Glow Bowling Fridays & Saturdays | Vegreville Bowling" },
      {
        property: "og:description",
        content: "Blacklights, music and six glowing 5-pin lanes every Friday and Saturday night.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GlowPage,
});





function GlowPage() {
  const { text, visible } = useWebsiteContent();
  const CENTRE = useBusiness();
  const {data: prices}=usePricing();
const NIGHT_DETAILS = [
  { icon: Ticket, label: text("glow.012","Per person, per game"), value: prices?.find(p=>/glow/i.test(p.label))?.price ?? "Call for pricing" },
  { icon: Users, label: text("glow.013","Lane capacity"), value: "6 bowlers" },
  { icon: Music, label: text("glow.014","Start time"), value: text("glow.start") },
];
const HIGHLIGHTS = [
  {
    title: text("glow.015","Blacklights on all six lanes"),
    body: text("glow.016","The whole house goes dark at 7 PM. Glowing pins, glowing balls and the house lights down until close."),
  },
  {
    title: text("glow.017","Music you can actually hear"),
    body: text("glow.018","A proper sound system with requests taken at the counter. Nothing too loud for younger bowlers."),
  },
  {
    title: text("glow.019","Late snack bar"),
    body: text("glow.020","The kitchen stays open until 11 PM on glow nights — nachos, fries, milkshakes and pitchers of pop."),
  },
  {
    title: text("glow.021","Great for groups"),
    body: text("glow.022","Teen birthdays, staff socials and grad parties. Book two or more lanes and we'll keep you together."),
  },
];

  return (
    <div className="glow-zone">
      <section className="glow-grid border-b border-white/10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="glow-accent text-xs font-semibold uppercase tracking-[0.28em]">
              {text("glow.001", "Friday & Saturday · 7 PM – 10 PM")}</p>
            <h1 className="glow-text brand-title mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {text("glow.002", "Glow Bowling")}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              {text("glow.003", "Lights down, blacklights up. Two nights a week the lanes light up in neon and the music comes on — the loudest, brightest thing we do all week.")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button hidden={!visible("glow.actions_visible")}
                asChild
                size="lg"
                className="bg-[oklch(0.72_0.24_340)] text-[oklch(0.15_0.03_300)] shadow-[0_0_34px_-6px_oklch(0.72_0.24_340/0.7)] hover:bg-[oklch(0.76_0.22_340)]"
              >
                <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("glow.004", "Book a glow lane")}</a>
              </Button>
              <Button hidden={!visible("glow.actions_visible")}
                asChild
                size="lg"
                variant="outline"
                className="border-white/35 bg-transparent text-white hover:border-white/60 hover:bg-white/10 hover:text-white"
              >
                <Link to="/events">{text("glow.005", "See all events")}</Link>
              </Button>
            </div>
            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              {NIGHT_DETAILS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="glow-panel p-4">
                  <Icon className="glow-accent h-5 w-5" aria-hidden />
                  <dt className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/65">
                    {label}
                  </dt>
                  <dd className="font-display text-lg text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <img
            src={text("glow.photo", glowLanes.url)}
            alt={text("glow.006", "Bowling lanes lit with pink and blue neon during a glow bowling night")}
            width={1920}
            height={1080}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl border border-white/15 object-cover shadow-[0_30px_80px_-40px_oklch(0.72_0.24_340/0.8)]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="glow-text brand-title text-3xl sm:text-4xl">{text("glow.007", "What a glow night looks like")}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {HIGHLIGHTS.map((h) => (
            <article key={h.title} className="glow-panel p-6">
              <Sparkles className="glow-accent h-5 w-5" aria-hidden />
              <h3 className="mt-3 text-xl text-white">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{h.body}</p>
            </article>
          ))}
        </div>
        <div className="glow-panel mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl text-white">{text("glow.008", "Lanes go quickly after 7 PM")}</h3>
            <p className="mt-1 text-sm text-white/70">
              {text("glow.009", "Reserve ahead, or call")} {CENTRE.phone} {text("glow.010", "and we'll hold one for you.")}</p>
          </div>
          <Button hidden={!visible("glow.actions_visible")}
            asChild
            size="lg"
            className="shrink-0 bg-[oklch(0.72_0.24_340)] text-[oklch(0.15_0.03_300)] hover:bg-[oklch(0.76_0.22_340)]"
          >
            <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("glow.011", "Book a glow lane")}</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
