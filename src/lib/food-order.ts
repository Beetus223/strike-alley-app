// Pure helpers for snack bar ordering. All money is integer cents; displayed
// menu prices already include tax, so no tax is ever added on top.

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "declined";

export type Fulfillment = "pickup" | "delivery";

export interface CartLine {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface OrderingSettings {
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_area: string | null;
  delivery_fee_cents: number | null;
  ordering_paused: boolean;
  customer_message: string | null;
}

export const MAX_QTY = 50;

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function parseDollarsToCents(input: string): number | null {
  const t = input.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(parseFloat(t) * 100);
}

export function deliveryAvailable(s: OrderingSettings | null | undefined): boolean {
  return !!s && s.delivery_enabled && s.delivery_fee_cents !== null && !!s.delivery_area?.trim();
}

export function cartTotals(lines: CartLine[], fulfillment: Fulfillment, settings: OrderingSettings | null) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
  const deliveryFeeCents =
    fulfillment === "delivery" && deliveryAvailable(settings) ? (settings!.delivery_fee_cents ?? 0) : 0;
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  return { subtotalCents, deliveryFeeCents, totalCents: subtotalCents + deliveryFeeCents, itemCount };
}

export function clampQty(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.max(0, Math.min(MAX_QTY, Math.round(q)));
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  declined: "Declined",
};

/** Mirrors the database status guard. */
export function nextStatuses(status: OrderStatus, fulfillment: Fulfillment): OrderStatus[] {
  switch (status) {
    case "pending":
      return ["confirmed", "declined"];
    case "confirmed":
      return ["preparing", "declined"];
    case "preparing":
      return [fulfillment === "pickup" ? "ready_for_pickup" : "out_for_delivery"];
    case "ready_for_pickup":
    case "out_for_delivery":
      return ["completed"];
    default:
      return [];
  }
}

export function customerStatusMessage(status: OrderStatus, fulfillment: Fulfillment, orderNumber: number): string {
  switch (status) {
    case "pending":
      return `Your order has been received! The bowling alley will review your order and confirm it shortly. Your order number is ${orderNumber}.`;
    case "confirmed":
    case "preparing":
      return fulfillment === "pickup"
        ? "Your order is confirmed! We're getting it ready for pickup. We'll let you know when it's ready. Thank you for ordering from Vegreville Bowling Lanes!"
        : "Your order is confirmed! We're preparing it for delivery. We'll update your order status when it's on the way.";
    case "ready_for_pickup":
      return "Your order is ready for pickup! Please come to Vegreville Bowling Lanes to collect it.";
    case "out_for_delivery":
      return "Your order is on its way! Thank you for ordering from Vegreville Bowling Lanes.";
    case "completed":
      return "Your order is complete. Thank you for ordering from Vegreville Bowling Lanes!";
    case "declined":
      return "Sorry, we can't fulfill your order at this time. Please contact Vegreville Bowling Lanes for assistance.";
  }
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11 && phone.length <= 25;
}

export function validatePostal(p: string): boolean {
  return /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(p.trim().toUpperCase());
}
