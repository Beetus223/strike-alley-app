/** Bowler-dashboard view of League Management data. Pure functions over the bowler's own completed games. */

export type MyLmScore = {
  league_id: string; league_name: string; night_id: string; night_date: string; week_number: number | null;
  team_name: string | null; game_number: number; score: number; average_at_time: number | null; handicap_at_time: number | null;
};
export type MyLmMembership = {
  league_id: string; league_name: string; season: string | null; handicap_method: string | null;
  handicap_percent: number | null; handicap_base: number | null; games_per_night: number;
  team_name: string | null; entering_average: number | null; is_active: boolean;
};

export type MyNight = {
  night_id: string; league_id: string; league_name: string; date: string; week: number | null; team: string | null;
  games: { game_number: number; score: number }[]; series: number;
  /** Saved at the time the night was scored — never recalculated. */
  average_at_time: number | null; handicap_at_time: number | null;
};

export function groupNights(scores: MyLmScore[]): MyNight[] {
  const by = new Map<string, MyNight>();
  for (const s of scores) {
    const n = by.get(s.night_id) ?? {
      night_id: s.night_id, league_id: s.league_id, league_name: s.league_name, date: s.night_date, week: s.week_number,
      team: s.team_name, games: [], series: 0, average_at_time: null, handicap_at_time: null,
    };
    n.games.push({ game_number: s.game_number, score: s.score });
    n.series += s.score;
    if (n.average_at_time == null && s.average_at_time != null) {
      n.average_at_time = Number(s.average_at_time);
      n.handicap_at_time = s.handicap_at_time;
    }
    by.set(s.night_id, n);
  }
  for (const n of by.values()) n.games.sort((a, b) => a.game_number - b.game_number);
  return [...by.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export type MyLeagueSummary = {
  league_id: string; league_name: string; season: string | null; team: string | null;
  games: number; pins: number;
  /** All completed games in this league; falls back to the entering average; null if neither exists. */
  average: number | null; averageSource: "games" | "entering" | null;
  highGame: number | null; highSeries: number | null;
  /** Only for leagues where a bowler's handicap doesn't depend on the opponent (percent of base). */
  handicap: number | null;
};

export function summarize(m: MyLmMembership, scores: MyLmScore[]): MyLeagueSummary {
  const mine = scores.filter((s) => s.league_id === m.league_id);
  const pins = mine.reduce((a, s) => a + s.score, 0);
  const entering = m.entering_average == null ? null : Number(m.entering_average);
  const average = mine.length ? pins / mine.length : entering;
  const nights = groupNights(mine).filter((n) => n.games.length === m.games_per_night);
  let handicap: number | null = null;
  if (m.handicap_method === "percent_of_base" && m.handicap_base != null && m.handicap_percent != null && average != null) {
    handicap = Math.max(0, Math.floor(((m.handicap_base - Math.floor(average)) * m.handicap_percent) / 100));
  }
  return {
    league_id: m.league_id, league_name: m.league_name, season: m.season, team: m.team_name,
    games: mine.length, pins, average, averageSource: mine.length ? "games" : entering != null ? "entering" : null,
    highGame: mine.length ? Math.max(...mine.map((s) => s.score)) : null,
    highSeries: nights.length ? Math.max(...nights.map((n) => n.series)) : null,
    handicap,
  };
}

/** One card per league even if the bowler is on several teams in it. */
export function uniqueLeagues(ms: MyLmMembership[]): MyLmMembership[] {
  const seen = new Map<string, MyLmMembership>();
  for (const m of ms) if (!seen.has(m.league_id) || (m.is_active && !seen.get(m.league_id)!.is_active)) seen.set(m.league_id, m);
  return [...seen.values()];
}

export const usesHandicap = (method: string | null) => !!method && method !== "none" && method !== "not_configured";
