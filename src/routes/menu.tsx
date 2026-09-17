import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import snackbar from "@/assets/loaded-gyro-poutine-fries.png.asset.json";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { MENU, SNACK_BAR_PHONE } from "@/lib/site-data";

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
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  return (
    <>
      <PageHeader
        eyebrow="Take Out or Eat In"
        title="Snack Bar"
        intro="Pre-orders are accepted. Call ahead and we'll have your order ready when you arrive."
      >
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary">
            Pre-Orders Accepted
          </span>
          <a
            href={`tel:${SNACK_BAR_PHONE.replace(/-/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-base font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {SNACK_BAR_PHONE}
          </a>
        </div>
      </PageHeader>

      <Section title="Delicious Food for You!" description="Brisket coming in September!">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-10 sm:grid-cols-2">
            {MENU.map((group) => (
              <div key={group.section}>
                <h2 className="text-2xl font-semibold text-primary sm:text-3xl">{group.section}</h2>
                {group.note ? (
                  <p className="mt-2 max-w-md text-sm italic leading-relaxed text-muted-foreground">
                    {group.note}
                  </p>
                ) : null}
                <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-background/50">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{item.name}</p>
                        {item.desc ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 font-display text-xl">{item.price}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <img
              src={snackbar}
              alt="Burgers, fries, nachos and milkshakes on the snack bar counter"
              width={1200}
              height={900}
              loading="lazy"
              className="w-full rounded-2xl object-cover"
            />
            <div className="mt-6 rounded-2xl border border-border bg-background/50 p-5">
              <h3 className="font-display text-lg">Pre-order your food</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Give us a call and we'll have everything ready for your lane or take-out order.
              </p>
              <a
                href={`tel:${SNACK_BAR_PHONE.replace(/-/g, "")}`}
                className="mt-4 inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
              >
                <Phone className="h-5 w-5" aria-hidden />
                {SNACK_BAR_PHONE}
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Gluten-free buns and vegetarian options are available — just ask. Party packages include food, so
              you don't need to order separately.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
