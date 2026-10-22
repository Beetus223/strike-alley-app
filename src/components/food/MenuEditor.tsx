import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatCents, parseDollarsToCents } from "@/lib/food-order";
import type { MenuItemRow } from "@/components/food/SnackBarMenu";

/** Staff editor for the public, view-only Snack Bar menu (menu_items). */

const emptyItem = { category: "", name: "", description: "", price: "", image_url: "" };

export function MenuEditor() {
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const { data: items } = useQuery({
    queryKey: ["kitchen-menu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").order("category_sort").order("sort_order");
      if (error) throw error;
      return data as MenuItemRow[];
    },
  });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(emptyItem);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    (items ?? []).forEach((i) => m.set(i.category, i.category_sort));
    return m;
  }, [items]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["kitchen-menu"] });
    void qc.invalidateQueries({ queryKey: ["menu_items"] });
  };

  async function save() {
    const cents = parseDollarsToCents(form.price);
    if (!form.name.trim() || !form.category.trim() || cents === null) {
      toast.error("Name, category and a valid price are required.");
      return;
    }
    const cat = form.category.trim();
    const row = {
      category: cat,
      category_sort: categories.get(cat) ?? Math.max(0, ...categories.values()) + 1,
      name: form.name.trim().slice(0, 150),
      description: form.description.trim().slice(0, 1000) || null,
      price_cents: cents,
      image_url: form.image_url.trim() || null,
    };
    const { error } =
      editing === "new"
        ? await supabase.from("menu_items").insert({ ...row, sort_order: (items?.length ?? 0) + 1 })
        : await supabase.from("menu_items").update(row).eq("id", editing!);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Menu saved");
    setEditing(null);
    refresh();
  }

  async function patch(id: string, p: Partial<MenuItemRow>) {
    const { error } = await supabase.from("menu_items").update(p).eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  }

  const shown = (items ?? []).filter((i) => showArchived || !i.is_archived);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={() => {
            setForm(emptyItem);
            setEditing("new");
          }}
        >
          Add menu item
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} /> Show archived
        </label>
        <p className="text-sm text-muted-foreground">Prices are tax-included. Price changes only affect new orders.</p>
      </div>
      {editing && (
        <div className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="m-cat">Category</Label>
            <Input id="m-cat" list="m-cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <datalist id="m-cats">
              {[...categories.keys()].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="m-name">Name</Label>
            <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="m-price">Price (tax included)</Label>
            <Input id="m-price" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="m-img">Image URL (optional)</Label>
            <Input id="m-img" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="m-desc">Description</Label>
            <Textarea id="m-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="divide-y divide-border rounded-2xl border border-border">
        {shown.map((i) => (
          <div key={i.id} className={`flex flex-wrap items-center gap-3 p-3 ${i.is_archived ? "opacity-60" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {i.name} <span className="text-sm text-muted-foreground">· {i.category}</span>
              </p>
              <p className="text-sm text-muted-foreground">{formatCents(i.price_cents)}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={i.is_available} onCheckedChange={(v) => patch(i.id, { is_available: v })} /> Available
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setForm({
                  category: i.category,
                  name: i.name,
                  description: i.description ?? "",
                  price: (i.price_cents / 100).toFixed(2),
                  image_url: i.image_url ?? "",
                });
                setEditing(i.id);
              }}
            >
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => patch(i.id, { is_archived: !i.is_archived })}>
              {i.is_archived ? "Restore" : "Archive"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
