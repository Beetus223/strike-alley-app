import { useOfferings, packageDisplay, useWebsiteContent, useBusiness } from "@/lib/website-content";
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



function RentalsPage() {
  const { text, visible } = useWebsiteContent();
  const CENTRE = useBusiness();
  const {data: offers}=useOfferings("rental");
  const RENTALS=(offers??[]).map(p=>({name:p.name,price:packageDisplay(p).price,detail:[p.description,...p.features].join(" ")}));


  return (
    <>
      <PageHeader
        eyebrow={text("rentals.001", "Fundraisers · Schools · Staff events")}
        title={text("rentals.002", "Rentals")}
        intro={text("rentals.intro")}
      >
        <Button hidden={!visible("rentals.actions_visible")} asChild size="lg">
          <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("rentals.003", "Request a rental")}</a>
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

        <div hidden={!visible("rentals.terms_verified")} className="mt-8 rounded-2xl border border-border p-6">
          <h2 className="text-3xl">{text("rentals.004", "Rental terms")}</h2>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            <li>{text("rentals.005", "50% deposit due at booking, balance on the day.")}</li>
            <li>{text("rentals.006", "Cancellations more than 7 days out are fully refundable.")}</li>
            <li>{text("rentals.007", "Outside food is limited to cake and candy; the snack bar handles the rest.")}</li>
            <li>{text("rentals.008", "Fundraiser rates available for registered Vegreville-area non-profits.")}</li>
            <li>
              {text("rentals.009", "Questions? Call")}{CENTRE.phone} {text("rentals.010", "or email")}{CENTRE.email}.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
