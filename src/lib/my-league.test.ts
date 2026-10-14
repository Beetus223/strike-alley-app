import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { groupNights, summarize, uniqueLeagues, type MyLmMembership, type MyLmScore } from "./my-league";

const sc = (night: string, date: string, g: number, score: number, extra: Partial<MyLmScore> = {}): MyLmScore => ({
  league_id: "L", league_name: "Tue Mixed", night_id: night, night_date: date, week_number: 1, team_name: "Pinheads",
  game_number: g, score, average_at_time: 180, handicap_at_time: 12, ...extra,
});
const mem: MyLmMembership = { league_id: "L", league_name: "Tue Mixed", season: "2026-27", handicap_method: "difference_between_bowlers", handicap_percent: 80, handicap_base: null, games_per_night: 3, team_name: "Pinheads", entering_average: 175, is_active: true };

describe("bowler dashboard calculations", () => {
  const scores = [sc("n1", "2026-10-06", 1, 200), sc("n1", "2026-10-06", 2, 250), sc("n1", "2026-10-06", 3, 150), sc("n2", "2026-10-13", 1, 300, { average_at_time: 200, handicap_at_time: 0 })];

  it("groups games into one card per night, newest first, with series and saved snapshot", () => {
    const n = groupNights(scores);
    expect(n.map((x) => x.night_id)).toEqual(["n2", "n1"]);
    expect(n[1]!.games.map((g) => g.score)).toEqual([200, 250, 150]);
    expect(n[1]!.series).toBe(600);
    expect([n[1]!.average_at_time, n[1]!.handicap_at_time]).toEqual([180, 12]); // saved, not recalculated
  });

  it("current average is from every game; high game and full-night high series", () => {
    const s = summarize(mem, scores);
    expect(s.average).toBe(225); // 900 / 4
    expect(s.averageSource).toBe("games");
    expect(s.highGame).toBe(300);
    expect(s.highSeries).toBe(600); // n2 is incomplete, so not a series
    expect(s.handicap).toBeNull(); // opponent-dependent method: no single current handicap
  });

  it("percent-of-base shows current handicap", () => {
    expect(summarize({ ...mem, handicap_method: "percent_of_base", handicap_base: 250 }, scores).handicap).toBe(20); // (250-225)*80%
  });

  it("no results: entering average, no invented highs", () => {
    const s = summarize(mem, []);
    expect([s.average, s.averageSource, s.highGame, s.highSeries, s.games]).toEqual([175, "entering", null, null, 0]);
    expect(summarize({ ...mem, entering_average: null }, []).average).toBeNull();
  });

  it("one card per league even across two teams", () => {
    expect(uniqueLeagues([mem, { ...mem, team_name: "Other", is_active: false }])).toHaveLength(1);
  });
});

// Database security checks (read-only catalog queries; the sandbox connection can't impersonate users).
const db = !!process.env["PGHOST"];
const q = (sql: string) => execFileSync("psql", ["-At", "-c", sql], { encoding: "utf8" }).trim();

describe.skipIf(!db)("bowler access rules (database)", () => {
  for (const fn of ["my_lm_scores", "my_lm_memberships"]) {
    it(`${fn} only returns the signed-in bowler's own rows`, () => {
      const def = q(`select pg_get_functiondef('public.${fn}'::regproc)`);
      expect(def).toMatch(/b\.user_id = auth\.uid\(\)/); // matched by account link, never by name
      expect(def).toMatch(/auth\.uid\(\) IS NOT NULL/);
      expect(def).toMatch(/STABLE/); // read-only
    });
    it(`${fn} cannot be called by signed-out visitors`, () => {
      expect(q(`select has_function_privilege('anon', 'public.${fn}()', 'EXECUTE')`)).toBe("f");
      expect(q(`select has_function_privilege('authenticated', 'public.${fn}()', 'EXECUTE')`)).toBe("t");
    });
  }

  it("only completed nights are exposed to bowlers", () => {
    expect(q(`select pg_get_functiondef('public.my_lm_scores'::regproc)`)).toMatch(/status = 'completed'/);
  });

  it("every lm_* table stays staff-only for reads and writes", () => {
    const rows = q(`select tablename||'|'||cmd||'|'||qual from pg_policies where schemaname='public' and tablename like 'lm\\_%'`).split("\n");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r).toMatch(/\|ALL\|private\.is_staff\(auth\.uid\(\)\)$/);
  });

  it("bowlers cannot edit their own bowler record", () => {
    const own = q(`select cmd from pg_policies where tablename='bowlers' and qual like '%user_id = auth.uid()%'`);
    expect(own).toBe("SELECT");
  });
});
