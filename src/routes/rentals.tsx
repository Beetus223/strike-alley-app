import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { CENTRE } from "@/lib/site-data";

export const Route = createFileRoute("/rentals")({
  head: () => ({
    meta: [
      { title: "Lane & Facility Rentals | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Rent single lanes, the meeting room or the whole six-lane house in Vegreville, AB for fundraisers, staff events and school groups.",
      },
      { property: "og:title", content: "Lane & Facility Rentals | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Single lanes, the meeting room, or all six lanes for your group event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RentalsPage,
});

const RENTALS = [
  {
    name: "Single lane",
    price: "$32 / hour",
    detail: "Up to 6 bowlers. Shoes $3 each. Best for small groups and casual practice.",
  },
  {
    name: "Group lanes (4 lanes)",
    price: "$110 / hour",
    detail: "Up to 24 people, reserved seating area and your own scoreboard messaging.",
  },
  {
    name: "Whole house (6 lanes)",
    price: "$450 / 3 hours",
    detail: "Up to 36 people, private snack bar service and full sound system.",
  },
  {
    name: "Meeting room",
    price: "$60 / 2 hours",
    detail: "Seats 24, projector and coffee service. Add bowling at group rates.",
  },
];

function RentalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fundraisers · Schools · Staff events"
        title="Rentals"
        intro={`The whole building is available outside league hours. Monday is our quietest day and the easiest to book on short notice.`}
      >
        <Button asChild size="lg">
          <Link to="/inquiries">Request a rental</Link>
        </Button>
      </PageHeader>

      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          {RENTALS.map((r) => (
            <article key={r.name} className="card-soft rounded-2xl p-6">
              <h2 className="text-3xl">{r.name}</h2>
              <p className="mt-1 font-display text-3xl text-primary">{r.price}</p>
              <p className="mt-3 text-muted-foreground">{r.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border p-6">
          <h2 className="text-3xl">Rental terms</h2>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>50% deposit due at booking, balance on the day.</li>
            <li>Cancellations more than 7 days out are fully refundable.</li>
            <li>Outside food is limited to cake and candy; the snack bar handles the rest.</li>
            <li>Fundraiser rates available for registered Vegreville-area non-profits.</li>
            <li>
              Questions? Call {CENTRE.phone} or email {CENTRE.email}.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
