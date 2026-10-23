import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { useLeagues } from "@/lib/content";

export const Route = createFileRoute("/leagues")({
  head: () => ({
    meta: [
      { title: "Bowling Leagues | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Mixed, men's, senior and YBC youth 5-pin leagues in Vegreville. Formats, fees, nights and open team spots.",
      },
      { property: "og:title", content: "Bowling Leagues | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content:
          "Four 5-pin leagues running September through April, with handicap divisions for every level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaguesPage,
});

function LeaguesPage() {
  const { data: leagues } = useLeagues();

  return (
    <>
      <PageHeader
        eyebrow="September – April"
        title="Leagues"
        intro="Four leagues, every skill level, handicap scoring so a first-year bowler can beat a 220 average. Spares are always welcome — put your name on the spare list and we'll call you."
      >
        <Button asChild size="lg">
          <Link to="/contact">Ask about a spot</Link>
        </Button>
      </PageHeader>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          {(leagues ?? []).map((l) => (
            <article key={l.id} className="card-soft rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-3xl">{l.name}</h2>
                {l.spots ? (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest text-primary">
                    {l.spots}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-muted-foreground">{l.description}</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Night", `${l.night} at ${l.start_time}`],
                  ["Season", l.season],
                  ["Format", l.format],
                  ["Fee", l.fee],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border p-3">
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-4xl">How averages work here</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Your average is your total pinfall divided by games bowled, recalculated after every
            league night. Handicap is a percentage of the difference between your average and the
            league base — for Monday Mixed that's 80% of 200. Bowl 15 games and your average is
            locked in as established for tournament entry.
          </p>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Weekly scores and standings are posted at the counter on league nights.
          </p>
        </div>
      </section>
    </>
  );
}
