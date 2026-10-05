/** Printable lane scorecard. Pure presentation: every value comes from League Management data + lm-engine. */
export type ScorecardRow = { division: string | null; name: string; average: number | null; handicap: number | null };
export type ScorecardSide = { team: string; rows: ScorecardRow[]; teamHandicap: number | null };

export function ScorecardSheet(p: {
  leagueName: string;
  season: string | null;
  week: number | null;
  date: string;
  lane: string | null;
  gpn: number;
  sides: [ScorecardSide, ScorecardSide];
  handicapNote: string;
}) {
  const games = Array.from({ length: p.gpn }, (_, i) => i + 1);
  const dateLabel = new Date(`${p.date}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const MIN_ROWS = 4;
  return (
    <article className="lane-card">
      <header className="lc-head">
        <div>
          <p className="lc-brand">Vegreville Bowling Lanes</p>
          <h2 className="lc-title">{p.leagueName}</h2>
          <p className="lc-meta">
            {[p.season && `${p.season} Season`, `Week ${p.week ?? "—"}`, dateLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="lc-lane">
          <span>Lane</span>
          <strong>{p.lane || "\u00a0"}</strong>
        </div>
      </header>
      <p className="lc-match">
        {p.sides[0].team} <span>vs</span> {p.sides[1].team}
      </p>

      {p.sides.map((side, si) => {
        const blanks = Math.max(0, MIN_ROWS - side.rows.length);
        return (
          <section key={si} className="lc-team">
            <h3>{side.team}</h3>
            <table className="lc-table">
              <thead>
                <tr>
                  <th className="lc-div">Div</th>
                  <th className="lc-name">Bowler</th>
                  <th className="lc-num">Avg</th>
                  <th className="lc-num">Hdcp</th>
                  {games.map((g) => <th key={g} className="lc-write">Game {g}</th>)}
                  <th className="lc-write">Series</th>
                  <th className="lc-pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                {side.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="lc-div">{r.division ?? ""}</td>
                    <td className="lc-name">{r.name}</td>
                    <td className="lc-num">{r.average == null ? "—" : Math.floor(r.average)}</td>
                    <td className="lc-num">{r.handicap == null ? "" : r.handicap}</td>
                    {games.map((g) => <td key={g} className="lc-write" />)}
                    <td className="lc-write" />
                    <td className="lc-pts" />
                  </tr>
                ))}
                {Array.from({ length: blanks }, (_, i) => (
                  <tr key={`b${i}`}>
                    <td className="lc-div" /><td className="lc-name" /><td className="lc-num" /><td className="lc-num" />
                    {games.map((g) => <td key={g} className="lc-write" />)}
                    <td className="lc-write" /><td className="lc-pts" />
                  </tr>
                ))}
                <tr className="lc-total">
                  <td colSpan={3} className="lc-name">Scratch total</td>
                  <td className="lc-num" />
                  {games.map((g) => <td key={g} className="lc-write" />)}
                  <td className="lc-write" /><td className="lc-pts" />
                </tr>
                <tr className="lc-total">
                  <td colSpan={3} className="lc-name">
                    Handicap{side.teamHandicap != null ? ` (team: ${side.teamHandicap} per game)` : ""}
                  </td>
                  <td className="lc-num" />
                  {games.map((g) => <td key={g} className="lc-write">{side.teamHandicap != null ? side.teamHandicap : ""}</td>)}
                  <td className="lc-write" /><td className="lc-pts" />
                </tr>
                <tr className="lc-total">
                  <td colSpan={3} className="lc-name">Total with handicap</td>
                  <td className="lc-num" />
                  {games.map((g) => <td key={g} className="lc-write" />)}
                  <td className="lc-write" /><td className="lc-pts" />
                </tr>
              </tbody>
            </table>
          </section>
        );
      })}

      <section className="lc-points">
        <table className="lc-table">
          <thead>
            <tr>
              <th className="lc-name">Points</th>
              <th className="lc-write">{p.sides[0].team}</th>
              <th className="lc-write">{p.sides[1].team}</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g}><td className="lc-name">Game {g}</td><td className="lc-write" /><td className="lc-write" /></tr>
            ))}
            <tr><td className="lc-name">Series</td><td className="lc-write" /><td className="lc-write" /></tr>
            <tr><td className="lc-name">Team / Match</td><td className="lc-write" /><td className="lc-write" /></tr>
            <tr className="lc-total"><td className="lc-name">Total</td><td className="lc-write" /><td className="lc-write" /></tr>
          </tbody>
        </table>
        <p className="lc-note">{p.handicapNote}</p>
      </section>
    </article>
  );
}
