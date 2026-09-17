import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import partyImg from "@/assets/party-details.png.asset.json";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { PARTY_PACKAGES } from "@/lib/site-data";

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Birthday Parties & Group Packages | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Birthday party packages with lanes, shoes, food and a host — plus whole-house rentals for up to 48 guests in Vegreville, AB.",
      },
      { property: "og:title", content: "Birthday Parties | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Strike, Glow and whole-house party packages with food, shoes and a party host.",
      },
    ],
  }),
  component: PartiesPage,
});

function PartiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Birthdays · Team wind-ups · Staff nights"
        title="Parties"
        intro="We handle the lanes, the shoes, the food and the cleanup. You bring the cake."
      >
        <Button asChild size="lg">
          <Link to="/book">Request a party date</Link>
        </Button>
      </PageHeader>

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {PARTY_PACKAGES.map((p) => (
            <article key={p.name} className="card-soft flex flex-col rounded-2xl p-6">
              <h2 className="text-3xl">{p.name}</h2>
              <p className="mt-1 font-display text-4xl text-primary">{p.price}</p>
              <p className="text-sm text-muted-foreground">{p.min}</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full">
                <Link to="/book">Book {p.name}</Link>
              </Button>
            </article>
          ))}
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <img
            src={partyImg}
            alt="Children celebrating a birthday with pizza and balloons at a bowling party table"
            width={1200}
            height={900}
            loading="lazy"
            className="w-full rounded-2xl object-cover"
          />
          <div>
            <h2 className="text-4xl">Party details</h2>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              <li>Bumpers and ball ramps for the little ones — no extra charge.</li>
              <li>Outside cake is welcome; we supply plates, forks and a knife.</li>
              <li>A $50 deposit holds your lane and comes off the final bill.</li>
              <li>Please book at least one week ahead — weekends fill up fast.</li>
              <li>Allergy notes go on your booking request and straight to the kitchen.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
