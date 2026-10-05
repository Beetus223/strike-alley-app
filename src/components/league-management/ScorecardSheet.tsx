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

function Header(p: Props & { sub: string }) {
  const dateLabel = new Date(`${p.date}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  return (
    <header className="lc-head">
      <div>
        <p className="lc-brand">Vegreville Bowling Lanes · 5-Pin League Scorecard</p>
        <h2 className="lc-title">{p.leagueName}</h2>
        <p className="lc-meta">
          {[p.season && `${p.season} Season`, `Week ${p.week ?? "—"}`, dateLabel].filter(Boolean).join("  ·  ")}
        </p>
        <p className="lc-match">
          {p.sides[0].team} <span>vs</span> {p.sides[1].team}
          <em>{p.sub}</em>
        </p>
      </div>
      <div className="lc-lane"><span>Lane</span><strong>{p.lane || "\u00a0"}</strong></div>
    </header>
  );
}

function TeamPage(p: Props & { side: ScorecardSide }) {
  const rows = p.side.rows.length ? p.side.rows : Array.from({ length: 3 }, () => ({ division: null, name: "", average: null, handicap: null }));
  const lines = rows.length * p.gpn;
  // Fit everything on one landscape page: shrink rows when there are many bowlers/games.
  const rowH = Math.max(0.3, Math.min(0.55, 5.6 / lines));
  const style = { "--lc-row": `${rowH}in` } as CSSProperties;
  return (
    <article className="lane-card" style={style}>
      <Header {...p} sub={`Score sheet: ${p.side.team}`} />
      {p.side.teamHandicap != null && (
        <p className="lc-teamhc">Team handicap: {p.side.teamHandicap} pins per game</p>
      )}
      <table className="lc-grid">
        <thead>
          <tr>
            <th className="lc-bowler">Bowler</th>
            <th className="lc-gm">Game</th>
            {FRAMES.map((f) => <th key={f}>{f}</th>)}
            <th className="lc-tot">Total</th>
            {p.showHandicap && <th className="lc-tot">Hdcp</th>}
            {p.showHandicap && <th className="lc-tot">Total + Hdcp</th>}
          </tr>
        </thead>
        {rows.map((r, ri) => (
          <tbody key={ri} className="lc-bowlerblock">
            {Array.from({ length: p.gpn }, (_, g) => (
              <tr key={g}>
                {g === 0 && (
                  <td rowSpan={p.gpn} className="lc-bowler">
                    <strong>{r.name || "\u00a0"}</strong>
                    <span className="lc-facts">
                      {p.showDivision && <span>Div <b>{r.division ?? "—"}</b></span>}
                      <span>Avg <b>{r.name ? (r.average == null ? "—" : Math.floor(r.average)) : ""}</b></span>
                      {p.showHandicap && <span>Hdcp <b>{r.handicap ?? (r.name && p.side.teamHandicap == null ? "0" : "")}</b></span>}
                    </span>
                  </td>
                )}
                <td className="lc-gm">{g + 1}</td>
                {FRAMES.map((f) => (
                  <td key={f} className="lc-frame">
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
        Each frame: write each ball in the small boxes (up to 3 balls) and the running score below.
        Strike <b>X</b> · Spare <b>/</b> · Miss <b>–</b> · 15 pins per frame (2-3-5-3-2) · Perfect game 450.
      </p>
    </article>
  );
}

function SummaryPage(p: Props) {
  const games = Array.from({ length: p.gpn }, (_, i) => i + 1);
  const teamRows = p.showHandicap ? ["Scratch total", "Handicap", "Total with handicap"] : ["Scratch total"];
  return (
    <article className="lane-card lc-summary">
      <Header {...p} sub="Results &amp; points".replace("&amp;", "&")} />
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
  return (
    <div className="lane-set">
      <TeamPage {...p} side={p.sides[0]} />
      <TeamPage {...p} side={p.sides[1]} />
      <SummaryPage {...p} />
    </div>
  );
}
