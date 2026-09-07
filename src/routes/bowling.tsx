import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { PRICING, CENTRE } from "@/lib/site-data";

export const Route = createFileRoute("/bowling")({
  head: () => ({
    meta: [
      { title: "Bowling & Prices | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Game and hourly 5-pin bowling prices, glow bowling, bumpers and lane details at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Bowling & Prices | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Game rates, hourly lanes, glow bowling and accessibility info for our eight 5-pin lanes.",
      },
    ],
  }),
  component: BowlingPage,
});

const SCORING = [
  { label: "Left corner pin", value: "2 points" },
  { label: "Left three pin", value: "3 points" },
  { label: "Headpin", value: "5 points" },
  { label: "Right three pin", value: "3 points" },
  { label: "Right corner pin", value: "2 points" },
];

function BowlingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Eight lanes · Synthetic approach"
        title="Bowling & Prices"
        intro={`Every lane at ${CENTRE.name} is set up for Canadian 5-pin, with automatic scoring, bumper rails on request and ramps for bowlers who need them.`}
      >
        <Button asChild size="lg">
          <Link to="/book">Request a lane</Link>
        </Button>
      </PageHeader>

      <Section title="Rates">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING.map((p) => (
            <div key={p.label} className="neon-panel rounded-xl p-5">
              <p className="font-display text-3xl text-accent">{p.price}</p>
              <p className="mt-1 font-medium">{p.label}</p>
              <p className="text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Hourly rates are the better deal for groups of four or more. League and school-group rates
          are quoted separately — call {CENTRE.phone}.
        </p>
      </Section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl">How 5-pin scoring works</h2>
            <p className="mt-3 text-muted-foreground">
              Five pins stand in a V. Knock them all down and you score 15 — the highest single-frame
              count in the game. You get three balls per frame, and ten frames per game.
            </p>
            <dl className="mt-6 divide-y divide-border rounded-xl border border-border">
              {SCORING.map((s) => (
                <div key={s.label} className="flex justify-between px-4 py-3">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-display text-xl text-accent">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-4xl">Good to know</h2>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Perfect game:</strong> 450. The house record is
                398, set by Dwayne Kozak in 2019.
              </li>
              <li>
                <strong className="text-foreground">Balls:</strong> 5-pin balls fit in your palm — no
                finger holes and no weight classes, so kids and adults use the same ball.
              </li>
              <li>
                <strong className="text-foreground">Bumpers & ramps:</strong> free on any lane, just
                ask at the counter.
              </li>
              <li>
                <strong className="text-foreground">Accessibility:</strong> step-free entry from the
                50 Street parking lot, accessible washroom, and lanes 1–2 have wheelchair-height
                seating.
              </li>
              <li>
                <strong className="text-foreground">Socks required</strong> with rental shoes — we
                sell them for $2 if you forget.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
