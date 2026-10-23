import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { useBusiness, telephone } from "@/lib/website-content";
export const Route = createFileRoute("/inquiries")({
  head: () => ({
    meta: [
      { title: "Special Events & Group Inquiries | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Ask about birthday parties, fundraisers, group outings and facility rentals at Vegreville Bowling Lanes.",
      },
      {
        property: "og:title",
        content: "Special Events & Group Inquiries | Vegreville Bowling Lanes",
      },
      {
        property: "og:description",
        content: "Talk to our staff about your party, group outing or rental.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InquiryPage,
});
function InquiryPage(){const business=useBusiness();return <><PageHeader eyebrow="Let’s plan something special" title="Special events & group inquiries" intro="Call our team to discuss your party, group outing or rental."><Button asChild size="lg"><a href={telephone(business.phone)}>Call to Discuss Your Event</a></Button></PageHeader><Section><a className="font-display text-4xl text-primary" href={telephone(business.phone)}>{business.phone}</a><p className="mt-4 text-muted-foreground">{business.address}</p></Section></>;}
