import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { EVENTS } from "@/lib/site-data";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Tournaments | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Glow Bowl Fridays, Toonie Sundays, the Pysanka Open 5-pin tournament and seasonal events at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Events & Tournaments | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Weekly specials, tournaments and seasonal nights on our eight 5-pin lanes.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Weekly & seasonal"
        title="Events"
        intro="From black-light Fridays to the Pysanka Open, there's usually something happening on the lanes."
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {EVENTS.map((e) => (
            <article key={e.title} className="neon-panel rounded-2xl p-6">
              <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest text-accent">
                {e.tag}
              </span>
              <h2 className="mt-3 text-3xl">{e.title}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-accent">
                <CalendarDays className="h-4 w-4" aria-hidden /> {e.when}
              </p>
              <p className="mt-3 text-muted-foreground">{e.blurb}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-border p-6">
          <h2 className="text-3xl">Running your own event?</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Fundraisers, staff nights, school groups and church groups all bowl here. Tell us your
            date and headcount and we'll build a quote.
          </p>
          <Button asChild className="mt-5">
            <Link to="/book">Send a booking request</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
