import { describe, expect, it } from "vitest";
import { MAX_LINES, planTeamSheets } from "./ScorecardSheet";

const lines = (p: ReturnType<typeof planTeamSheets>) => p.map((s) => (s.bowlers[1] - s.bowlers[0]) * s.games.length);

describe("lane scorecard sheet planning", () => {
  it("fits a small 3-game team on one sheet with all games", () => {
    expect(planTeamSheets(3, 3)).toEqual([{ bowlers: [0, 3], games: [1, 2, 3] }]);
  });
  it("splits a 5-bowler 4-game team into Games 1–2 and Games 3–4, never splitting a bowler", () => {
    expect(planTeamSheets(5, 4)).toEqual([
      { bowlers: [0, 5], games: [1, 2] },
      { bowlers: [0, 5], games: [3, 4] },
    ]);
  });
  it("covers every game exactly once for each bowler", () => {
    for (const [b, g] of [[4, 3], [5, 3], [6, 4], [8, 4], [20, 3]]) {
      const plan = planTeamSheets(b, g);
      for (let bi = 0; bi < b; bi++) {
        const seen = plan.filter((s) => bi >= s.bowlers[0] && bi < s.bowlers[1]).flatMap((s) => s.games).sort();
        expect(seen).toEqual(Array.from({ length: g }, (_, i) => i + 1));
      }
      expect(Math.max(...lines(plan))).toBeLessThanOrEqual(MAX_LINES);
    }
  });
});
