import { useOfferings, packageDisplay, useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import partyImg from "@/assets/party-details.png.asset.json";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site/PageHeader";
import {
  LANE_BOOKING,
  PARTY_PACKAGES,
} from "@/lib/site-data";

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Birthday Parties & Group Packages | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Birthday party packages and group bookings at Vegreville Bowling Lanes. Galaxy Bowl, Double Strike, and Party With Me packages for all ages.",
      },
      { property: "og:title", content: "Birthday Parties & Group Packages | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content:
          "Private party packages, lane rentals, and custom events for birthdays, team wind-ups, company gatherings, and more in Vegreville, AB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: partyImg.url },
      { name: "twitter:image", content: partyImg.url },
    ],
  }),
  component: PartiesPage,
});

function PartiesPage() {
  const { text, visible } = useWebsiteContent();
  const CENTRE = useBusiness();
  const { data: packages } = useOfferings("birthday");
  const { data: laneOptions } = useOfferings("party-lanes");
  const PARTY_PACKAGES = (packages ?? []).map(packageDisplay);
  const LANE_BOOKING = {title:text("parties.lanes_title"),intro:text("parties.lanes_intro"),note:text("parties.lanes_note"),includes:text("parties.lanes_features").split("\n").filter(Boolean),options:(laneOptions??[]).map(p=>({label:p.name,price:packageDisplay(p).price,detail:p.features.join(" ")}))};


  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={text("parties.photo", partyImg.url)}
              alt={text("parties.001", "Birthday cake celebration with party guests at Vegreville Bowling Lanes")}
              width={1200}
              height={450}
              loading="eager"
              className="aspect-[16/6] w-full object-cover object-[center_25%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {text("parties.002", "Special Packaging")}</p>
              <h1 className="brand-title mt-2 text-3xl text-white sm:text-5xl lg:text-6xl">
                {text("parties.003", "Parties & Group Bookings")}</h1>
              <p className="mt-2 text-lg text-white/90 sm:text-xl">
                {text("parties.004", "All ages welcome. Let's celebrate!")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {text("parties.005", "Parties & Group Bookings of all kinds are our specialty!")}</p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {text("parties.006", "We welcome birthday parties, family gatherings, sports teams, company events, team building, Christmas parties and celebrations of all kinds.")}</p>
          <div className="mt-8 flex justify-center">
            <Button hidden={!visible("parties.actions_visible")} asChild size="lg">
              <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("parties.007", "Request a party date")}</a>
            </Button>
          </div>
        </div>
      </section>

      <Section
        title={text("parties.008", "Birthday Packages")}
        description={text("parties.009", "Three great ways to celebrate. Each package includes bowling, shoe rental, drinks, and more.")}
        tone="neutral"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {PARTY_PACKAGES.map((p) => (
            <article
              key={p.name}
              className="card-soft flex flex-col rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {p.tag ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {p.tag}
                    </p>
                  ) : null}
                  <h2 className="mt-1 text-2xl font-semibold leading-tight">
                    {p.name}
                  </h2>
                </div>
              </div>

              <p className="mt-3 font-display text-4xl text-primary">
                {p.price}
              </p>
              {p.value ? (
                <p className="text-sm font-medium text-muted-foreground">
                  {p.value}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-medium text-foreground">
                {p.capacity}
              </p>

              <ul className="mt-5 space-y-2.5 text-sm">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>

              {p.note ? (
                <p className="mt-4 text-sm italic text-muted-foreground">
                  {p.note}
                </p>
              ) : null}

              <Button hidden={!visible("parties.actions_visible")} asChild className="mt-6 w-full">
                <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("parties.010", "Book")}{p.name}</a>
              </Button>
            </article>
          ))}
        </div>
      </Section>

      <Section title={LANE_BOOKING.title} description={LANE_BOOKING.intro}>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {LANE_BOOKING.options.map((opt) => (
              <div
                key={opt.label}
                className="card-soft rounded-2xl p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {opt.label}
                </p>
                <p className="mt-2 font-display text-3xl">{opt.price}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {opt.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="card-soft rounded-2xl p-6">
            <h3 className="text-lg font-semibold">
              {text("parties.011", "The 6-lane private party option includes:")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {LANE_BOOKING.includes.map((i) => (
                <li key={i} className="flex gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm italic text-muted-foreground">
              {LANE_BOOKING.note}
            </p>
          </div>
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {text("parties.012", "Not planning a birthday party?")}</p>
          <h2 className="brand-title mt-3 text-3xl sm:text-4xl">
            {text("parties.013", "Other Events & Group Bookings")}</h2>
          <p className="mt-4 text-lg font-medium leading-relaxed">
            {text("parties.014", "No problem!")}</p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {text("parties.015", "We welcome adult parties, Christmas parties, family gatherings, sports teams, company events, team-building events, group celebrations, and other special events.")}</p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {text("parties.016", "Other events can be custom-made to best fit your group and party needs. We can also cater your event in-house with a custom menu to fit your preferences.")}</p>
          <div className="mt-8 flex justify-center">
            <Button hidden={!visible("parties.actions_visible")} asChild size="lg">
              <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("parties.017", "Request a party date")}</a>
            </Button>
          </div>
        </div>
      </section>

      <Section tone="dark">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="brand-title text-3xl sm:text-4xl">
            {text("parties.018", "Ready to Plan Your Party?")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            {text("parties.019", "Let's get your group together, hit the lanes, and make it a celebration to remember!")}</p>
          <p className="mt-6 text-base text-ink-muted">
            {text("parties.020", "Use the \"Request a party date\" button to get started.")}</p>
          <div className="mt-8 flex justify-center">
            <Button hidden={!visible("parties.actions_visible")} asChild size="lg" variant="secondary">
              <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{text("parties.021", "Request a party date")}</a>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
