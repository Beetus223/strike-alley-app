import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EVENTS, HOURS, LEAGUES, PRICING } from "@/lib/site-data";

/**
 * Live site content. Every list below is stored in the database and editable by
 * staff from the dashboard; the bundled site-data values are only a fallback so
 * pages still render server-side before the live data arrives.
 */

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  schedule_text: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export type HoursItem = {
  id: string;
  day_of_week: number;
  day_label: string;
  open_hours: string;
  public_bowling: string | null;
  food_service: string | null;
  glow_bowling: string | null;
  note: string | null;
};

export type PricingItem = {
  id: string;
  label: string;
  price: string;
  note: string | null;
  category: string;
  is_active: boolean;
  sort_order: number;
};

export type LeagueItem = {
  id: string;
  slug: string;
  name: string;
  night: string;
  start_time: string;
  season: string;
  format: string;
  fee: string;
  description: string | null;
  spots: string | null;
  registration_open: boolean;
  is_active: boolean;
  sort_order: number;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  starts_on: string | null;
  ends_on: string | null;
};

const FALLBACK_EVENTS: EventItem[] = EVENTS.map((e, i) => ({
  id: e.title,
  title: e.title,
  description: e.blurb,
  category: e.tag,
  schedule_text: e.when,
  start_date: null,
  end_date: null,
  start_time: null,
  end_time: null,
  featured: true,
  is_active: true,
  sort_order: i + 1,
}));

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const FALLBACK_HOURS: HoursItem[] = HOURS.map((h) => ({
  id: h.day,
  day_of_week: DAY_INDEX[h.day] ?? 0,
  day_label: h.day,
  open_hours: h.open,
  public_bowling: h.publicBowling,
  food_service: h.food,
  glow_bowling: h.glow,
  note: h.note,
}));

const FALLBACK_PRICING: PricingItem[] = PRICING.map((p, i) => ({
  id: p.label,
  label: p.label,
  price: p.price,
  note: p.note,
  category: "Walk-in",
  is_active: true,
  sort_order: i + 1,
}));

const FALLBACK_LEAGUES: LeagueItem[] = LEAGUES.map((l, i) => ({
  id: l.slug,
  slug: l.slug,
  name: l.name,
  night: l.night,
  start_time: l.time,
  season: l.season,
  format: l.format,
  fee: l.fee,
  description: l.description,
  spots: l.spots,
  registration_open: true,
  is_active: true,
  sort_order: i + 1,
}));

/** Week order starting Monday, matching how the hours are displayed. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function useEvents(includeInactive = false) {
  return useQuery({
    queryKey: ["content", "events", includeInactive],
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("sort_order").order("title");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as EventItem[];
    },
    initialData: includeInactive ? undefined : FALLBACK_EVENTS,
  });
}

export function useHours() {
  return useQuery({
    queryKey: ["content", "hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hours_of_operation").select("*");
      if (error) throw error;
      const rows = data as HoursItem[];
      return [...rows].sort(
        (a, b) => WEEK_ORDER.indexOf(a.day_of_week) - WEEK_ORDER.indexOf(b.day_of_week),
      );
    },
    initialData: FALLBACK_HOURS,
  });
}

export function usePricing(includeInactive = false) {
  return useQuery({
    queryKey: ["content", "pricing", includeInactive],
    queryFn: async () => {
      let q = supabase.from("pricing_items").select("*").order("sort_order").order("label");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as PricingItem[];
    },
    initialData: includeInactive ? undefined : FALLBACK_PRICING,
  });
}

export function useLeagues(includeInactive = false) {
  return useQuery({
    queryKey: ["content", "leagues", includeInactive],
    queryFn: async () => {
      let q = supabase.from("leagues").select("*").order("sort_order").order("name");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as LeagueItem[];
    },
    initialData: includeInactive ? undefined : FALLBACK_LEAGUES,
  });
}

export function useAnnouncements(includeInactive = false) {
  return useQuery({
    queryKey: ["content", "announcements", includeInactive],
    queryFn: async () => {
      let q = supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data as AnnouncementItem[];
      if (includeInactive) return rows;
      const today = new Date().toISOString().slice(0, 10);
      return rows.filter(
        (a) => (!a.starts_on || a.starts_on <= today) && (!a.ends_on || a.ends_on >= today),
      );
    },
    initialData: includeInactive ? undefined : ([] as AnnouncementItem[]),
  });
}

/** Human-friendly "when" line for an event: free text wins, otherwise dates/times. */
export function formatWhen(e: {
  schedule_text?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}): string {
  if (e.schedule_text) return e.schedule_text;
  const day = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const time = (t: string) => {
    const [h, m] = t.split(":");
    const hour = Number(h);
    const suffix = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${m} ${suffix}`;
  };
  const parts: string[] = [];
  if (e.start_date)
    parts.push(
      e.end_date && e.end_date !== e.start_date
        ? `${day(e.start_date)} – ${day(e.end_date)}`
        : day(e.start_date),
    );
  if (e.start_time)
    parts.push(e.end_time ? `${time(e.start_time)} – ${time(e.end_time)}` : time(e.start_time));
  return parts.join(", ");
}
