/**
 * League Management calculation engine. Pure functions only: everything is derived
 * from RAW scratch scores + the league's own rules. Nothing is stored.
 */

export type Rules = {
  handicap_method: string; // not_configured | difference_between_bowlers | percent_of_base | none
  handicap_percent: number | null;
  handicap_base: number | null;
  points_with_handicap: boolean;
  game_points: number | null;
  series_points: number | null;
  team_points: number | null;
};

export type RawScore = {
  night_id: string;
  matchup_id: string | null;
  team_id: string | null;
  bowler_id: string | null;
  bowler_name: string | null;
  team_name: string | null;
  division_code: string | null;
  game_number: number;
  score: number;
  /** Snapshot saved when the night was scored. Used for completed nights so history never changes. */
  average_at_time?: number | null;
  handicap_at_time?: number | null;
};

export type NightRef = { id: string; night_date: string; status: string; week_number: number | null };
export type MatchRef = { id: string; night_id: string; team_a_id: string | null; team_b_id: string | null; team_a_name: string | null; team_b_name: string | null };

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Average from every game bowled in this league BEFORE the given date; falls back to entering average. */
export function averageBefore(
  bowlerId: string,
  date: string,
  scores: RawScore[],
  nights: NightRef[],
  entering: number | null,
): number | null {
  const dateOf = new Map(nights.map((n) => [n.id, n.night_date]));
  const g = scores.filter((s) => s.bowler_id === bowlerId && (dateOf.get(s.night_id) ?? "") < date).map((s) => s.score);
  if (g.length) return sum(g) / g.length;
  return entering;
}

export type HandicapCalc = { a: number; b: number; explain: string };

export function handicapPair(avgA: number | null, avgB: number | null, r: Rules | null): HandicapCalc {
  if (!r || r.handicap_method === "none" || r.handicap_method === "not_configured" || r.handicap_percent == null)
    return { a: 0, b: 0, explain: "No handicap (rules not configured or scratch league)" };
  if (avgA == null || avgB == null) return { a: 0, b: 0, explain: "No handicap — an average is missing" };
  const a = Math.floor(avgA), b = Math.floor(avgB), pct = r.handicap_percent;
  if (r.handicap_method === "percent_of_base") {
    if (r.handicap_base == null) return { a: 0, b: 0, explain: "Handicap base not set" };
    const ha = Math.max(0, Math.floor(((r.handicap_base - a) * pct) / 100));
    const hb = Math.max(0, Math.floor(((r.handicap_base - b) * pct) / 100));
    return { a: ha, b: hb, explain: `(${r.handicap_base} − avg) × ${pct}%: ${ha} / ${hb}` };
  }
  const diff = Math.abs(a - b);
  const hc = Math.floor((diff * pct) / 100);
  return {
    a: a < b ? hc : 0,
    b: b < a ? hc : 0,
    explain: `Averages ${a} vs ${b} → difference ${diff} × ${pct}% = ${hc} per game to the lower average`,
  };
}

export type BowlerInMatch = {
  bowler_id: string; name: string; division: string | null; average: number | null; games: (number | null)[];
  /** Saved per-game handicap from a completed night (team mode: the team's per-game handicap). */
  savedHc?: number | null;
  /** True when this completed night has no saved snapshot for this bowler and live values were used. */
  missingSnapshot?: boolean;
};

const savedPair = (a: BowlerInMatch | null | undefined, b: BowlerInMatch | null | undefined): HandicapCalc | null =>
  a?.savedHc != null && b?.savedHc != null ? { a: a.savedHc, b: b.savedHc, explain: `Saved handicap from this completed night: ${a.savedHc} / ${b.savedHc}` } : null;

export type DivisionResult = {
  division: string;
  a: BowlerInMatch | null;
  b: BowlerInMatch | null;
  hc: HandicapCalc;
  gamePts: [number, number][];
  seriesPts: [number, number];
  seriesA: number; seriesB: number; // with handicap if points use handicap
};

export type MatchResult = {
  divisions: DivisionResult[];
  teamTotalA: number; teamTotalB: number; // scratch
  teamHdcpA: number; teamHdcpB: number;
  teamPts: [number, number];
  pointsA: number; pointsB: number;
  /** "division" = Division A vs A etc.; "team" = no divisions assigned, team-vs-team per game. */
  mode: "division" | "team";
  /** Full points breakdown, always summing to pointsA/pointsB. */
  breakdown: { games: [number, number][]; series: [number, number]; team: [number, number] };
  /** Team-mode only: per-game team totals (with handicap when rules say so) and team handicap per game. */
  teamGames: { a: number | null; b: number | null }[];
  teamHc: HandicapCalc | null;
  warnings: string[];
  bowlersA: BowlerInMatch[]; bowlersB: BowlerInMatch[];
};

