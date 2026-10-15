import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MENU } from "@/lib/site-data";
import {
  cartTotals,
  deliveryAvailable,
  formatCents,
  validatePhone,
  validatePostal,
  type Fulfillment,
  type OrderingSettings,
} from "@/lib/food-order";

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

export const orderingSettingsQuery = {
  queryKey: ["ordering_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("ordering_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data as OrderingSettings | null;
  },
};

export function SnackBarMenu() {
  const { data: items, isLoading, isError } = useQuery(menuItemsQuery);
  const { data: settings } = useQuery(orderingSettingsQuery);
  const cart = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items) cart.sync(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const groups = useMemo(() => {
    const map = new Map<string, MenuItemRow[]>();
    (items ?? []).forEach((i) => map.set(i.category, [...(map.get(i.category) ?? []), i]));
    return [...map.entries()];
  }, [items]);

  const paused = !!settings?.ordering_paused;
  const canOrder = !!settings && !paused && (settings.pickup_enabled || deliveryAvailable(settings));
  const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
  const notes = Object.fromEntries(MENU.map((g) => [g.section, g.note]));

  if (isLoading) {
    return <p className="text-muted-foreground">Loading menu…</p>;
  }
  if (isError || !items) {
    return <p className="text-muted-foreground">The menu couldn't load. Please call us to order.</p>;
  }

  return (
    <>
      {(paused || settings?.customer_message || (settings && !canOrder)) && (
        <div role="status" className="mb-6 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
          {paused || !canOrder ? (
            <p className="font-semibold text-primary">Online ordering is paused right now. Please call us to order.</p>
          ) : null}
          {settings?.customer_message ? <p className="mt-1 text-foreground">{settings.customer_message}</p> : null}
        </div>
      )}

      <div className="grid gap-10 sm:grid-cols-2">
        {groups.map(([section, rows]) => (
          <div key={section}>
            <h2 className="text-2xl font-semibold text-primary sm:text-3xl">{section}</h2>
            {notes[section] ? (
              <p className="mt-2 max-w-md text-sm italic leading-relaxed text-muted-foreground">{notes[section]}</p>
            ) : null}
            <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-background/50">
              {rows.map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
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
                    <div className="mt-3">
                      {item.is_available ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canOrder}
                          onClick={() => cart.add({ menuItemId: item.id, name: item.name, priceCents: item.price_cents })}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          <Plus className="h-4 w-4" aria-hidden /> Add to Cart
                        </Button>
                      ) : (
                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Currently unavailable
                        </span>
                      )}
                    </div>
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
            <p className="mt-3 text-sm text-muted-foreground">Please call us to order a custom burger.</p>
          </div>
        ) : null}
      </div>

      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-14 rounded-full px-5 text-base shadow-lg"
        aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden />
        Cart
        <span className="ml-1 rounded-full bg-background px-2 py-0.5 text-sm font-bold text-foreground">{count}</span>
      </Button>

      <CartSheet open={open} onOpenChange={setOpen} settings={settings ?? null} canOrder={canOrder} />
    </>
  );
}

type Step = "cart" | "details" | "review";

