export type BookingConfig = {
  enabled: boolean;
  approval_required: boolean;
  games: number[];
  estimates: number[][];
  use_upper: boolean;
  before_minutes: number;
  after_minutes: number;
  step_minutes: number;
  advance_days: number;
  lead_minutes: number;
  weekly: number[][][];
  today?: string;
};
export type Reservation = {
  id: string;
  request_key: string;
  contact_name: string;
  email: string;
  phone: string;
  starts_at: string;
  duration_minutes: number;
  before_minutes: number;
  after_minutes: number;
  games: number;
  allocations: number[];
  lanes: number[];
  status: string;
  notes: string;
  staff_notes: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};
export type ScheduleBlock = {
  id: string;
  title: string;
  lanes: number[];
  starts_on: string;
  ends_on: string;
  weekday: number | null;
  start_minute: number;
  end_minute: number;
  exceptions: string[];
  updated_at: string;
  updated_by: string | null;
};
export type DateHours = { day: string; windows: number[][]; note: string };
export type EventInquiry = {
  id: string;
  booking_type: string;
  contact_name: string;
  phone: string;
  email: string;
  requested_date: string;
  requested_time: string;
  party_size: number;
  lanes: number;
  notes: string | null;
  follow_up_status: string;
  facility_requirements: string;
  lane_reservation_id: string | null;
  duration_minutes: number;
};
export const BOOKING_TYPES = [
  "Regular Bowling",
  "Birthday Party",
  "Group or Fundraiser",
  "Business or Corporate Event",
  "Private Rental",
  "Meeting Room",
  "Other Booking",
];
export function statusLabel(status: string) {
  return (
    (
      {
        pending: "Tentative",
        new: "Inquiry",
        inquiry: "Inquiry",
        tentative: "Tentative",
        confirmed: "Confirmed",
        declined: "Cancelled",
        cancelled: "Cancelled",
        completed: "Completed",
      } as Record<string, string>
    )[status] ?? status
  );
}
export type StaffSchedule = {
  inquiries: EventInquiry[];
  settings: BookingConfig;
  reservations: Reservation[];
  blocks: ScheduleBlock[];
  date_hours: DateHours[];
  audit: {
    reservation_id: string | null;
    action: string;
    actor_id: string | null;
    occurred_at: string;
  }[];
};
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DEFAULT_ESTIMATES = [
  [15, 20],
  [20, 30],
  [25, 35],
  [30, 40],
  [35, 50],
  [40, 60],
];
export function allocate(bowlers: number, lanes: number): number[] {
  if (
    !Number.isInteger(bowlers) ||
    !Number.isInteger(lanes) ||
    lanes < 1 ||
    lanes > 6 ||
    bowlers < lanes ||
    bowlers > lanes * 6
  )
    throw new Error("Choose 1–6 lanes with 1–6 bowlers on each lane.");
  return Array.from(
    { length: lanes },
    (_, i) => Math.floor(bowlers / lanes) + (i < bowlers % lanes ? 1 : 0),
  );
}
export function estimate(
  allocations: number[],
  games: number,
  config: Pick<BookingConfig, "estimates" | "use_upper" | "before_minutes" | "after_minutes">,
) {
  if (
    !Number.isInteger(games) ||
    games < 1 ||
    !allocations.length ||
    allocations.length > 6 ||
    allocations.some((n) => !Number.isInteger(n) || n < 1 || n > 6)
  )
    throw new Error("Enter valid games and lane allocations.");
  const ranges = allocations.map((n) => config.estimates[n - 1]);
  if (ranges.some((r) => !r || r.length !== 2))
    throw new Error("Duration estimates are unavailable.");
  const min = Math.max(...ranges.map((r) => (r?.[0] ?? 0) * games));
  const max = Math.max(...ranges.map((r) => (r?.[1] ?? 0) * games));
  return {
    min,
    max,
    duration: config.use_upper ? max : min,
    occupied: (config.use_upper ? max : min) + config.before_minutes + config.after_minutes,
  };
}
export function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
export function clock(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
export function prettyTime(time: string) {
  const n = minutes(time);
  return `${Math.floor(n / 60) % 12 || 12}:${String(n % 60).padStart(2, "0")} ${n < 720 ? "AM" : "PM"}`;
}
export function localDay() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function blockApplies(b: ScheduleBlock, day: string) {
  return (
    day >= b.starts_on &&
    day <= b.ends_on &&
    (b.weekday === null || b.weekday === new Date(`${day}T12:00:00`).getDay()) &&
    !b.exceptions.includes(day)
  );
}
export function laneAvailability(
  data: Pick<StaffSchedule, "settings" | "date_hours" | "blocks" | "reservations">,
  day: string,
  time: string,
) {
  const minute = minutes(time);
  const windows =
    data.date_hours.find((h) => h.day === day)?.windows ??
    data.settings.weekly[new Date(`${day}T12:00:00`).getDay()] ??
    [];
  if (!windows.some((w) => minute >= (w[0] ?? 0) && minute < (w[1] ?? 0)))
    return { closed: true, free: [] as number[] };
  const selected = new Date(`${day}T${time}:00`).getTime();
  const unavailable = new Set<number>();
  for (const r of data.reservations) {
    if (!["pending", "confirmed"].includes(r.status)) continue;
    const start = new Date(r.starts_at).getTime();
    if (
      selected >= start - r.before_minutes * 60000 &&
      selected < start + (r.duration_minutes + r.after_minutes) * 60000
    )
      r.lanes.forEach((l) => unavailable.add(l));
  }
  for (const b of data.blocks)
    if (blockApplies(b, day) && minute >= b.start_minute && minute < b.end_minute)
      b.lanes.forEach((l) => unavailable.add(l));
  return { closed: false, free: [1, 2, 3, 4, 5, 6].filter((l) => !unavailable.has(l)) };
}
