import { describe, it, expect } from "vitest";
import {
  allocate,
  estimate,
  DEFAULT_ESTIMATES,
  blockApplies,
  laneAvailability,
  type StaffSchedule,
} from "./reservations";
const c = { estimates: DEFAULT_ESTIMATES, use_upper: true, before_minutes: 0, after_minutes: 0 };
describe("reservation rules", () => {
  const availabilityData = {
    settings: { weekly: Array.from({ length: 7 }, () => [[600, 1200]]) },
    date_hours: [],
    blocks: [],
    reservations: [
      {
        starts_at: "2026-10-23T12:00:00",
        before_minutes: 0,
        after_minutes: 0,
        duration_minutes: 60,
        lanes: [1, 2],
        status: "confirmed",
      },
    ],
  } as unknown as StaffSchedule;
  it("two occupied lanes leave exactly four available", () =>
    expect(laneAvailability(availabilityData, "2026-10-23", "12:30").free).toEqual([3, 4, 5, 6]));
  it("all six occupied lanes leave no availability", () =>
    expect(
      laneAvailability(
        {
          ...availabilityData,
          reservations: [{ ...availabilityData.reservations[0], lanes: [1, 2, 3, 4, 5, 6] }],
        } as StaffSchedule,
        "2026-10-23",
        "12:30",
      ).free,
    ).toEqual([]));
  it("cancelled bookings release lanes in the schedule", () =>
    expect(
      laneAvailability(
        {
          ...availabilityData,
          reservations: availabilityData.reservations.map((r) => ({ ...r, status: "cancelled" })),
        },
        "2026-10-23",
        "12:30",
      ).free,
    ).toEqual([1, 2, 3, 4, 5, 6]));
  it("special-date closure has no available lanes", () =>
    expect(
      laneAvailability(
        { ...availabilityData, date_hours: [{ day: "2026-10-23", windows: [], note: "Closed" }] },
        "2026-10-23",
        "12:30",
      ),
    ).toEqual({ closed: true, free: [] }));
  const expected = [
    [15, 20],
    [20, 30],
    [25, 35],
    [30, 40],
    [35, 50],
    [40, 60],
  ];
  expected.forEach(([min, max], i) =>
    it(`${i + 1} bowlers: exact provisional ranges for 1–5 games`, () => {
      for (let games = 1; games <= 5; games++) {
        expect(estimate([i + 1], games, c)).toEqual({
          min: (min ?? 0) * games,
          max: (max ?? 0) * games,
          duration: (max ?? 0) * games,
          occupied: (max ?? 0) * games,
        });
      }
    }),
  );
  it("one person three games is 45–60 minutes", () =>
    expect(estimate([1], 3, c).duration).toBe(60));
  it("six people three games is 120–180 minutes", () =>
    expect(estimate([6], 3, c).duration).toBe(180));
  it("uses longest uneven lane, not lane count", () =>
    expect(estimate([2, 6], 3, c).duration).toBe(180));
  it("balances eight people across two lanes", () => expect(allocate(8, 2)).toEqual([4, 4]));
  it("allows exactly six lanes with six people each", () =>
    expect(allocate(36, 6)).toEqual([6, 6, 6, 6, 6, 6]));
  it("rejects a seventh lane", () => expect(() => allocate(7, 7)).toThrow());
  it("rejects more than six people per lane", () => expect(() => allocate(7, 1)).toThrow());
  it("requires at least one person per lane", () => expect(() => allocate(1, 2)).toThrow());
  it("adds configured setup and cleanup buffers", () =>
    expect(estimate([1], 3, { ...c, before_minutes: 10, after_minutes: 15 }).occupied).toBe(85));
  it("can use the configured lower estimate", () =>
    expect(estimate([1], 3, { ...c, use_upper: false }).duration).toBe(45));
  it("recurring block respects weekday, range and exception", () => {
    const b = {
      id: "a",
      title: "league",
      lanes: [1],
      starts_on: "2026-10-01",
      ends_on: "2026-10-31",
      weekday: 5,
      start_minute: 600,
      end_minute: 700,
      exceptions: ["2026-10-23"],
      updated_at: "",
      updated_by: null,
    };
    expect(blockApplies(b, "2026-10-16")).toBe(true);
    expect(blockApplies(b, "2026-10-23")).toBe(false);
    expect(blockApplies(b, "2026-10-15")).toBe(false);
    expect(blockApplies(b, "2026-11-06")).toBe(false);
  });
});
