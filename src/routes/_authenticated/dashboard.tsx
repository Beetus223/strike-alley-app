import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/site/PageHeader";

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
                <p className="mt-4 font-display text-5xl text-primary">
                  {Number(m.average).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {m.games_played} games · {m.total_pinfall} pins
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Bowling sessions">
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
                    <span>{total} pins</span>
                    <span>Session average {(total / s.games.length).toFixed(1)}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
