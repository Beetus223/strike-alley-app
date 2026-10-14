import { describe, expect, it } from "vitest";
import { calcMatch, lineups, snapshotsFor, type MemberRef, type NightRef, type RawScore, type Rules, type BowlerInMatch } from "./lm-engine";

// Isolated in-memory data only — never touches the database.
const rules: Rules = { handicap_method: "difference_between_bowlers", handicap_percent: 80, handicap_base: null, points_with_handicap: true, game_points: 2, series_points: 2, team_points: 2 };
const match = { id: "m1", night_id: "n1", team_a_id: "TA", team_b_id: "TB", team_a_name: "A", team_b_name: "B" };
const names = new Map([["a1", "Ann"], ["b1", "Bob"]]);

function setup(divs: boolean, enteringA: number, status: "completed" | "scheduled", saved?: RawScore[]) {
  const members: MemberRef[] = [
    { team_id: "TA", bowler_id: "a1", division_code: divs ? "A" : null, entering_average: enteringA, is_active: true },
    { team_id: "TB", bowler_id: "b1", division_code: divs ? "A" : null, entering_average: 200, is_active: true },
  ];
  const night: NightRef = { id: "n1", night_date: "2026-10-01", status, week_number: 1 };
  const scores = saved ?? [1, 2].flatMap((g) => [
    { night_id: "n1", matchup_id: "m1", team_id: "TA", bowler_id: "a1", bowler_name: "Ann", team_name: "A", division_code: divs ? "A" : null, game_number: g, score: 150 },
    { night_id: "n1", matchup_id: "m1", team_id: "TB", bowler_id: "b1", bowler_name: "Bob", team_name: "B", division_code: divs ? "A" : null, game_number: g, score: 200 },
  ]);
  const { a, b } = lineups(match, night, members, scores, scores, [night], names, 2);
  return { night, scores, result: calcMatch(a, b, 2, rules) };
}

/** Simulates Score Entry's save: attach snapshots to every row. */
function save(divs: boolean) {
  const { scores, result } = setup(divs, 150, "scheduled");
  const snap = snapshotsFor(result);
  return scores.map((r) => ({ ...r, average_at_time: snap.get(r.bowler_id!)!.avg, handicap_at_time: snap.get(r.bowler_id!)!.hc }));
}

describe("snapshots", () => {
  it("team mode (no divisions) saves real averages and handicap", () => {
    const rows = save(false);
    const ann = rows.find((r) => r.bowler_id === "a1")!;
    expect(ann.average_at_time).toBe(150);
    expect(ann.handicap_at_time).toBe(40); // (200-150)*80%
    expect(rows.find((r) => r.bowler_id === "b1")!.handicap_at_time).toBe(0);
  });

  it("division mode still saves snapshots", () => {
    const ann = save(true).find((r) => r.bowler_id === "a1")!;
    expect(ann.average_at_time).toBe(150);
    expect(ann.handicap_at_time).toBe(40);
  });

  for (const divs of [true, false]) {
    it(`completed night keeps saved handicap after entering average edit (${divs ? "divisions" : "team"})`, () => {
      const saved = save(divs);
      const r = setup(divs, 190, "completed", saved).result; // average edited 150 -> 190
      const hc = divs ? r.divisions[0]!.hc : r.teamHc!;
      expect(hc.a).toBe(40);
      expect([r.pointsA, r.pointsB]).toEqual([0, 8]); // 150+40=190 < 200 every game
    });

    it(`future night uses updated entering average (${divs ? "divisions" : "team"})`, () => {
      const r = setup(divs, 190, "scheduled").result;
      const hc = divs ? r.divisions[0]!.hc : r.teamHc!;
      expect(hc.a).toBe(8); // (200-190)*80%
    });
  }

  it("repeated calculation of a completed night does not change saved snapshots", () => {
    const saved = save(false);
    const copy = JSON.parse(JSON.stringify(saved));
    for (let i = 0; i < 3; i++) setup(false, 100 + i * 50, "completed", saved);
    expect(saved).toEqual(copy);
  });
});

describe("existing scoring math unchanged", () => {
  const p = (games: number[], avg: number | null = 200): BowlerInMatch => ({ bowler_id: Math.random().toString(), name: "x", division: null, average: avg, games });
  it("game, series, team points and ties", () => {
    const r = calcMatch([p([200, 180])], [p([190, 180])], 2, { ...rules, handicap_method: "none" });
    expect(r.breakdown.games).toEqual([[2, 0], [1, 1]]);
    expect(r.breakdown.series).toEqual([2, 0]);
    expect(r.breakdown.team).toEqual([2, 0]);
    expect(r.pointsA).toBe(7);
    expect(r.pointsB).toBe(1);
  });
  it("percent-of-base handicap floors", () => {
    const r = calcMatch([p([100], 151)], [p([100], 199)], 1, { ...rules, handicap_method: "percent_of_base", handicap_base: 250 });
    expect([r.teamHc!.a, r.teamHc!.b]).toEqual([79, 40]);
  });
});
