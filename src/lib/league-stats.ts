/**
 * League statistics engine. Pure, read-only functions: every number is derived
 * from the stored individual game scores plus the league's configured rules.
 * Nothing here writes to the database.
 */

export type LeagueSettings = {
  league_id: string;
  season_label: string | null;
  season_start: string | null;
  season_end: string | null;
  games_per_session: number;
  team_size: number | null;
  handicap_enabled: boolean;
  handicap_method: string; // not_configured | percent_of_difference
  handicap_base: number | null;
  handicap_percent: number | null;
  handicap_scope: string; // individual | team
  handicap_basis: string; // prior_average | current_average
  absent_rule: string; // not_configured | exclude | use_average | fixed
  absent_value: number | null;
  vacant_rule: string; // not_configured | exclude | fixed
  vacant_value: number | null;
  winloss_method: string; // not_configured | per_game_vs_opponent | manual
  winloss_use_handicap: boolean;
  series_point: boolean;
  tie_rule: string; // tie | none
  standings_rule: string; // win_pct | wins | pins | handicap_pins
  notes: string | null;
};

export const DEFAULT_SETTINGS = (league_id: string): LeagueSettings => ({
  league_id,
  season_label: null,
  season_start: null,
  season_end: null,
  games_per_session: 3,
  team_size: null,
  handicap_enabled: false,
  handicap_method: "not_configured",
  handicap_base: null,
  handicap_percent: null,
  handicap_scope: "individual",
  handicap_basis: "prior_average",
  absent_rule: "not_configured",
  absent_value: null,
  vacant_rule: "not_configured",
  vacant_value: null,
  winloss_method: "not_configured",
  winloss_use_handicap: false,
  series_point: false,
  tie_rule: "tie",
  standings_rule: "win_pct",
  notes: null,
});

export type Team = { id: string; name: string; team_number: number | null };
export type Player = {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string | null;
  is_active: boolean;
};
export type Score = { player_id: string; week_date: string; game_number: number; score: number };
export type Matchup = {
  team_id: string;
  opponent_team_id: string | null;
  manual_wins: number | null;
  manual_losses: number | null;
  manual_ties: number | null;
  session_date: string;
};

export const fullName = (p: Pick<Player, "first_name" | "last_name">) =>
  `${p.first_name} ${p.last_name}`.trim();

export function inSeason(date: string, s: LeagueSettings) {
  if (s.season_start && date < s.season_start) return false;
  if (s.season_end && date > s.season_end) return false;
  return true;
}

export function handicapConfigured(s: LeagueSettings) {
  return (
    s.handicap_enabled &&
    s.handicap_method === "percent_of_difference" &&
    s.handicap_base != null &&
    s.handicap_percent != null
  );
}

/** Handicap per game from an average, or null when rules are not configured. */
export function handicapFor(avg: number | null, s: LeagueSettings): number | null {
  if (!handicapConfigured(s) || avg == null) return null;
  return Math.max(0, Math.floor(((s.handicap_base! - avg) * s.handicap_percent!) / 100));
}

type Session = { date: string; games: Map<number, number> };

