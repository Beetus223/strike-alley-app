import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import type { BookingConfig, StaffSchedule } from "./reservations";
const publicClient = createServerOnlyFn(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Booking service is unavailable.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
});
export const getBookingConfig = createServerFn({ method: "GET" }).handler(async () => {
  const db = await publicClient();
  const { data, error } = await db.rpc("reservation_public_config");
  if (error) throw new Error("Booking settings could not be loaded. Please call the centre.");
  return data as unknown as BookingConfig;
});
export const getAvailableTimes = createServerFn({ method: "POST" })
  .inputValidator((input: { day: string; allocations: number[]; games: number }) => input)
  .handler(async ({ data }) => {
    const db = await publicClient();
    const result = await db.rpc("reservation_available", {
      p_day: data.day,
      p_alloc: data.allocations,
      p_games: data.games,
    });
    if (result.error)
      throw new Error("Availability could not be checked. Check your selections and try again.");
    return result.data as unknown as {
      slots: { time: string; available: number }[];
      duration: number;
      disabled?: boolean;
    };
  });
export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: Record<string, Json | undefined>) => input)
  .handler(async ({ data }) => {
    const db = await publicClient();
    const result = await db.rpc("submit_event_inquiry", { p: data as Json });
    if (result.error)
      throw new Error("Your inquiry could not be saved. Check your details and try again.");
    return result.data as unknown as { received: boolean };
  });
export const readStaffSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("reservation_staff", { p_action: "read" });
    if (error) throw new Error("Staff schedule could not be loaded.");
    return data as unknown as StaffSchedule;
  });
export const updateStaffSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: string; values: Json }) => input)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("reservation_staff", {
      p_action: data.action,
      p: data.values,
    });
    if (result.error) throw new Error(result.error.message);
    return { saved: true };
  });
export const saveStaffReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; values: Json }) => input)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("reservation_save", {
      p: data.values,
      ...(data.id ? { p_id: data.id } : {}),
    });
    if (result.error) throw new Error(result.error.message);
    return result.data as unknown as { received: boolean; status: string };
  });
export const saveStaffInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; values: Json }) => input)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("reservation_inquiry_save", {
      p: data.values,
      ...(data.id ? { p_id: data.id } : {}),
    });
    if (result.error) throw new Error(result.error.message);
    return { saved: true };
  });
