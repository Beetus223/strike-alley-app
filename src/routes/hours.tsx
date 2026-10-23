import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { HoursTable } from "@/components/site/HoursTable";
import { CENTRE } from "@/lib/site-data";

export const Route = createFileRoute("/hours")({
  head: () => ({
    meta: [
      { title: "Hours | Vegreville Bowling Lanes" },
      { name: "description", content: "Opening hours, public bowling, food service, glow bowling and seasonal hours at Vegreville Bowling Lanes." },
      { property: "og:title", content: "Hours | Vegreville Bowling Lanes" },
      { property: "og:description", content: "When we're open for bowling, food and glow nights in Vegreville." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HoursPage,
});

function HoursPage() {
  const { text } = useWebsiteContent();
  const CENTRE = useBusiness();


  return (
    <>
      <PageHeader eyebrow={text("hours.001", "Plan your visit")} title={text("hours.002", "Hours")} intro={text("hours.003", "Regular hours, public bowling, food service and any special or seasonal hours.")}>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/book">{text("hours.004", "Book a lane")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`tel:${CENTRE.phone.replace(/[^0-9]/g, "")}`}>
              <Phone className="h-4 w-4" aria-hidden /> {text("hours.005", "Call")}{CENTRE.phone}
            </a>
          </Button>
        </div>
      </PageHeader>
      <Section>
        <div className="max-w-3xl">
          <HoursTable />
          <p className="mt-4 text-sm text-muted-foreground">
            {text("hours.006", "Hours can change for holidays and tournaments — check")}{" "}
            <Link to="/announcements" className="font-medium text-primary hover:underline">{text("hours.007", "announcements")}</Link> {text("hours.008", "or call ahead.")}</p>
        </div>
      </Section>
    </>
  );
}
