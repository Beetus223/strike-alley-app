/**
 * Printable 5-pin lane scorecard. Pure presentation: names, averages, handicaps and divisions
 * come from League Management data + lm-engine. Bowlers write every ball by hand.
 */
import type { CSSProperties } from "react";

export type ScorecardRow = { division: string | null; name: string; average: number | null; handicap: number | null };
export type ScorecardSide = { team: string; rows: ScorecardRow[]; teamHandicap: number | null };

type Props = {
  leagueName: string;
  season: string | null;
  week: number | null;
  date: string;
  lane: string | null;
  gpn: number;
  sides: [ScorecardSide, ScorecardSide];
  handicapNote: string;
  showDivision: boolean;
  showHandicap: boolean;
};

const FRAMES = Array.from({ length: 10 }, (_, i) => i + 1);

function Pin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 52" className={className} aria-hidden="true">
      <path d="M10 1c3 0 4.2 3 4.2 6.2 0 2.4-1.3 4-1.6 6 .2 2.6 4.4 6.6 5.6 13.2 1.3 7.5-1.4 15.8-4.4 23.6H6.2C3.2 42.2.5 33.9 1.8 26.4 3 19.8 7.2 15.8 7.4 13.2 7.1 11.2 5.8 9.6 5.8 7.2 5.8 4 7 1 10 1z" />
      <rect x="6.6" y="12.2" width="6.8" height="1.6" className="lc-pin-stripe" />
      <rect x="6.4" y="15" width="7.2" height="1.6" className="lc-pin-stripe" />
    </svg>
  );
}

/** 2-3-5-3-2 pin rack motif — the Canadian 5-pin order. */
function PinRack() {
  return (
    <div className="lc-rack" aria-hidden="true">
      {[2, 3, 5, 3, 2].map((v, i) => (
        <span key={i} className={v === 5 ? "lc-rack-hp" : undefined}><Pin /><b>{v}</b></span>
      ))}
    </div>
  );
}

