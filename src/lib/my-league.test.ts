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

// Database security checks: run inside a transaction that is always rolled back (no data changes).
const db = !!process.env["PGHOST"];
function sql(body: string): string {
  return execFileSync("psql", ["-At", "-v", "ON_ERROR_STOP=0", "-c", `BEGIN; ${body} ROLLBACK;`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}
function asUser(uid: string | null, q: string) {
  const claims = uid ? `set local request.jwt.claims = '{"sub":"${uid}","role":"authenticated"}'; set local role authenticated;` : `set local role anon;`;
  return claims + q;
}
const U1 = "00000000-0000-4000-8000-0000000000a1";
const U2 = "00000000-0000-4000-8000-0000000000a2";
// Temporarily link two bowlers with completed League Management scores to test users (rolled back).
const link = `
  update bowlers set user_id='${U1}' where id=(select bowler_id from lm_night_scores s join lm_league_nights n on n.id=s.night_id where n.status='completed' order by s.bowler_id limit 1);
  update bowlers set user_id='${U2}' where id=(select bowler_id from lm_night_scores s join lm_league_nights n on n.id=s.night_id where n.status='completed' order by s.bowler_id desc limit 1);`;

describe.skipIf(!db)("bowler access rules (database)", () => {
  it("a bowler sees only their own completed results", () => {
    const out = sql(link + asUser(U1, `select count(*), count(distinct night_id) from my_lm_scores(); select count(*) from my_lm_scores() s where s.score is null;`) + " reset role;" +
      `select count(*) from lm_night_scores s join bowlers b on b.id=s.bowler_id where b.user_id='${U1}';`);
    const lines = out.trim().split("\n").filter((l) => /^\d/.test(l));
    const [mine, own] = [Number(lines[0]!.split("|")[0]), Number(lines[2])];
    expect(mine).toBeGreaterThan(0);
    expect(mine).toBe(own); // exactly their rows, never another bowler's
  });

  it("other bowler's rows are not returned", () => {
    const out = sql(link + asUser(U1, `select count(*) from my_lm_scores() s where s.team_name is not null and exists (select 1) ;`) + " reset role;" +
      `select count(*) from lm_night_scores s join bowlers b on b.id=s.bowler_id where b.user_id='${U2}';`);
    expect(out).toMatch(/\d/);
    const out2 = sql(link + asUser(U2, `select count(*) from my_lm_scores();`));
    const out1 = sql(link + asUser(U1, `select count(*) from my_lm_scores();`));
    expect(out1).not.toBe("");
    expect(out2).not.toBe("");
  });

  it("bowler cannot read lm tables directly", () => {
    const out = sql(link + asUser(U1, `select count(*) from lm_night_scores; select count(*) from lm_league_rules; select count(*) from bowlers;`));
    const nums = out.trim().split("\n").filter((l) => /^\d+$/.test(l)).map(Number);
    expect(nums.slice(0, 2)).toEqual([0, 0]); // RLS hides everything
    expect(nums[2]).toBe(1); // only their own bowler record
  });

  it("bowler cannot change scores or rules", () => {
    const out = sql(link + asUser(U1, `with u as (update lm_night_scores set score=0 returning 1) select count(*) from u; with r as (update lm_league_rules set game_points=99 returning 1) select count(*) from r; with n as (update lm_league_nights set status='open' returning 1) select count(*) from n;`));
    expect(out.trim().split("\n").filter((l) => /^\d+$/.test(l)).map(Number)).toEqual([0, 0, 0]);
  });

  it("signed-out visitors cannot call the functions", () => {
    let err = "";
    try { sql(asUser(null, `select * from my_lm_scores();`)); } catch (e) { err = String((e as { stderr?: string }).stderr ?? e); }
    const out = (() => { try { return execFileSync("psql", ["-At", "-c", "BEGIN; set local role anon; select count(*) from my_lm_scores(); ROLLBACK;"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { return String((e as { stderr?: string }).stderr); } })();
    expect(out + err).toMatch(/permission denied/);
  });

  it("legacy scores are never mixed into League Management results", () => {
    const out = sql(link + asUser(U1, `select count(*) from my_lm_scores() m where not exists (select 1 from lm_night_scores s where s.night_id=m.night_id);`));
    expect(out.trim().split("\n").filter((l) => /^\d+$/.test(l))[0]).toBe("0");
  });
});
