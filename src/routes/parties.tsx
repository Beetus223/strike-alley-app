import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import partyImg from "@/assets/party-details.png.asset.json";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import {
  LANE_BOOKING,
  PARTY_EVENT_TYPES,
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
    ],
  }),
  component: PartiesPage,
});

function PartiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Special Packaging"
        title="Parties & Group Bookings"
        intro="Parties & Group Bookings of all kinds are our specialty!"
      >
        <Button asChild size="lg">
          <Link to="/book">Request a party date</Link>
        </Button>
      </PageHeader>

      <Section title="All Ages Welcome!">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-lg leading-relaxed text-muted-foreground">
            We welcome all kinds of celebrations and group events, including:
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {PARTY_EVENT_TYPES.map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary"
              >
                {type}
              </span>
            ))}
          </div>
          <p className="mt-8 text-center leading-relaxed text-muted-foreground">
            For your next birthday, choose from one of our packages below. Other events and parties can be custom-made to best suit your group and your needs.
          </p>
          <p className="mt-4 text-center leading-relaxed text-muted-foreground">
            We can also cater your event in-house with a custom menu designed around what you and your guests like.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link to="/book">Reserve your party today</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Birthday Packages"
        description="Three great ways to celebrate. Each package includes bowling, shoe rental, drinks, and more."
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

              <Button asChild className="mt-6 w-full">
                <Link to="/book">Book {p.name}</Link>
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
              The 6-lane private party option includes:
            </h3>
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
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <img
            src={partyImg.url}
            alt="Birthday cake celebration with party guests at Vegreville Bowling Lanes"
            width={1200}
            height={900}
            loading="lazy"
            className="w-full rounded-2xl object-cover"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Not planning a birthday party?
            </p>
            <h2 className="brand-title mt-3 text-3xl sm:text-4xl">
              Other Events & Group Bookings
            </h2>
            <p className="mt-4 text-lg font-medium leading-relaxed">
              No problem!
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              We welcome adult parties, Christmas parties, family gatherings, sports teams, company events, team-building events, group celebrations, and other special events.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Other events can be custom-made to best fit your group and party needs. We can also cater your event in-house with a custom menu to fit your preferences.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to="/book">Request a party date</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Section tone="dark">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="brand-title text-3xl sm:text-4xl">
            Ready to Plan Your Party?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Let's get your group together, hit the lanes, and make it a celebration to remember!
          </p>
          <p className="mt-6 text-base text-ink-muted">
            Use the "Request a party date" button to get started.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/book">Request a party date</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
