import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { groupNights, summarize, uniqueLeagues, usesHandicap, type MyLmMembership, type MyLmScore } from "@/lib/my-league";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Bowling | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Your league averages, bowling sessions and game history at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "My Bowling | Vegreville Bowling Lanes" },
      { property: "og:description", content: "League averages and score history for our bowlers." },
    ],
  }),
  component: Dashboard,
});

type Membership = {
  id: string;
  average: number;
  games_played: number;
  total_pinfall: number;
  league_id: string;
  leagues: { name: string; night: string; start_time: string } | null;
};

function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Dashboard() {
  const { user, isStaff, signOut } = useAuth();

  const bowler = useQuery({
    queryKey: ["my-bowler", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bowlers")
        .select("id, bowler_id, first_name, last_name, is_active")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Current League Management results: self-scoped, read-only database functions (completed nights only).
  const lm = useQuery({
    queryKey: ["my-lm", user?.id],
    queryFn: async () => {
      const [m, sc] = await Promise.all([supabase.rpc("my_lm_memberships"), supabase.rpc("my_lm_scores")]);
      if (m.error) throw m.error;
      if (sc.error) throw sc.error;
      return { memberships: (m.data ?? []) as MyLmMembership[], scores: (sc.data ?? []) as MyLmScore[] };
    },
    enabled: !!user,
  });
  const lmLeagues = uniqueLeagues(lm.data?.memberships ?? []);
  const lmScores = lm.data?.scores ?? [];
  const lmNights = groupNights(lmScores);
  const hcpMethod = new Map(lmLeagues.map((m) => [m.league_id, m.handicap_method]));

  const memberships = useQuery({
    queryKey: ["my-memberships", user?.id, bowler.data?.id],
    queryFn: async () => {
      let q = supabase
        .from("players")
        .select(
          "id, league_id, average, games_played, total_pinfall, leagues(name, night, start_time)",
        );
      q = bowler.data?.id
        ? q.eq("bowler_ref", bowler.data.id)
        : q.eq("profile_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Membership[];
    },
    enabled: !!user && !bowler.isLoading,
  });

  const playerIds = (memberships.data ?? []).map((m) => m.id);

  const scores = useQuery({
    queryKey: ["my-scores", playerIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scores")
        .select("id, week_date, game_number, score, player_id")
        .in("player_id", playerIds)
        .order("week_date", { ascending: false })
        .order("game_number");
      if (error) throw error;
      return data;
    },
    enabled: playerIds.length > 0,
  });

  const leagueIds = (memberships.data ?? []).map((m) => m.league_id);
  const leagueSettings = useQuery({
    queryKey: ["my-league-settings", leagueIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_settings")
        .select("league_id, games_per_session, season_label, season_start, season_end")
        .in("league_id", leagueIds);
      if (error) throw error;
      return data;
    },
    enabled: leagueIds.length > 0,
  });

  // Per-membership season stats + highest series, derived from individual games.
  const statsFor = (m: Membership) => {
    const cfg = (leagueSettings.data ?? []).find((x) => x.league_id === m.league_id);
    const gps = cfg?.games_per_session ?? 3;
    const mine = (scores.data ?? []).filter((s) => s.player_id === m.id);
    const season = mine.filter(
      (s) =>
        (!cfg?.season_start || s.week_date >= cfg.season_start) &&
        (!cfg?.season_end || s.week_date <= cfg.season_end),
    );
    const byNight = new Map<string, number[]>();
    for (const s of mine) byNight.set(s.week_date, [...(byNight.get(s.week_date) ?? []), s.score]);
    const series = [...byNight.values()].filter((g) => g.length === gps).map((g) => g.reduce((a, b) => a + b, 0));
    const pins = season.reduce((a, s) => a + s.score, 0);
    return {
      label: cfg?.season_label ?? null,
      highSeries: series.length ? Math.max(...series) : null,
      seasonPins: pins,
      seasonGames: season.length,
      seasonAvg: season.length ? pins / season.length : null,
    };
  };

  // Highest individual game per league membership, from the full score history.
  const highestByPlayer = new Map<string, number>();
  for (const s of scores.data ?? []) {
    const current = highestByPlayer.get(s.player_id) ?? 0;
    if (s.score > current) highestByPlayer.set(s.player_id, s.score);
  }

  const leagueName = (playerId: string) =>
    (memberships.data ?? []).find((m) => m.id === playerId)?.leagues?.name ?? "League";

  // Group every game into one bowling session per date + league.
  const sessions = new Map<
    string,
    { date: string; league: string; games: { game_number: number; score: number }[] }
  >();
  for (const s of scores.data ?? []) {
    const league = leagueName(s.player_id);
    const key = `${s.week_date}|${league}`;
    const entry = sessions.get(key) ?? { date: s.week_date, league, games: [] };
    entry.games.push({ game_number: s.game_number, score: s.score });
    sessions.set(key, entry);
  }

  const name = bowler.data
    ? `${bowler.data.first_name} ${bowler.data.last_name}`
    : (user?.email ?? "");

  return (
    <>
      <PageHeader
        eyebrow={bowler.data ? `Bowler ID ${bowler.data.bowler_id}` : (user?.email ?? "")}
        title={bowler.data ? name : "My bowling"}
        intro="Your average updates the moment a new score is entered at the counter."
      >
        <div className="flex flex-wrap gap-3">
          {isStaff ? (
            <Button asChild>
              <Link to="/admin">Staff dashboard</Link>
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </PageHeader>

      <Section title="My leagues">
        {lm.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : lm.error ? (
          <p className="text-destructive">We couldn't load your league results. Please try again later.</p>
        ) : lmLeagues.length === 0 ? (
          <p className="text-muted-foreground">
            You're not on a league roster yet. Ask at the counter and we'll add you to your league.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lmLeagues.map((m) => {
              const st = summarize(m, lmScores);
              return (
                <div key={m.league_id} className="card-soft rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {[m.season, st.team].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-2xl">{m.league_name}</p>
                  <div className="mt-4 flex items-end gap-8">
                    <div>
                      <p className="font-display text-5xl text-primary">{st.average == null ? "—" : Math.floor(st.average)}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {st.averageSource === "entering" ? "Entering average" : "Average"}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-5xl text-primary">{st.highGame ?? "—"}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Highest game</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end gap-8">
                    <div>
                      <p className="font-display text-3xl text-primary">{st.highSeries ?? "—"}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Highest series</p>
                    </div>
                    {st.handicap != null && (
                      <div>
                        <p className="font-display text-3xl text-primary">{st.handicap}</p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Current handicap</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{st.games} games · {st.pins} pins</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="League nights">
        {lmNights.length === 0 ? (
          <p className="text-muted-foreground">No completed league nights yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {lmNights.map((n) => (
              <article key={n.night_id} className="overflow-hidden rounded-2xl border border-border">
                <header className="flex flex-wrap items-baseline justify-between gap-2 bg-secondary px-5 py-3">
                  <span className="font-semibold">{prettyDate(n.date)}{n.week != null ? ` · Week ${n.week}` : ""}</span>
                  <span className="text-sm text-primary">{n.league_name}</span>
                </header>
                <ul className="divide-y divide-border">
                  {n.games.map((g) => (
                    <li key={g.game_number} className="flex justify-between px-5 py-2 text-sm">
                      <span>Game {g.game_number}</span>
                      <span className="font-display text-lg text-primary">{g.score}</span>
                    </li>
                  ))}
                </ul>
                <footer className="flex flex-wrap justify-between gap-2 bg-secondary/50 px-5 py-2 text-sm text-muted-foreground">
                  <span>Series {n.series}</span>
                  {n.average_at_time != null && <span>Average that night {Math.floor(n.average_at_time)}</span>}
                  {usesHandicap(hcpMethod.get(n.league_id) ?? null) && n.handicap_at_time != null && (
                    <span>Handicap {n.handicap_at_time}</span>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </Section>

      {(memberships.data ?? []).length > 0 && (
      <Section title="Earlier records (previous system)">
        {memberships.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (memberships.data ?? []).length === 0 ? (
          <p className="text-muted-foreground">
            You're not on a league roster yet. Ask at the counter and we'll add you to your league.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(memberships.data ?? []).map((m) => (
              <div key={m.id} className="card-soft rounded-2xl p-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {m.leagues?.night ?? ""} {m.leagues?.start_time ?? ""}
                </p>
                <p className="mt-1 text-2xl">{m.leagues?.name ?? "League"}</p>
                <div className="mt-4 flex items-end gap-8">
                  <div>
                    <p className="font-display text-5xl text-primary">
                      {Number(m.average).toFixed(1)}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Average
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-5xl text-primary">
                      {highestByPlayer.get(m.id) ?? "—"}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Highest game
                    </p>
                  </div>
                </div>
                {(() => {
                  const st = statsFor(m);
                  return (
                    <>
                      <div className="mt-4">
                        <p className="font-display text-3xl text-primary">{st.highSeries ?? "—"}</p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          Highest series
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {m.games_played} games · {m.total_pinfall} pins
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {st.label ? `${st.label} season` : "Season"}: {st.seasonPins} pins ·{" "}
                        {st.seasonGames} games · avg{" "}
                        {st.seasonAvg == null ? "—" : st.seasonAvg.toFixed(1)}
                      </p>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </Section>
      )}

      {sessions.size > 0 && (
      <Section title="Earlier sessions (previous system)">
        {sessions.size === 0 ? (
          <p className="text-muted-foreground">No games recorded yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from(sessions.values()).map((s) => {
              const total = s.games.reduce((a, g) => a + g.score, 0);
              return (
                <article
                  key={`${s.date}${s.league}`}
                  className="overflow-hidden rounded-2xl border border-border"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-2 bg-secondary px-5 py-3">
                    <span className="font-semibold">{prettyDate(s.date)}</span>
                    <span className="text-sm text-primary">{s.league}</span>
                  </header>
                  <ul className="divide-y divide-border">
                    {s.games.map((g) => (
                      <li key={g.game_number} className="flex justify-between px-5 py-2 text-sm">
                        <span>Game {g.game_number}</span>
                        <span className="font-display text-lg text-primary">{g.score}</span>
                      </li>
                    ))}
                  </ul>
                  <footer className="flex justify-between bg-secondary/50 px-5 py-2 text-sm text-muted-foreground">
                    <span>Total {total}</span>
                    <span>Session average {(total / s.games.length).toFixed(1)}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </Section>
      )}
    </>
  );
}
