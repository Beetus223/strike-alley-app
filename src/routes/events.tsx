import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { formatWhen, useEvents } from "@/lib/content";

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
        content: "Weekly specials, tournaments and seasonal nights on our six 5-pin lanes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { text } = useWebsiteContent();
  const CENTRE = useBusiness();


  const { data: events } = useEvents();

  return (
    <>
      <PageHeader
        eyebrow={text("events.001", "Weekly & seasonal")}
        title={text("events.002", "Events")}
        intro={text("events.003", "From black-light Fridays to the Pysanka Open, there's usually something happening on the lanes.")}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {(events ?? []).map((e) => (
            <article key={e.id} className="card-soft rounded-2xl p-6">
              <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest text-primary">
                {e.category}
              </span>
              <h2 className="mt-3 text-3xl">{e.title}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-primary">
                <CalendarDays className="h-4 w-4" aria-hidden /> {formatWhen(e)}
              </p>
              <p className="mt-3 text-muted-foreground">{e.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-border p-6">
          <h2 className="text-3xl">{text("events.004", "Running your own event?")}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {text("events.005", "Fundraisers, staff nights, school groups and church groups all bowl here. Tell us your date and headcount and we'll build a quote.")}</p>
          <Button asChild className="mt-5">
            <Link to="/inquiries">{text("events.006", "Send a booking request")}</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
