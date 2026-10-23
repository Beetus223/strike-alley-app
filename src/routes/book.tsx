import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight } from "lucide-react";
import { CENTRE } from "@/lib/site-data";
export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Lane | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Call Vegreville Bowling Lanes to reserve your 5-pin bowling lanes or discuss a party, group event or rental.",
      },
      { property: "og:title", content: "Book a Lane | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Give us a call and we’ll help you find a time for your bowling visit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookPage,
});
function BookPage() {
  return (
    <>
      <PageHeader
        eyebrow="Call to book a lane"
        title="Ready to go bowling?"
        intro="Give us a call and we’ll help you find a time that works for you!"
      >
        <a className="mb-5 block font-display text-4xl text-primary" href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>{CENTRE.phone}</a>
        <Button asChild size="lg" className="min-h-14 w-full sm:w-auto"><a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}><Phone />Call Now</a></Button>
      </PageHeader>
      <Section>
        <h2 className="text-3xl">Planning something special?</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Birthday parties & celebrations", to: "/parties" },
            { label: "Groups & fundraisers", to: "/inquiries" },
            { label: "Business & corporate events", to: "/inquiries" },
            { label: "Private bowling-alley rentals", to: "/rentals" },
            { label: "Meeting-room rentals", to: "/rentals" },
            { label: "Other special events", to: "/inquiries" },
          ].map((item) => <Button key={item.label} asChild variant="outline" className="min-h-14 h-auto justify-between whitespace-normal text-left"><Link to={item.to}>{item.label}<ArrowRight className="shrink-0" /></Link></Button>)}
        </div>
      </Section>
    </>
  );
}