const share = (x: number, y: number, pts: number): [number, number] =>
  x > y ? [pts, 0] : x < y ? [0, pts] : [pts / 2, pts / 2];

/**
 * Division A bowls Division A, etc. If NO bowler in the matchup has a division, the match is scored
 * team-vs-team: each game compares team game totals, series compares team series totals, and team points
 * are awarded separately. Every configured category (game, series, team) is always calculated.
 */
export function calcMatch(teamA: BowlerInMatch[], teamB: BowlerInMatch[], gpn: number, r: Rules | null): MatchResult {
  const warnings: string[] = [];
  if (!r) warnings.push("League Rules are not saved for this league — no points can be awarded.");
  const useH = !!r?.points_with_handicap;
  const gp = r?.game_points ?? 0, sp = r?.series_points ?? 0, tp = r?.team_points ?? 0;
  if (r && r.game_points == null) warnings.push("Points per game is not set in League Rules.");
  if (r && r.series_points == null) warnings.push("Series points are not set in League Rules.");
  if (r && r.team_points == null) warnings.push("Team/match points are not set in League Rules.");
  if (!teamA.length || !teamB.length) warnings.push("One side of this matchup has no bowlers.");
  const codes = [...new Set([...teamA, ...teamB].map((x) => x.division).filter((x): x is string => !!x))].sort();
  const g = (x: BowlerInMatch | null, i: number) => x?.games[i] ?? null;
  const hcpOn = !!r && r.handicap_method !== "none" && r.handicap_method !== "not_configured";
  const games: [number, number][] = Array.from({ length: gpn }, () => [0, 0]);
  let series: [number, number] = [0, 0];
  let hA = 0, hB = 0;
  let divisions: DivisionResult[] = [];
  let teamGames: { a: number | null; b: number | null }[] = [];
  let teamHc: HandicapCalc | null = null;
  const mode: "division" | "team" = codes.length ? "division" : "team";

  if (mode === "division") {
    const noDiv = [...teamA, ...teamB].filter((x) => !x.division);
    if (noDiv.length) warnings.push(`${noDiv.map((x) => x.name).join(", ")} ha${noDiv.length > 1 ? "ve" : "s"} no division — counted in team totals only.`);
    divisions = codes.map((code) => {
      const a = teamA.find((x) => x.division === code) ?? null;
      const b = teamB.find((x) => x.division === code) ?? null;
      if (!a || !b) warnings.push(`Division ${code}: ${!a ? "first" : "second"} team has no bowler — no points for this division.`);
      if (hcpOn && a && b && (a.average == null || b.average == null)) warnings.push(`Division ${code}: average not established — handicap is 0.`);
      const hc = savedPair(a, b) ?? handicapPair(a?.average ?? null, b?.average ?? null, r);
      const gamePts: [number, number][] = [];
      let sA = 0, sB = 0;
      for (let i = 0; i < gpn; i++) {
        const ga = g(a, i), gb = g(b, i);
        if (ga != null) hA += hc.a;
        if (gb != null) hB += hc.b;
        if (ga == null || gb == null) { gamePts.push([0, 0]); continue; }
        const xa = ga + (useH ? hc.a : 0), xb = gb + (useH ? hc.b : 0);
        sA += xa; sB += xb;
        const p = share(xa, xb, gp);
        gamePts.push(p);
        games[i] = [games[i]![0] + p[0], games[i]![1] + p[1]];
      }
      const complete = a && b && a.games.slice(0, gpn).every((v) => v != null) && b.games.slice(0, gpn).every((v) => v != null);
      const seriesPts: [number, number] = complete ? share(sA, sB, sp) : [0, 0];
      series = [series[0] + seriesPts[0], series[1] + seriesPts[1]];
      return { division: code, a, b, hc, gamePts, seriesPts, seriesA: sA, seriesB: sB };
    });
  } else {
    // Team-vs-team: handicap = configured % of the difference between the teams' established averages.
    const teamAvg = (t: BowlerInMatch[]) => (t.length && t.every((x) => x.average != null) ? sum(t.map((x) => Math.floor(x.average!))) : null);
    const avgA = teamAvg(teamA), avgB = teamAvg(teamB);
    if (hcpOn && (avgA == null || avgB == null)) warnings.push("Averages not established for every bowler — handicap is 0 (not established).");
    const sa = teamA.find((x) => x.savedHc != null), sb = teamB.find((x) => x.savedHc != null);
    teamHc = savedPair(sa, sb) ?? handicapPair(avgA, avgB, r);
    let sA = 0, sB = 0, completeA = true, completeB = true;
    for (let i = 0; i < gpn; i++) {
      const ra = teamA.map((x) => g(x, i)).filter((v): v is number => v != null);
      const rb = teamB.map((x) => g(x, i)).filter((v): v is number => v != null);
      if (ra.length < teamA.length) completeA = false;
      if (rb.length < teamB.length) completeB = false;
      if (ra.length) hA += teamHc.a;
      if (rb.length) hB += teamHc.b;
      if (!ra.length || !rb.length) { teamGames.push({ a: ra.length ? sum(ra) : null, b: rb.length ? sum(rb) : null }); continue; }
      const xa = sum(ra) + (useH ? teamHc.a : 0), xb = sum(rb) + (useH ? teamHc.b : 0);
      teamGames.push({ a: xa, b: xb });
      sA += xa; sB += xb;
      games[i] = share(xa, xb, gp);
    }
    if (!completeA || !completeB) warnings.push("Some games are missing — incomplete games and the series are not scored.");
    series = completeA && completeB && teamA.length && teamB.length ? share(sA, sB, sp) : [0, 0];
  }

  const missing = [...teamA, ...teamB].filter((x) => x.missingSnapshot && x.games.some((v) => v != null));
  if (missing.length) warnings.push(`No saved average snapshot for ${missing.map((x) => x.name).join(", ")} on this completed night — current values shown.`);
  const tot = (t: BowlerInMatch[]) => sum(t.flatMap((x) => x.games.filter((v): v is number => v != null)));
  const teamTotalA = tot(teamA), teamTotalB = tot(teamB);
  const teamHdcpA = teamTotalA + hA, teamHdcpB = teamTotalB + hB;
  const bowled = teamTotalA > 0 && teamTotalB > 0;
  const teamPts: [number, number] = bowled ? (useH ? share(teamHdcpA, teamHdcpB, tp) : share(teamTotalA, teamTotalB, tp)) : [0, 0];
  const pointsA = sum(games.map((p) => p[0])) + series[0] + teamPts[0];
  const pointsB = sum(games.map((p) => p[1])) + series[1] + teamPts[1];
  return { divisions, teamTotalA, teamTotalB, teamHdcpA, teamHdcpB, teamPts, pointsA, pointsB, mode, breakdown: { games, series, team: teamPts }, teamGames, teamHc, warnings, bowlersA: teamA, bowlersB: teamB };
}

