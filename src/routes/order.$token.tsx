import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { CENTRE } from "@/lib/site-data";
import { customerStatusMessage, formatCents, STATUS_LABEL, type Fulfillment, type OrderStatus } from "@/lib/food-order";

export const Route = createFileRoute("/order/$token")({
  head: () => ({
    meta: [
      { title: "Your Snack Bar Order | Vegreville Bowling Lanes" },
      { name: "description", content: "Check the status of your Vegreville Bowling Lanes snack bar order." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your Snack Bar Order | Vegreville Bowling Lanes" },
      { property: "og:description", content: "Order status for your snack bar order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderStatusPage,
});

interface PublicOrder {
  order_number: number;
  status: OrderStatus;
  fulfillment: Fulfillment;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  created_at: string;
  items: { name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[];
}

function OrderStatusPage() {
  const { token } = Route.useParams();
  const valid = /^[0-9a-f-]{36}$/i.test(token);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order-status", token],
    enabled: valid,
    refetchInterval: (q) => {
      const s = (q.state.data as PublicOrder | null)?.status;
      return s === "completed" || s === "declined" ? false : 15000;
    },
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_food_order_status", { p_token: token });
      if (error) throw error;
      return data as unknown as PublicOrder | null;
    },
  });

  return (
    <>
      <PageHeader eyebrow="Snack Bar" title="Your Order" />
      <Section title={data ? `Order #${data.order_number}` : "Order status"}>
        {!valid || (!isLoading && !data && !isError) ? (
          <p className="text-muted-foreground">We couldn't find that order. Please call {CENTRE.phone}.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading your order…</p>
        ) : isError || !data ? (
          <p className="text-muted-foreground">We couldn't load your order status. Please refresh or call us.</p>
        ) : (
          <div className="max-w-xl space-y-6">
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border p-5 ${data.status === "declined" ? "border-destructive/50 bg-destructive/10" : "border-primary/40 bg-primary/10"}`}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {STATUS_LABEL[data.status]} · {data.fulfillment === "pickup" ? "Pickup" : "Delivery"}
              </p>
              <p className="mt-2 text-lg">{customerStatusMessage(data.status, data.fulfillment, data.order_number)}</p>
              {data.status !== "completed" && data.status !== "declined" && (
                <p className="mt-2 text-sm text-muted-foreground">Keep this page open or bookmark it — it updates automatically.</p>
              )}
            </div>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {data.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-3 p-4">
                  <span>
                    {i.quantity} × {i.name}
                  </span>
                  <span className="font-semibold">{formatCents(i.line_total_cents)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1">
              {data.delivery_fee_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <dt>Delivery fee</dt>
                  <dd>{formatCents(data.delivery_fee_cents)}</dd>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <dt>Total (tax included)</dt>
                <dd>{formatCents(data.total_cents)}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">
              Questions? Call {CENTRE.phone}.{" "}
              <Link to="/menu" className="text-primary hover:underline">
                Back to the Snack Bar
              </Link>
            </p>
          </div>
        )}
      </Section>
    </>
  );
}
