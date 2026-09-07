import { createFileRoute } from "@tanstack/react-router";
import snackbar from "@/assets/snack-warm.jpg";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { MENU } from "@/lib/site-data";

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
        eyebrow="Kitchen closes 30 minutes before we do"
        title="Snack Bar"
        intro="Order at the counter or ring the lane phone and we'll bring it to you."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-8 sm:grid-cols-2">
            {MENU.map((group) => (
              <div key={group.section}>
                <h2 className="text-3xl text-primary">{group.section}</h2>
                <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <p className="font-display text-xl">{item.price}</p>
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
            <p className="mt-4 text-sm text-muted-foreground">
              Gluten-free buns and vegetarian options are available — just ask. Party packages include
              food, so you don't need to order separately.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
