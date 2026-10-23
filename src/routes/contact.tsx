import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { HoursTable } from "@/components/site/HoursTable";
import { CENTRE } from "@/lib/site-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Hours | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Hours, phone number, email and directions to Vegreville Bowling Lanes at 5026 50 Street, Vegreville, Alberta.",
      },
      { property: "og:title", content: "Contact & Hours | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Find our hours, phone number and directions in downtown Vegreville.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { text } = useWebsiteContent();
  const CENTRE = useBusiness();


  return (
    <>
      <PageHeader
        eyebrow={text("contact.001", "Downtown Vegreville")}
        title={text("contact.002", "Contact & Hours")}
        intro={text("contact.003", "Call the counter during open hours — someone will pick up between frames.")}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <MapPin className="mt-1 h-5 w-5 text-primary" aria-hidden />
                <span>{CENTRE.address}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-1 h-5 w-5 text-primary" aria-hidden />
                <a className="hover:underline" href={`tel:${CENTRE.phone.replace(/[^0-9]/g, "")}`}>
                  {CENTRE.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-1 h-5 w-5 text-primary" aria-hidden />
                <a className="hover:underline" href={`mailto:${CENTRE.email}`}>
                  {CENTRE.email}
                </a>
              </li>
            </ul>
            <div>
              <h2 className="text-3xl">{text("contact.004", "Hours")}</h2>
              <HoursTable className="mt-4" />
              <p className="mt-2 text-sm text-muted-foreground">
                {text("contact.005", "Hours shift during tournaments and holidays — check our Facebook page or call ahead.")}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe
              title={text("contact.006", "Map to Vegreville Bowling Lanes")}
              src={`https://www.google.com/maps?q=${CENTRE.mapQuery}&output=embed`}
              loading="lazy"
              className="h-[420px] w-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
