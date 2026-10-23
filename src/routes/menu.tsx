import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import snackbar from "@/assets/loaded-gyro-poutine-fries.png.asset.json";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { SNACK_BAR_PHONE } from "@/lib/site-data";
import { SnackBarMenu } from "@/components/food/SnackBarMenu";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Snack Bar Menu | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Burgers, perogy bowls, nachos, milkshakes and pitchers of pop — the full snack bar menu at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Snack Bar Menu | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Grill items, shareables and sweets served lane-side all day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { text, visible } = useWebsiteContent();
  const CENTRE = useBusiness();
  const SNACK_BAR_PHONE = CENTRE.snackPhone;


  return (
    <>
      <PageHeader
        eyebrow={text("menu.001", "Take Out or Eat In")}
        title={text("menu.002", "Snack Bar")}
        intro={text("menu.003", "Pre-orders are accepted. Call ahead and we'll have your order ready when you arrive.")}
      >
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary">
            {text("menu.004", "Pre-Orders Accepted")}</span>
          <a
            hidden={!visible("menu.actions_visible")} href={`tel:${SNACK_BAR_PHONE.replace(/-/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-base font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {SNACK_BAR_PHONE}
          </a>
        </div>
      </PageHeader>

      <Section title={text("menu.005", "Delicious Food for You!")} description={text("menu.006", "Brisket coming in September!")}>
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <SnackBarMenu />
          </div>

          <div>
            <img
              src={text("menu.photo", snackbar.url)}
              alt={text("menu.007", "Loaded gyro poutine fries with seasoned meat, tomatoes, cheese curds, and garlic sauce")}
              width={1200}
              height={900}
              loading="lazy"
              className="w-full rounded-2xl object-cover"
            />
            <div className="mt-6 rounded-2xl border border-border bg-background/50 p-5">
              <h3 className="font-display text-lg">{text("menu.008", "Pre-order your food")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {text("menu.009", "Give us a call and we'll have everything ready for your lane or take-out order.")}</p>
              <a
                hidden={!visible("menu.actions_visible")} href={`tel:${SNACK_BAR_PHONE.replace(/-/g, "")}`}
                className="mt-4 inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
              >
                <Phone className="h-5 w-5" aria-hidden />
                {SNACK_BAR_PHONE}
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {text("menu.010", "Gluten-free buns and vegetarian options are available — just ask. Party packages include food, so you don't need to order separately.")}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
