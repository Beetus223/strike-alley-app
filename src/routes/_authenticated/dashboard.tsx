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
        content: "Your league averages, game history and booking requests at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "My Bowling | Vegreville Bowling Lanes" },
      { property: "og:description", content: "League averages and score history for our bowlers." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isStaff, signOut } = useAuth();

  const players = useQuery({
    queryKey: ["my-players", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, first_name, last_name, average, games_played, total_pinfall, leagues(name, night)")
        .eq("profile_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const scores = useQuery({
    queryKey: ["my-scores", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scores")
        .select("id, week_date, game_number, score, players(first_name, last_name)")
        .order("week_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <>
      <PageHeader
        eyebrow={user?.email ?? ""}
        title="My bowling"
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

      <Section title="League averages">
        {players.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (players.data ?? []).length === 0 ? (
          <p className="text-muted-foreground">
            You're not linked to a league roster yet. Ask at the counter and we'll connect your
            account to your team.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(players.data ?? []).map((p) => (
              <div key={p.id} className="card-soft rounded-2xl p-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {p.leagues?.name ?? "League"}
                </p>
                <p className="mt-1 text-2xl">
                  {p.first_name} {p.last_name}
                </p>
                <p className="mt-4 font-display text-5xl text-primary">{Number(p.average).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {p.games_played} games · {p.total_pinfall} pins
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent games">
        {(scores.data ?? []).length === 0 ? (
          <p className="text-muted-foreground">No games recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Bowler</th>
                  <th className="p-3">Game</th>
                  <th className="p-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {(scores.data ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3">{s.week_date}</td>
                    <td className="p-3">
                      {s.players?.first_name} {s.players?.last_name}
                    </td>
                    <td className="p-3">#{s.game_number}</td>
                    <td className="p-3 text-right font-display text-lg">{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}
