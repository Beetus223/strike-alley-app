import { describe, expect, it } from "vitest";
import { cartTotals, customerStatusMessage, deliveryAvailable, nextStatuses, parseDollarsToCents, type OrderingSettings } from "./food-order";

const base: OrderingSettings = {
  pickup_enabled: true,
  delivery_enabled: false,
  delivery_area: null,
  delivery_fee_cents: null,
  ordering_paused: false,
  customer_message: null,
};

describe("food ordering totals", () => {
  const lines = [
    { menuItemId: "a", name: "Wings", priceCents: 1475, quantity: 2 },
    { menuItemId: "b", name: "Hot Dog", priceCents: 500, quantity: 1 },
  ];

  it("adds no tax: total equals displayed price x quantity", () => {
    const t = cartTotals(lines, "pickup", base);
    expect(t.subtotalCents).toBe(3450);
    expect(t.totalCents).toBe(3450);
    expect(t.itemCount).toBe(3);
  });

  it("adds the configured delivery fee only when delivery is configured", () => {
    const s = { ...base, delivery_enabled: true, delivery_area: "Vegreville", delivery_fee_cents: 500 };
    expect(cartTotals(lines, "delivery", s).totalCents).toBe(3950);
    expect(cartTotals(lines, "pickup", s).totalCents).toBe(3450);
  });

  it("treats delivery as unavailable until area and fee are set", () => {
    expect(deliveryAvailable({ ...base, delivery_enabled: true })).toBe(false);
    expect(deliveryAvailable({ ...base, delivery_enabled: true, delivery_area: "Town", delivery_fee_cents: 0 })).toBe(true);
  });

  it("parses staff price input to cents", () => {
    expect(parseDollarsToCents("20.95")).toBe(2095);
    expect(parseDollarsToCents("$4.5")).toBe(450);
    expect(parseDollarsToCents("abc")).toBeNull();
  });
});

describe("order status", () => {
  it("only allows the defined transitions", () => {
    expect(nextStatuses("pending", "pickup")).toEqual(["confirmed", "declined"]);
    expect(nextStatuses("preparing", "pickup")).toEqual(["ready_for_pickup"]);
    expect(nextStatuses("preparing", "delivery")).toEqual(["out_for_delivery"]);
    expect(nextStatuses("completed", "pickup")).toEqual([]);
  });

  it("does not say confirmed while pending", () => {
    expect(customerStatusMessage("pending", "pickup", 1001)).toContain("Your order number is 1001");
    expect(customerStatusMessage("pending", "pickup", 1001)).not.toContain("confirmed!");
  });
});
