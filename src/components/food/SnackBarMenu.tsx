import { useBusiness, useWebsiteContent } from "@/lib/website-content";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MENU, SNACK_BAR_PHONE } from "@/lib/site-data";
import { formatCents } from "@/lib/food-order";

export interface MenuItemRow {
  id: string;
  category: string;
  category_sort: number;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  is_archived: boolean;
  sort_order: number;
}

export const menuItemsQuery = {
  queryKey: ["menu_items"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_archived", false)
      .order("category_sort")
      .order("sort_order");
    if (error) throw error;
    return data as MenuItemRow[];
  },
};

/** View-only snack bar menu. Staff edit items in the Staff Dashboard. */
export function SnackBarMenu() {
  const {text}=useWebsiteContent();
  const SNACK_BAR_PHONE=useBusiness().snackPhone;
  const { data: items, isLoading, isError } = useQuery(menuItemsQuery);

  const groups = useMemo(() => {
    const map = new Map<string, MenuItemRow[]>();
    (items ?? []).forEach((i) => map.set(i.category, [...(map.get(i.category) ?? []), i]));
    return [...map.entries()];
  }, [items]);
  const notes = Object.fromEntries(MENU.map((g) => [g.section, text("menu.note."+g.section,g.note??"")]));

  if (isLoading) return <p className="text-muted-foreground" role="status">Loading menu…</p>;
  if (isError || !items) {
    return (
      <p className="text-muted-foreground" role="alert">
        The menu couldn't load right now. Please call {SNACK_BAR_PHONE} and we'll tell you what's cooking.
      </p>
    );
  }
  if (groups.length === 0) {
    return <p className="text-muted-foreground">Our menu is being updated. Call {SNACK_BAR_PHONE} for today's options.</p>;
  }

  return (
    <div className="grid gap-10 sm:grid-cols-2">
      {groups.map(([section, rows]) => (
        <div key={section}>
          <h2 className="text-2xl font-semibold text-primary sm:text-3xl">{section}</h2>
          {notes[section] ? (
            <p className="mt-2 max-w-md text-sm italic leading-relaxed text-muted-foreground">{notes[section]}</p>
          ) : null}
          <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-background/50">
            {rows.map((item) => (
              <li key={item.id} className="flex gap-4 p-4 transition-colors hover:bg-secondary/40">
                {item.image_url ? (
                  <img src={item.image_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="shrink-0 font-display text-xl">{formatCents(item.price_cents)}</p>
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  ) : null}
                  {!item.is_available ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Currently unavailable
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {notes["Custom Burgers"] ? (
        <div>
          <h2 className="text-2xl font-semibold text-primary sm:text-3xl">Custom Burgers</h2>
          <p className="mt-2 max-w-md text-sm italic leading-relaxed text-muted-foreground">{notes["Custom Burgers"]}</p>
        </div>
      ) : null}
    </div>
  );
}
