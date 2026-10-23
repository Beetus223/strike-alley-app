import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
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
  const { text, visible } = useWebsiteContent();
  const CENTRE = useBusiness();


  return (
    <>
      <PageHeader
        eyebrow={text("book.001", "Call to book a lane")}
        title={text("book.002", "Ready to go bowling?")}
        intro={text("book.003", "Give us a call and we’ll help you find a time that works for you! Whether you’re planning a casual game with friends or a family outing, our team will be happy to help.")}
      >
        <a
          className="mb-5 block font-display text-4xl text-primary"
          href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}
        >
          {CENTRE.phone}
        </a>
        <Button asChild size="lg" className="min-h-14 w-full sm:w-auto">
          <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}>
            <Phone />
            {text("book.004", "Call Now")}</a>
        </Button>
      </PageHeader>
      <Section>
        <h2 className="text-3xl">{text("book.005", "Planning Something Special?")}</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
          {text("book.006", "From birthday celebrations to group outings, we’re happy to help you plan your visit. Give us a call to discuss your plans, ask questions, and find the best option for your group.")}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({length:6},(_,i)=>({title:text(`book.event${i}.title`),description:text(`book.event${i}.description`),shown:visible(`book.event${i}.visible`)})).filter(item=>item.shown).map((item) => (
            <article key={item.title} className="card-soft flex flex-col rounded-lg p-6">
              <h3 className="text-2xl">{item.title}</h3>
              <p className="mt-3 mb-6 leading-relaxed text-muted-foreground">{item.description}</p>
              <Button asChild variant="outline" className="mt-auto min-h-12 h-auto whitespace-normal py-3">
                <a href={`tel:${CENTRE.phone.replace(/\D/g, "")}`}><Phone className="shrink-0" />{text("book.007", "Call to Discuss Your Event")}</a>
              </Button>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