function sessionsFor(playerId: string, scores: Score[]) {
  const map = new Map<string, Session>();
  for (const sc of scores) {
    if (sc.player_id !== playerId) continue;
    const s = map.get(sc.week_date) ?? { date: sc.week_date, games: new Map() };
    s.games.set(sc.game_number, sc.score);
    map.set(sc.week_date, s);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export type BowlerLine = {
  player: Player;
  games: (number | null)[]; // this session, by game number
  sessionTotal: number;
  sessionGames: number;
  sessionAvg: number | null;
  priorAvg: number | null;
  handicap: number | null;
  seasonPins: number;
  seasonGames: number;
  seasonAvg: number | null;
  highGame: number | null;
  highSeries: number | null;
  absent: boolean;
};

export type Record = { label: string; name: string; team: string; score: number; date: string };

export type TeamLine = {
  team: Team;
  gameTotals: number[]; // scratch, this session
  hdcpGameTotals: number[] | null;
  sessionPins: number;
  seasonPins: number;
  seasonHdcpPins: number | null;
  seasonGames: number;
  average: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  winPct: number | null;
  highGame: number | null;
  highSeries: number | null;
};

export type LeagueReport = {
  gamesPerSession: number;
  bowlers: BowlerLine[];
  teams: TeamLine[];
  standings: TeamLine[];
  winLossConfigured: boolean;
  handicapConfigured: boolean;
  weeklyLeaders: Record[];
  seasonRecords: Record[];
  sessionDates: string[];
};

/**
 * Build the full report for one league / session date. Only season games on or
 * before `date` are included, so reports for past nights stay historically correct.
 */
export function buildReport(args: {
  date: string;
  settings: LeagueSettings;
  teams: Team[];
  players: Player[];
  scores: Score[];
  matchups: Matchup[];
}): LeagueReport {
  const { date, settings: s, teams, players, matchups } = args;
  const gps = s.games_per_session;
  const hdcpOn = handicapConfigured(s);
  const scores = args.scores.filter((x) => inSeason(x.week_date, s) && x.week_date <= date);
  const allDates = [...new Set(scores.map((x) => x.week_date))].sort();
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "—";

  // ---- per-bowler history
  const hist = new Map<string, Session[]>();
  for (const p of players) hist.set(p.id, sessionsFor(p.id, scores));

  const avgBefore = (pid: string, d: string, inclusive: boolean) => {
    const g = (hist.get(pid) ?? [])
      .filter((x) => (inclusive ? x.date <= d : x.date < d))
      .flatMap((x) => [...x.games.values()]);
    return g.length ? sum(g) / g.length : null;
  };
  const hdcpAvg = (pid: string, d: string) =>
    avgBefore(pid, d, s.handicap_basis === "current_average");

  const isSeries = (x: Session) => x.games.size === gps;

  const bowlers: BowlerLine[] = players.map((p) => {
    const h = hist.get(p.id) ?? [];
    const today = h.find((x) => x.date === date);
    const games = Array.from({ length: gps }, (_, i) => today?.games.get(i + 1) ?? null);
    const played = games.filter((g): g is number => g != null);
    const all = h.flatMap((x) => [...x.games.values()]);
    const series = h.filter(isSeries).map((x) => sum([...x.games.values()]));
    const prior = avgBefore(p.id, date, false);
    return {
      player: p,
      games,
      sessionTotal: sum(played),
      sessionGames: played.length,
      sessionAvg: played.length ? sum(played) / played.length : null,
      priorAvg: prior,
      handicap: handicapFor(hdcpAvg(p.id, date), s),
      seasonPins: sum(all),
      seasonGames: all.length,
      seasonAvg: all.length ? sum(all) / all.length : null,
      highGame: all.length ? Math.max(...all) : null,
      highSeries: series.length ? Math.max(...series) : null,
      absent: played.length === 0,
    };
  });

  // ---- team game totals for any date, applying absent/vacant rules
  const teamGames = (teamId: string, d: string, withHdcp: boolean) => {
    const roster = players.filter((p) => p.team_id === teamId && p.is_active);
    const totals = Array.from({ length: gps }, () => 0);
    let bowled = false;
    let slots = 0;
    for (const p of roster) {
      const sess = (hist.get(p.id) ?? []).find((x) => x.date === d);
      const hc = withHdcp ? (handicapFor(hdcpAvg(p.id, d), s) ?? 0) : 0;
      if (sess && sess.games.size) {
        bowled = true;
        slots += 1;
        for (let n = 1; n <= gps; n += 1) {
          const g = sess.games.get(n);
          if (g != null) totals[n - 1] = (totals[n - 1] ?? 0) + g + hc;
        }
      } else {
        let fill: number | null = null;
        if (s.absent_rule === "use_average") {
          const a = avgBefore(p.id, d, false);
          fill = a == null ? null : Math.floor(a);
        } else if (s.absent_rule === "fixed") fill = s.absent_value;
        if (fill != null) {
          slots += 1;
          for (let n = 0; n < gps; n += 1) totals[n] = (totals[n] ?? 0) + fill + hc;
        }
      }
    }
    if (s.vacant_rule === "fixed" && s.vacant_value != null && s.team_size) {
      const vacant = Math.max(0, s.team_size - roster.length);
      for (let n = 0; n < gps; n += 1) totals[n] = (totals[n] ?? 0) + vacant * s.vacant_value;
      slots += vacant;
    }
    return { totals, bowled, slots };
  };

  const winLossConfigured =
    s.winloss_method === "per_game_vs_opponent" || s.winloss_method === "manual";

  const teamLines: TeamLine[] = teams.map((t) => {
    const roster = players.filter((p) => p.team_id === t.id);
    const rosterIds = new Set(roster.map((p) => p.id));
    const teamScores = scores.filter((x) => rosterIds.has(x.player_id));
    const seasonPins = sum(teamScores.map((x) => x.score));
    let seasonHdcp: number | null = hdcpOn ? 0 : null;
    let highGame: number | null = null;
    let highSeries: number | null = null;
    let w = 0;
    let l = 0;
    let ti = 0;
    for (const d of allDates) {
      const scratch = teamGames(t.id, d, false);
      if (!scratch.bowled) continue;
      const series = sum(scratch.totals);
      highGame = Math.max(highGame ?? 0, ...scratch.totals);
      highSeries = Math.max(highSeries ?? 0, series);
      if (hdcpOn) {
        const hc = teamGames(t.id, d, true);
        seasonHdcp! += sum(hc.totals) - series;
      }
      const m = matchups.find((x) => x.team_id === t.id && x.session_date === d);
      if (!m) continue;
      if (s.winloss_method === "manual") {
        w += Number(m.manual_wins ?? 0);
        l += Number(m.manual_losses ?? 0);
        ti += Number(m.manual_ties ?? 0);
      } else if (s.winloss_method === "per_game_vs_opponent" && m.opponent_team_id) {
        const useH = s.winloss_use_handicap && hdcpOn;
        const mine = teamGames(t.id, d, useH);
        const opp = teamGames(m.opponent_team_id, d, useH);
        const comps: [number, number][] = mine.totals.map((v, i) => [v, opp.totals[i] ?? 0]);
        if (s.series_point) comps.push([sum(mine.totals), sum(opp.totals)]);
        for (const [a, b] of comps) {
          if (a > b) w += 1;
          else if (a < b) l += 1;
          else if (s.tie_rule === "tie") ti += 1;
        }
      }
    }
    const cur = teamGames(t.id, date, false);
    const curH = hdcpOn ? teamGames(t.id, date, true) : null;
    return {
      team: t,
      gameTotals: cur.totals,
      hdcpGameTotals: curH?.totals ?? null,
      sessionPins: sum(cur.totals),
      seasonPins,
      seasonHdcpPins: seasonHdcp,
      seasonGames: teamScores.length,
      average: teamScores.length ? seasonPins / teamScores.length : null,
      wins: winLossConfigured ? w : null,
      losses: winLossConfigured ? l : null,
      ties: winLossConfigured ? ti : null,
      winPct: winLossConfigured && w + l > 0 ? w / (w + l) : null,
      highGame,
      highSeries,
    };
  });

  const key = (t: TeamLine): [number, number] => {
    switch (s.standings_rule) {
      case "wins":
        return [t.wins ?? 0, t.seasonPins];
      case "pins":
        return [t.seasonPins, 0];
      case "handicap_pins":
        return [(t.seasonHdcpPins ?? 0) + t.seasonPins, t.seasonPins];
      default:
        return [t.winPct ?? 0, t.seasonPins];
    }
  };
  const standings = [...teamLines].sort((a, b) => {
    const [a1, a2] = key(a);
    const [b1, b2] = key(b);
    return b1 - a1 || b2 - a2;
  });

  // ---- records
  const best = (rows: Omit<Record, "label">[], label: string): Record | null => {
    if (!rows.length) return null;
    const top = rows.reduce((m, r) => (r.score > m.score ? r : m));
    return { label, ...top };
  };
  const indivRows = (onlyDate: string | null, withHdcp: boolean, series: boolean) =>
    players.flatMap((p) =>
      (hist.get(p.id) ?? [])
        .filter((x) => (onlyDate ? x.date === onlyDate : true))
        .flatMap((x) => {
          const hc = withHdcp ? handicapFor(hdcpAvg(p.id, x.date), s) : 0;
          if (hc == null) return [];
          const base = { name: fullName(p), team: teamName(p.team_id), date: x.date };
          if (series) {
            if (!isSeries(x)) return [];
            return [{ ...base, score: sum([...x.games.values()]) + hc * x.games.size }];
          }
          return [...x.games.values()].map((g) => ({ ...base, score: g + hc }));
        }),
    );
  const teamRows = (withHdcp: boolean, series: boolean) =>
    teams.flatMap((t) =>
      allDates.flatMap((d) => {
        const r = teamGames(t.id, d, withHdcp);
        if (!r.bowled) return [];
        const base = { name: t.name, team: t.name, date: d };
        return series
          ? [{ ...base, score: sum(r.totals) }]
          : r.totals.map((v) => ({ ...base, score: v }));
      }),
    );

  const seasonRecords = [
    best(teamRows(false, false), "Team high scratch game"),
    best(teamRows(false, true), "Team high scratch series"),
    hdcpOn ? best(teamRows(true, false), "Team high handicap game") : null,
    hdcpOn ? best(teamRows(true, true), "Team high handicap series") : null,
    best(indivRows(null, false, false), "Individual high game"),
    best(indivRows(null, false, true), "Individual high series"),
    hdcpOn ? best(indivRows(null, true, false), "Individual high handicap game") : null,
    hdcpOn ? best(indivRows(null, true, true), "Individual high handicap series") : null,
  ].filter((r): r is Record => r != null);

  // weekly: pins over average need a prior average
  const overAvg = bowlers.flatMap((b) => {
    if (b.priorAvg == null || b.sessionGames === 0) return [];
    const base = { name: fullName(b.player), team: teamName(b.player.team_id), date };
    const played = b.games.filter((g): g is number => g != null);
    return [
      {
        kind: "game",
        ...base,
        score: Math.round(Math.max(...played) - b.priorAvg),
      },
      {
        kind: "series",
        ...base,
        score: Math.round(b.sessionTotal - b.priorAvg * b.sessionGames),
      },
    ];
  });
  const pos = (r: Omit<Record, "label"> | null) => (r && r.score > 0 ? r : null);
  const weeklyLeaders = [
    best(indivRows(date, false, false), "High game"),
    best(indivRows(date, false, true), "High series"),
    hdcpOn ? best(indivRows(date, true, false), "High handicap game") : null,
    hdcpOn ? best(indivRows(date, true, true), "High handicap series") : null,
    (() => {
      const r = pos(best(overAvg.filter((x) => x.kind === "game"), "Most pins over average"));
      return r ? (r as Record) : null;
    })(),
    (() => {
      const r = pos(
        best(overAvg.filter((x) => x.kind === "series"), "Most pins over series average"),
      );
      return r ? (r as Record) : null;
    })(),
  ].filter((r): r is Record => r != null);

  return {
    gamesPerSession: gps,
    bowlers,
    teams: teamLines,
    standings,
    winLossConfigured,
    handicapConfigured: hdcpOn,
    weeklyLeaders,
    seasonRecords,
    sessionDates: allDates,
  };
}

export const fmtAvg = (n: number | null) => (n == null ? "—" : String(Math.floor(n)));
export const fmtPct = (n: number | null) => (n == null ? "—" : n.toFixed(3).replace(/^0/, ""));
