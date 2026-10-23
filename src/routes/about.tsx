import { useWebsiteContent, useBusiness } from "@/lib/website-content";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});



function AboutPage() {
  const { text } = useWebsiteContent();
  const CENTRE = useBusiness();
const TIMELINE = [
  { year: text("about.008","1962"), text: text("about.009","The lanes open on 50 Street with six hand-set 5-pin lanes.") },
  { year: text("about.010","1978"), text: text("about.011","Automatic pinsetters installed.") },
  { year: text("about.012","1994"), text: text("about.013","Youth Bowling Canada program starts on Saturday mornings.") },
  { year: text("about.014","2011"), text: text("about.015","New synthetic approaches, scoring screens and the snack bar remodel.") },
  { year: text("about.016","2023"), text: text("about.017","Glow bowling lighting and sound upgrade for Friday and Saturday nights.") },
];

  return (
    <>
      <PageHeader
        eyebrow={text("about.001", "Family run since 1962")}
        title={text("about.002", "About the lanes")}
        intro={text("about.003", "Three generations of Vegreville families have learned to bowl here. We're still the same six lanes, just with better lighting and a much better burger.")}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl">{text("about.004", "Our story")}</h2>
            <p className="mt-3 text-muted-foreground">
              {text("about.005", "Vegreville Bowling Lanes has been part of downtown since the early sixties, when pinsetters were teenagers earning a nickel a frame. Today the building does double duty: a competitive league house four nights a week, and the town's go-to spot for birthdays, first dates and rainy-Sunday family outings.")}</p>
            <p className="mt-3 text-muted-foreground">
              {text("about.006", "We're proudly 5-pin — the Canadian game — and we coach it seriously. Our YBC program has sent bowlers to provincials nine years running.")}</p>
          </div>
          <div>
            <h2 className="text-3xl">{text("about.007", "Milestones")}</h2>
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
