import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/site/PageHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "A family-run 5-pin bowling centre on 50 Street in Vegreville, Alberta, open since 1962 and still pin-setting for the whole community.",
      },
      { property: "og:title", content: "About Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Family-run 5-pin bowling in Vegreville, Alberta since 1962.",
      },
    ],
  }),
  component: AboutPage,
});

const TIMELINE = [
  { year: "1962", text: "The lanes open on 50 Street with six hand-set 5-pin lanes." },
  { year: "1978", text: "Automatic pinsetters installed; two lanes added to make eight." },
  { year: "1994", text: "Youth Bowling Canada program starts on Saturday mornings." },
  { year: "2011", text: "New synthetic approaches, scoring screens and the snack bar remodel." },
  { year: "2023", text: "Glow bowling lighting and sound upgrade for Friday and Saturday nights." },
];

function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Family run since 1962"
        title="About the lanes"
        intro="Three generations of Vegreville families have learned to bowl here. We're still the same eight lanes, just with better lighting and a much better burger."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl">Our story</h2>
            <p className="mt-3 text-muted-foreground">
              Vegreville Bowling Lanes has been part of downtown since the early sixties, when
              pinsetters were teenagers earning a nickel a frame. Today the building does double duty:
              a competitive league house four nights a week, and the town's go-to spot for birthdays,
              first dates and rainy-Sunday family outings.
            </p>
            <p className="mt-3 text-muted-foreground">
              We're proudly 5-pin — the Canadian game — and we coach it seriously. Our YBC program has
              sent bowlers to provincials nine years running.
            </p>
          </div>
          <div>
            <h2 className="text-3xl">Milestones</h2>
            <ol className="mt-4 space-y-4">
              {TIMELINE.map((t) => (
                <li key={t.year} className="flex gap-4">
                  <span className="font-display text-2xl text-primary">{t.year}</span>
                  <span className="text-muted-foreground">{t.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  );
}
