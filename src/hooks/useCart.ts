import { useCallback, useEffect, useState } from "react";
import { clampQty, type CartLine } from "@/lib/food-order";

// The cart only lives in the browser until checkout; orders themselves are saved in the database.
const KEY = "vbl-snack-cart-v1";
const listeners = new Set<(l: CartLine[]) => void>();

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  listeners.forEach((fn) => fn(lines));
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    setLines(read());
    listeners.add(setLines);
    return () => {
      listeners.delete(setLines);
    };
  }, []);

  const add = useCallback((item: Omit<CartLine, "quantity">) => {
    const cur = read();
    const ex = cur.find((l) => l.menuItemId === item.menuItemId);
    write(
      ex
        ? cur.map((l) => (l.menuItemId === item.menuItemId ? { ...l, quantity: clampQty(l.quantity + 1) } : l))
        : [...cur, { ...item, quantity: 1 }],
    );
  }, []);

  const setQty = useCallback((id: string, q: number) => {
    const n = clampQty(q);
    const cur = read();
    write(n === 0 ? cur.filter((l) => l.menuItemId !== id) : cur.map((l) => (l.menuItemId === id ? { ...l, quantity: n } : l)));
  }, []);

  const remove = useCallback((id: string) => write(read().filter((l) => l.menuItemId !== id)), []);
  const clear = useCallback(() => write([]), []);
  /** Refresh names/prices from the live menu; drop items that are gone. */
  const sync = useCallback((menu: { id: string; name: string; price_cents: number }[]) => {
    const cur = read();
    const next = cur
      .map((l) => {
        const m = menu.find((x) => x.id === l.menuItemId);
        return m ? { ...l, name: m.name, priceCents: m.price_cents } : null;
      })
      .filter(Boolean) as CartLine[];
    if (JSON.stringify(next) !== JSON.stringify(cur)) write(next);
  }, []);

  return { lines, add, setQty, remove, clear, sync };
}