function Header(p: Props & { sub: string }) {
  const dateLabel = new Date(`${p.date}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  return (
    <header className="lc-head">
      <div className="lc-brandblock">
        <Pin className="lc-brandpin" />
        <div>
          <p className="lc-brand">Vegreville<br />Bowling</p>
          <p className="lc-since">Lanes • Since 1962</p>
        </div>
      </div>
      <div className="lc-headmain">
        <p className="lc-kicker"><span className="lc-badge">5-Pin</span> League Scorecard</p>
        <h2 className="lc-title">{p.leagueName}</h2>
        <p className="lc-meta">
          {p.season && <span>{p.season} Season</span>}
          <span>Week {p.week ?? "—"}</span>
          <span>{dateLabel}</span>
        </p>
      </div>
      <PinRack />
      <div className="lc-lane"><span>Lane</span><strong>{p.lane || "\u00a0"}</strong></div>
      <div className="lc-match">
        <strong>{p.sides[0].team}</strong>
        <span className="lc-vs">VS</span>
        <strong>{p.sides[1].team}</strong>
        <em>{p.sub}</em>
      </div>
    </header>
  );
}

/** Writing rows that fit one landscape Letter sheet at a usable handwriting size. */
export const GRID_BUDGET_IN = 5.2;
export const MIN_ROW_IN = 0.42;
export const MAX_LINES = Math.floor(GRID_BUDGET_IN / MIN_ROW_IN);

export type SheetPlan = { bowlers: [number, number]; games: number[] };

/**
 * Split one team's score sheet into whole sheets that each fit a page. Never splits a bowler's
 * game row or a frame; when everything won't fit, games are grouped onto separate sheets
 * (e.g. Games 1–2 / Games 3–4), and only with very large rosters are bowlers split too.
 */
export function planTeamSheets(bowlers: number, gpn: number, maxLines = MAX_LINES): SheetPlan[] {
  const n = Math.max(1, bowlers), g = Math.max(1, gpn);
  const all = Array.from({ length: g }, (_, i) => i + 1);
  if (n * g <= maxLines) return [{ bowlers: [0, n], games: all }];
  const groupsOf = (size: number) => {
    const count = Math.ceil(g / size), per = Math.ceil(g / count);
    return Array.from({ length: count }, (_, i) => all.slice(i * per, (i + 1) * per)).filter((x) => x.length);
  };
  if (n <= maxLines) return groupsOf(Math.max(1, Math.floor(maxLines / n))).map((games) => ({ bowlers: [0, n], games }));
  const out: SheetPlan[] = [];
  const chunks = Math.ceil(n / maxLines), per = Math.ceil(n / chunks);
  for (const game of all) for (let c = 0; c < chunks; c++) out.push({ bowlers: [c * per, Math.min(n, (c + 1) * per)], games: [game] });
  return out;
}

function TeamPage(p: Props & { side: ScorecardSide; plan: SheetPlan; sheetNo: number; sheetCount: number }) {
  const all = p.side.rows.length ? p.side.rows : Array.from({ length: 3 }, () => ({ division: null, name: "", average: null, handicap: null }));
  const rows = all.slice(p.plan.bowlers[0], p.plan.bowlers[1]);
  const games = p.plan.games;
  const lines = rows.length * games.length;
  const rowH = Math.max(MIN_ROW_IN, Math.min(0.72, GRID_BUDGET_IN / lines));
  const style = { "--lc-row": `${rowH}in` } as CSSProperties;
  const gLabel = games.length === p.gpn ? "" : games.length === 1 ? ` · Game ${games[0]}` : ` · Games ${games[0]}–${games[games.length - 1]}`;
  const bLabel = rows.length === all.length ? "" : ` · Bowlers ${p.plan.bowlers[0] + 1}–${p.plan.bowlers[1]}`;
  return (
    <article className="lane-card" style={style} data-sheet={`${p.sheetNo}/${p.sheetCount}`}>
      <Header {...p} sub={`${p.side.team}${gLabel}${bLabel} · Sheet ${p.sheetNo} of ${p.sheetCount}`} />
      {p.side.teamHandicap != null && (
        <p className="lc-teamhc">Team handicap: {p.side.teamHandicap} pins per game</p>
      )}
      <table className="lc-grid">
        <colgroup>
          <col className="lc-c-bowler" />
          <col className="lc-c-gm" />
          {FRAMES.map((f) => <col key={f} className={f === 10 ? "lc-c-f10" : "lc-c-f"} />)}
          <col className="lc-c-tot" />
          {p.showHandicap && <col className="lc-c-hc" />}
          {p.showHandicap && <col className="lc-c-tot" />}
        </colgroup>
        <thead>
          <tr>
            <th className="lc-bowler">Bowler</th>
            <th className="lc-gm">Game</th>
            {FRAMES.map((f) => <th key={f} className={f === 10 ? "lc-f10" : undefined}>{f === 10 ? "10th" : f}</th>)}
            <th className="lc-tot">Total</th>
            {p.showHandicap && <th className="lc-tot">Hdcp</th>}
            {p.showHandicap && <th className="lc-tot">Total +Hdcp</th>}
          </tr>
        </thead>
        {rows.map((r, ri) => (
          <tbody key={ri} className="lc-bowlerblock">
            {games.map((gameNo, g) => (
              <tr key={gameNo}>
                {g === 0 && (
                  <td rowSpan={games.length} className="lc-bowler">
                    <strong>{r.name || "\u00a0"}</strong>
                    <span className="lc-facts">
                      {p.showDivision && <span>Div <b>{r.division ?? "—"}</b></span>}
                      <span>Avg <b>{r.name ? (r.average == null ? "—" : Math.floor(r.average)) : ""}</b></span>
                      {p.showHandicap && <span>Hdcp <b>{r.handicap ?? (r.name && p.side.teamHandicap == null ? "0" : "")}</b></span>}
                    </span>
                  </td>
                )}
                <td className="lc-gm">{gameNo}</td>
                {FRAMES.map((f) => (
                  <td key={f} className={f === 10 ? "lc-frame lc-f10" : "lc-frame"}>
                    <div className="lc-balls"><i /><i /><i /></div>
                    <div className="lc-run" />
                  </td>
                ))}
                <td className="lc-tot" />
                {p.showHandicap && <td className="lc-tot lc-hc">{r.handicap ?? ""}</td>}
                {p.showHandicap && <td className="lc-tot" />}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <p className="lc-key">
        Each frame: write each ball in the top boxes (up to 3 balls) and the running score in the large box below.
        10th frame: a strike earns 2 bonus balls, a spare earns 1 — use all three 10th-frame boxes.
        Strike <b>X</b> · Spare <b>/</b> · Miss <b>–</b> · 15 pins per frame (2-3-5-3-2) · Perfect game 450.
      </p>
    </article>
  );
}

function SummaryPage(p: Props & { sheetNo: number; sheetCount: number }) {
  const games = Array.from({ length: p.gpn }, (_, i) => i + 1);
  const teamRows = p.showHandicap ? ["Scratch total", "Handicap", "Total with handicap"] : ["Scratch total"];
  return (
    <article className="lane-card lc-summary">
      <Header {...p} sub={`Results & points · Sheet ${p.sheetNo} of ${p.sheetCount}`} />
      <div className="lc-sumgrid">
        <table className="lc-sum">
          <thead>
            <tr>
              <th className="lc-left">Team totals</th>
              {games.map((g) => <th key={g}>Game {g}</th>)}
              <th>Series</th>
            </tr>
          </thead>
          {p.sides.map((s, si) => (
            <tbody key={si}>
              <tr className="lc-teamrow"><td className="lc-left" colSpan={games.length + 2}>{s.team}</td></tr>
              {teamRows.map((label) => (
                <tr key={label}>
                  <td className="lc-left">{label}</td>
                  {games.map((g) => <td key={g} />)}
                  <td />
                </tr>
              ))}
            </tbody>
          ))}
        </table>
        <table className="lc-sum">
          <thead>
            <tr><th className="lc-left">Points</th><th>{p.sides[0].team}</th><th>{p.sides[1].team}</th></tr>
          </thead>
          <tbody>
            {games.map((g) => <tr key={g}><td className="lc-left">Game {g}</td><td /><td /></tr>)}
            <tr><td className="lc-left">Series</td><td /><td /></tr>
            <tr><td className="lc-left">Team / Match</td><td /><td /></tr>
            <tr className="lc-teamrow"><td className="lc-left">Total points</td><td /><td /></tr>
          </tbody>
        </table>
      </div>
      <p className="lc-key">{p.handicapNote} Official results are calculated in League Management from the scores entered by staff.</p>
      <div className="lc-sign">
        <span>Captain — {p.sides[0].team}: ____________________</span>
        <span>Captain — {p.sides[1].team}: ____________________</span>
      </div>
    </article>
  );
}

export function ScorecardSheet(p: Props) {
  const plans = p.sides.map((s) => planTeamSheets(s.rows.length || 3, p.gpn));
  const count = plans[0]!.length + plans[1]!.length + 1;
  let n = 0;
  return (
    <div className="lane-set">
      {p.sides.map((side, si) => plans[si]!.map((plan, pi) => (
        <TeamPage key={`${si}-${pi}`} {...p} side={side} plan={plan} sheetNo={++n} sheetCount={count} />
      )))}
      <SummaryPage {...p} sheetNo={count} sheetCount={count} />
    </div>
  );
}