export type MemberRef = { team_id: string; bowler_id: string; division_code: string | null; entering_average: number | null; is_active: boolean };

/** Build the two team line-ups for one matchup on one night from saved/draft raw scores. */
export function lineups(
  match: MatchRef,
  night: NightRef,
  members: MemberRef[],
  scores: RawScore[],
  allScores: RawScore[],
  nights: NightRef[],
  names: Map<string, string>,
  gpn: number,
  /** true = ignore saved snapshots and recalculate from current averages (explicit staff action only). */
  recalculate = false,
) {
  const side = (teamId: string | null): BowlerInMatch[] => {
    if (!teamId) return [];
    const ids = new Set(members.filter((m) => m.team_id === teamId && m.is_active).map((m) => m.bowler_id));
    for (const s of scores) if (s.team_id === teamId && s.bowler_id) ids.add(s.bowler_id);
    return [...ids].map((bid) => {
      const m = members.find((x) => x.bowler_id === bid && x.team_id === teamId);
      const mine = scores.filter((s) => s.bowler_id === bid && s.night_id === night.id);
      // Saved snapshots are kept by default (completed AND reopened nights); only an explicit recalculation ignores them.
      const snap = recalculate ? undefined : mine.find((s) => s.average_at_time != null);
      const live = averageBefore(bid, night.night_date, allScores, nights, m?.entering_average ?? null);
      return {
        bowler_id: bid,
        name: names.get(bid) ?? mine[0]?.bowler_name ?? "—",
        division: mine[0]?.division_code ?? m?.division_code ?? null,
        average: snap ? Number(snap.average_at_time) : live,
        savedHc: snap ? (snap.handicap_at_time ?? 0) : null,
        missingSnapshot: night.status === "completed" && mine.length > 0 && !snap,
        games: Array.from({ length: gpn }, (_, i) => mine.find((s) => s.game_number === i + 1)?.score ?? null),
      };
    });
  };
  return { a: side(match.team_a_id), b: side(match.team_b_id) };
}