function CartSheet({
  open,
  onOpenChange,
  settings,
  canOrder,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: OrderingSettings | null;
  canOrder: boolean;
}) {
  const cart = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("cart");
  const delivery = deliveryAvailable(settings);
  const pickup = !!settings?.pickup_enabled;
  const [f, setF] = useState({
    name: "",
    phone: "",
    fulfillment: (pickup ? "pickup" : "delivery") as Fulfillment,
    street: "",
    city: "",
    postal: "",
    deliveryNotes: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<"name" | "phone" | "fulfillment" | "street" | "city" | "postal", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("cart");
      setSubmitError(null);
    }
  }, [open]);

  const totals = cartTotals(cart.lines, f.fulfillment, settings);
  const set = (k: keyof typeof f, v: string) => {
    keyRef.current = null; // details changed: a new submission
    setF((p) => ({ ...p, [k]: v }));
  };

  function validate() {
    const e: typeof errors = {};
    if (f.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!validatePhone(f.phone)) e.phone = "Please enter a 10-digit phone number.";
    if (f.fulfillment === "delivery") {
      if (!delivery) e.fulfillment = "Delivery isn't available right now.";
      if (!f.street.trim()) e.street = "Please enter your street address.";
      if (!f.city.trim()) e.city = "Please enter your city or town.";
      if (!validatePostal(f.postal)) e.postal = "Please enter a valid postal code (e.g. T9C 1R8).";
    } else if (!pickup) e.fulfillment = "Pickup isn't available right now.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    const { data, error } = await supabase.rpc("place_food_order", {
      payload: {
        idempotency_key: keyRef.current,
        customer_name: f.name,
        phone: f.phone,
        fulfillment: f.fulfillment,
        street_address: f.fulfillment === "delivery" ? f.street : null,
        city: f.fulfillment === "delivery" ? f.city : null,
        postal_code: f.fulfillment === "delivery" ? f.postal : null,
        delivery_instructions: f.fulfillment === "delivery" ? f.deliveryNotes : null,
        special_instructions: f.notes,
        items: cart.lines.map((l) => ({ menu_item_id: l.menuItemId, quantity: l.quantity })),
      },
    });
    setSubmitting(false);
    if (error || !data) {
      setSubmitError(
        `Your order was not submitted. ${error?.message ?? "Please try again."} Your cart has been kept.`,
      );
      return;
    }
    const res = data as { token: string };
    cart.clear();
    keyRef.current = null;
    onOpenChange(false);
    void navigate({ to: "/order/$token", params: { token: res.token } });
  }

  const err = (k: keyof typeof errors) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1 text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {step === "cart" ? "Your Order" : step === "details" ? "Your Details" : "Review Your Order"}
          </SheetTitle>
          <SheetDescription>All prices include tax. Pay at the bowling alley.</SheetDescription>
        </SheetHeader>

        {step === "cart" && (
          <div className="mt-4 flex flex-1 flex-col">
            {cart.lines.length === 0 ? (
              <p className="text-muted-foreground">Your cart is empty. Add something tasty from the menu!</p>
            ) : (
              <ul className="divide-y divide-border">
                {cart.lines.map((l) => (
                  <li key={l.menuItemId} className="py-3">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{l.name}</p>
                      <p className="font-semibold">{formatCents(l.priceCents * l.quantity)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCents(l.priceCents)} each</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="icon" variant="outline" onClick={() => cart.setQty(l.menuItemId, l.quantity - 1)} aria-label={`Decrease ${l.name}`}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold" aria-live="polite">{l.quantity}</span>
                      <Button size="icon" variant="outline" onClick={() => cart.setQty(l.menuItemId, l.quantity + 1)} aria-label={`Increase ${l.name}`}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => cart.remove(l.menuItemId)} className="ml-auto" aria-label={`Remove ${l.name}`}>
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Totals totals={totals} delivery={false} />
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Back to menu
              </Button>
              <Button className="flex-1" disabled={!cart.lines.length || !canOrder} onClick={() => setStep("details")}>
                Checkout
              </Button>
            </div>
            {!canOrder && <p className="mt-2 text-sm text-primary">Online ordering is paused right now.</p>}
          </div>
        )}

        {step === "details" && (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (validate()) setStep("review");
            }}
            noValidate
          >
            <div>
              <Label htmlFor="o-name">Full name *</Label>
              <Input id="o-name" value={f.name} maxLength={100} autoComplete="name" onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby="name-err" />
              {err("name")}
            </div>
            <div>
              <Label htmlFor="o-phone">Phone number *</Label>
              <Input id="o-phone" type="tel" value={f.phone} maxLength={25} autoComplete="tel" onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby="phone-err" />
              {err("phone")}
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Pickup or delivery? *</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["pickup", "delivery"] as const).map((m) => {
                  const avail = m === "pickup" ? pickup : delivery;
                  return (
                    <button
                      type="button"
                      key={m}
                      disabled={!avail}
                      onClick={() => set("fulfillment", m)}
                      aria-pressed={f.fulfillment === m}
                      className={`rounded-xl border p-3 text-left text-sm transition disabled:opacity-50 ${f.fulfillment === m ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <span className="block font-semibold capitalize">{m}</span>
                      <span className="text-muted-foreground">
                        {!avail
                          ? "Not available right now"
                          : m === "delivery"
                            ? `Fee ${formatCents(settings?.delivery_fee_cents ?? 0)}`
                            : "Collect at the alley"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {err("fulfillment")}
              {f.fulfillment === "delivery" && settings?.delivery_area ? (
                <p className="mt-2 text-sm text-muted-foreground">Delivery area: {settings.delivery_area}</p>
              ) : null}
            </fieldset>
            {f.fulfillment === "delivery" && (
              <>
                <div>
                  <Label htmlFor="o-street">Street address *</Label>
                  <Input id="o-street" value={f.street} maxLength={200} autoComplete="street-address" onChange={(e) => set("street", e.target.value)} aria-invalid={!!errors.street} />
                  {err("street")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="o-city">City or town *</Label>
                    <Input id="o-city" value={f.city} maxLength={100} autoComplete="address-level2" onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city} />
                    {err("city")}
                  </div>
                  <div>
                    <Label htmlFor="o-postal">Postal code *</Label>
                    <Input id="o-postal" value={f.postal} maxLength={7} autoComplete="postal-code" onChange={(e) => set("postal", e.target.value.toUpperCase())} aria-invalid={!!errors.postal} />
                    {err("postal")}
                  </div>
                </div>
                <div>
                  <Label htmlFor="o-dnotes">Delivery instructions (optional)</Label>
                  <Textarea id="o-dnotes" value={f.deliveryNotes} maxLength={500} onChange={(e) => set("deliveryNotes", e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="o-notes">Special instructions (optional)</Label>
              <Textarea id="o-notes" value={f.notes} maxLength={500} placeholder="e.g. wing flavour, no onions" onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("cart")}>
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Review order
              </Button>
            </div>
          </form>
        )}

        {step === "review" && (
          <div className="mt-4 space-y-4">
            <ul className="divide-y divide-border rounded-xl border border-border">
              {cart.lines.map((l) => (
                <li key={l.menuItemId} className="flex justify-between gap-3 p-3 text-sm">
                  <span>
                    {l.quantity} × {l.name}
                  </span>
                  <span className="font-semibold">{formatCents(l.priceCents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-border p-3 text-sm">
              <p className="font-semibold uppercase tracking-wide text-primary">
                {f.fulfillment === "pickup" ? "Pickup order" : "Delivery order"}
              </p>
              <p className="mt-1">{f.name}</p>
              <p>{f.phone}</p>
              {f.fulfillment === "delivery" && (
                <p>
                  {f.street}, {f.city} {f.postal}
                  {f.deliveryNotes ? <span className="block text-muted-foreground">{f.deliveryNotes}</span> : null}
                </p>
              )}
              {f.notes ? <p className="mt-1 text-muted-foreground">Notes: {f.notes}</p> : null}
              {f.fulfillment === "pickup" && (
                <p className="mt-2 text-muted-foreground">The bowling alley will confirm your order and let you know when it's ready.</p>
              )}
            </div>
            <Totals totals={totals} delivery={f.fulfillment === "delivery"} />
            {submitError && (
              <p role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={submitting} onClick={() => setStep("details")}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting} onClick={placeOrder}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {submitting ? "Placing order…" : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Totals({
  totals,
  delivery,
}: {
  totals: { subtotalCents: number; deliveryFeeCents: number; totalCents: number };
  delivery: boolean;
}) {
  return (
    <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd>{formatCents(totals.subtotalCents)}</dd>
      </div>
      {delivery && (
        <div className="flex justify-between">
          <dt>Delivery fee</dt>
          <dd>{formatCents(totals.deliveryFeeCents)}</dd>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold">
        <dt>Total (tax included)</dt>
        <dd>{formatCents(delivery ? totals.totalCents : totals.subtotalCents)}</dd>
      </div>
    </dl>
  );
}
