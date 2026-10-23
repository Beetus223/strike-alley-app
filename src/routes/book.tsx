import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { BookingForm } from "@/components/reservations/BookingForm";
export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Lane | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Plan a regular 5-pin bowling visit, estimate your games and request available lanes at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Book a Lane | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Check six-lane availability and plan your bowling visit.",
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
        eyebrow="Plan your bowling visit"
        title="Book a lane"
        intro="Choose your games, group size and date. We’ll check which lanes can fit your visit."
      />
      <Section>
        <BookingForm />
      </Section>
    </>
  );
}