/** Average + per-game handicap to save on each bowler's score rows, for BOTH division and team mode. */
export function snapshotsFor(result: MatchResult): Map<string, { avg: number | null; hc: number }> {
  const out = new Map<string, { avg: number | null; hc: number }>();
  const put = (x: BowlerInMatch, hc: number) => out.set(x.bowler_id, { avg: x.average == null ? null : Math.floor(x.average), hc });
  if (result.mode === "team") {
    for (const x of result.bowlersA) put(x, result.teamHc?.a ?? 0);
    for (const x of result.bowlersB) put(x, result.teamHc?.b ?? 0);
  } else {
    for (const x of [...result.bowlersA, ...result.bowlersB]) put(x, 0); // no-division bowlers: average only
    for (const d of result.divisions) { if (d.a) put(d.a, d.hc.a); if (d.b) put(d.b, d.hc.b); }
  }
  return out;
}

export type BowlerStats = {
  bowler_id: string; name: string; team: string | null; division: string | null;
  games: number; pins: number; average: number | null; highGame: number | null; highSeries: number | null; highBlock: number | null;
};

export function bowlerStats(scores: RawScore[], gpn: number): BowlerStats[] {
  const by = new Map<string, RawScore[]>();
  for (const s of scores) if (s.bowler_id) by.set(s.bowler_id, [...(by.get(s.bowler_id) ?? []), s]);
  return [...by.entries()].map(([bid, rows]) => {
    const pins = sum(rows.map((r) => r.score));
    const nightsMap = new Map<string, number[]>();
    for (const r of rows) nightsMap.set(r.night_id, [...(nightsMap.get(r.night_id) ?? []), r.score]);
    const series = [...nightsMap.values()].filter((g) => g.length === gpn).map(sum);
    const last = rows[rows.length - 1]!;
    return {
      bowler_id: bid, name: last.bowler_name ?? "—", team: last.team_name, division: last.division_code,
      games: rows.length, pins, average: rows.length ? pins / rows.length : null,
      highGame: Math.max(...rows.map((r) => r.score)),
      highSeries: series.length ? Math.max(...series) : null,
      highBlock: gpn === 4 && series.length ? Math.max(...series) : null,
    };
  }).sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
}

export type StandingRow = {
  team_id: string; name: string; number: number | null;
  wins: number; losses: number; ties: number; pct: number | null; points: number; pins: number; pinsAgainst: number; games: number; average: number | null;
};

export type MatchOutcome = { night: NightRef; match: MatchRef; result: MatchResult };

export function standings(teams: { id: string; name: string; team_number: number | null }[], outcomes: MatchOutcome[], scores: RawScore[]): StandingRow[] {
  const rows = new Map<string, StandingRow>(teams.map((t) => [t.id, { team_id: t.id, name: t.name, number: t.team_number, wins: 0, losses: 0, ties: 0, pct: null, points: 0, pins: 0, pinsAgainst: 0, games: 0, average: null }]));
  for (const { match, result: r } of outcomes) {
    const A = match.team_a_id ? rows.get(match.team_a_id) : undefined;
    const B = match.team_b_id ? rows.get(match.team_b_id) : undefined;
    if (!A || !B || (r.teamTotalA === 0 && r.teamTotalB === 0)) continue;
    A.points += r.pointsA; B.points += r.pointsB;
    A.pins += r.teamTotalA; B.pins += r.teamTotalB;
    A.pinsAgainst += r.teamTotalB; B.pinsAgainst += r.teamTotalA;
    if (r.pointsA > r.pointsB) { A.wins++; B.losses++; } else if (r.pointsB > r.pointsA) { B.wins++; A.losses++; } else { A.ties++; B.ties++; }
  }
  for (const row of rows.values()) {
    row.games = scores.filter((s) => s.team_id === row.team_id).length;
    row.average = row.games ? row.pins / row.games : null;
    row.pct = row.wins + row.losses ? row.wins / (row.wins + row.losses) : null;
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.pins - a.pins);
}

export const f0 = (n: number | null | undefined) => (n == null ? "—" : String(Math.floor(n)));
export const fPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
