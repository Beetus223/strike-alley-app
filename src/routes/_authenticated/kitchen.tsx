import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatCents,
  nextStatuses,
  parseDollarsToCents,
  STATUS_LABEL,
  type Fulfillment,
  type OrderStatus,
  type OrderingSettings,
} from "@/lib/food-order";
import type { MenuItemRow } from "@/components/food/SnackBarOrdering";

export const Route = createFileRoute("/_authenticated/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Orders | Vegreville Bowling Lanes Staff" },
      { name: "description", content: "Staff-only snack bar order dashboard." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Kitchen Orders | Vegreville Bowling Lanes Staff" },
      { property: "og:description", content: "Staff-only snack bar order dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KitchenPage,
});

interface OrderRow {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  fulfillment: Fulfillment;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
  delivery_instructions: string | null;
  special_instructions: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  status: OrderStatus;
  is_test: boolean;
  created_at: string;
  food_order_items: { id: string; name: string; quantity: number; line_total_cents: number }[];
}

function KitchenPage() {
  const { isStaff } = useAuth();
  if (!isStaff) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
        This page is for Vegreville Bowling Lanes staff only.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Kitchen &amp; Snack Bar</h1>
        <Button asChild variant="outline">
          <Link to="/admin">Back to Staff Dashboard</Link>
        </Button>
      </div>
      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="settings">Ordering Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrdersPanel />
        </TabsContent>
        <TabsContent value="menu">
          <MenuPanel />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ACTIVE: OrderStatus[] = ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"];

function OrdersPanel() {
  const qc = useQueryClient();
  const [view, setView] = useState<"open" | "history">("open");
  const [newAlert, setNewAlert] = useState(0);
  const [confirm, setConfirm] = useState<{ order: OrderRow; to: OrderStatus } | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["kitchen-orders", view],
    refetchInterval: 20000,
    queryFn: async () => {
      let q = supabase
        .from("food_orders")
        .select("*, food_order_items(id, name, quantity, line_total_cents)")
        .order("created_at", { ascending: view === "open" });
      q = view === "open" ? q.in("status", ACTIVE) : q.in("status", ["completed", "declined"]).limit(200);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  // Alert on orders not seen before (realtime + polling backup)
  useEffect(() => {
    if (!orders || view !== "open") return;
    const ids = new Set(orders.map((o) => o.id));
    if (seen.current) {
      const fresh = orders.filter((o) => !seen.current!.has(o.id) && o.status === "pending");
      if (fresh.length) {
        setNewAlert((n) => n + fresh.length);
        toast(`New order #${fresh[fresh.length - 1].order_number}`);
      }
      fresh.forEach((o) => seen.current!.add(o.id));
    } else seen.current = ids;
  }, [orders, view]);

  useEffect(() => {
    const ch = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_orders" }, () => {
        void qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [qc]);

  async function apply(order: OrderRow, to: OrderStatus) {
    const { error } = await supabase.from("food_orders").update({ status: to }).eq("id", order.id).eq("status", order.status);
    if (error) toast.error(`Couldn't update order: ${error.message}`);
    else toast.success(`Order #${order.order_number}: ${STATUS_LABEL[to]}`);
    void qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
  }

  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <div className="mt-4">
      {newAlert > 0 && (
        <button
          onClick={() => setNewAlert(0)}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-primary bg-primary/15 p-4 text-left font-semibold text-primary"
        >
          <Bell className="h-5 w-5 animate-pulse" aria-hidden /> {newAlert} new order{newAlert === 1 ? "" : "s"} — tap to dismiss
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant={view === "open" ? "default" : "outline"} onClick={() => setView("open")}>
          Outstanding {pendingCount ? `(${pendingCount} pending)` : ""}
        </Button>
        <Button variant={view === "history" ? "default" : "outline"} onClick={() => setView("history")}>
          Completed &amp; history
        </Button>
      </div>
      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading orders…</p>
      ) : error ? (
        <p className="mt-6 text-destructive">Couldn't load orders.</p>
      ) : !orders?.length ? (
        <p className="mt-6 text-muted-foreground">{view === "open" ? "No outstanding orders." : "No past orders yet."}</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o, idx) => (
            <article
              key={o.id}
              className={`rounded-2xl border p-4 ${o.status === "pending" ? "border-primary bg-primary/5" : "border-border bg-background/50"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl">
                    #{o.order_number}
                    {o.is_test ? <span className="ml-2 text-sm text-muted-foreground">TEST</span> : null}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                    {view === "open" && idx === 0 ? " · oldest" : ""}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase">
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-primary">
                {o.fulfillment === "pickup" ? "Pickup" : "Delivery"}
              </p>
              <p className="font-medium">{o.customer_name}</p>
              <a href={`tel:${o.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <Phone className="h-3 w-3" aria-hidden /> {o.phone}
              </a>
              {o.fulfillment === "delivery" && (
                <p className="mt-1 text-sm">
                  {o.street_address}, {o.city} {o.postal_code}
                  {o.delivery_instructions ? <span className="block text-muted-foreground">{o.delivery_instructions}</span> : null}
                </p>
              )}
              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-base">
                {o.food_order_items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span>
                      <strong>{i.quantity}×</strong> {i.name}
                    </span>
                    <span className="text-muted-foreground">{formatCents(i.line_total_cents)}</span>
                  </li>
                ))}
              </ul>
              {o.special_instructions && (
                <p className="mt-2 rounded-lg bg-muted p-2 text-sm">
                  <strong>Notes:</strong> {o.special_instructions}
                </p>
              )}
              <p className="mt-3 flex justify-between font-bold">
                <span>Total (tax incl.)</span>
                <span>{formatCents(o.total_cents)}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextStatuses(o.status, o.fulfillment).map((to) => (
                  <Button
                    key={to}
                    size="lg"
                    variant={to === "declined" ? "outline" : "default"}
                    onClick={() => (to === "declined" || to === "completed" ? setConfirm({ order: o, to }) : apply(o, to))}
                  >
                    {to === "confirmed" ? "Accept" : to === "declined" ? "Decline" : `Mark ${STATUS_LABEL[to]}`}
                  </Button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.to === "declined" ? "Decline" : "Complete"} order #{confirm?.order.order_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.to === "declined"
                ? "The customer will be told their order can't be fulfilled. This can't be undone."
                : "This moves the order to history. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) void apply(confirm.order, confirm.to);
                setConfirm(null);
              }}
            >
              {confirm?.to === "declined" ? "Decline order" : "Mark completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const emptyItem = { category: "", name: "", description: "", price: "", image_url: "" };

function MenuPanel() {
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
    if (error) return toast.error(error.message);
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

function SettingsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["ordering_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordering_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as OrderingSettings;
    },
  });
  const [f, setF] = useState<{ area: string; fee: string; message: string } | null>(null);
  useEffect(() => {
    if (data)
      setF({
        area: data.delivery_area ?? "",
        fee: data.delivery_fee_cents === null ? "" : (data.delivery_fee_cents / 100).toFixed(2),
        message: data.customer_message ?? "",
      });
  }, [data]);

  async function update(p: Partial<OrderingSettings>) {
    const { error } = await supabase.from("ordering_settings").update(p).eq("id", 1);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
    void qc.invalidateQueries({ queryKey: ["ordering_settings"] });
  }

  if (!data || !f) return <p className="mt-4 text-muted-foreground">Loading…</p>;
  return (
    <div className="mt-4 max-w-xl space-y-5">
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-primary/40 p-4">
        <span>
          <span className="block font-semibold">Pause online ordering</span>
          <span className="text-sm text-muted-foreground">Customers can't place new orders. Existing orders stay here.</span>
        </span>
        <Switch checked={data.ordering_paused} onCheckedChange={(v) => update({ ordering_paused: v })} />
      </label>
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
        <span className="font-semibold">Pickup orders enabled</span>
        <Switch checked={data.pickup_enabled} onCheckedChange={(v) => update({ pickup_enabled: v })} />
      </label>
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
        <span>
          <span className="block font-semibold">Delivery orders enabled</span>
          <span className="text-sm text-muted-foreground">Delivery only shows to customers once a service area and fee are saved.</span>
        </span>
        <Switch checked={data.delivery_enabled} onCheckedChange={(v) => update({ delivery_enabled: v })} />
      </label>
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <div>
          <Label htmlFor="s-area">Delivery service area</Label>
          <Input id="s-area" value={f.area} maxLength={300} onChange={(e) => setF({ ...f, area: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="s-fee">Delivery fee (enter 0 for free delivery)</Label>
          <Input id="s-fee" inputMode="decimal" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="s-msg">Message shown to customers on the Snack Bar page (optional)</Label>
          <Textarea id="s-msg" value={f.message} maxLength={500} onChange={(e) => setF({ ...f, message: e.target.value })} />
        </div>
        <Button
          onClick={() => {
            const fee = f.fee.trim() === "" ? null : parseDollarsToCents(f.fee);
            if (f.fee.trim() !== "" && fee === null) return toast.error("Enter a valid delivery fee.");
            void update({ delivery_area: f.area.trim() || null, delivery_fee_cents: fee, customer_message: f.message.trim() || null });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
