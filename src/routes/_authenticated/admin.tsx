import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Section } from "@/components/site/PageHeader";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard | Vegreville Bowling Lanes" },
      {
        name: "description",
        content: "Manage booking requests, league rosters and score entry for Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Staff Dashboard | Vegreville Bowling Lanes" },
      { property: "og:description", content: "Bookings, rosters and score entry for centre staff." },
    ],
  }),
  component: AdminPage,
});

const STATUSES = ["new", "confirmed", "declined", "completed"] as const;

function AdminPage() {
  const { isStaff, loading } = useAuth();

  if (loading) return <Section>Loading…</Section>;
  if (!isStaff) {
    return (
      <Section>
        <div className="mx-auto max-w-lg rounded-2xl border border-border p-8 text-center">
          <h1 className="text-3xl">Staff only</h1>
          <p className="mt-2 text-muted-foreground">
            This area is for centre staff. If you manage a league and need access, ask an
            administrator to add your account.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Centre staff"
        title="Dashboard"
        intro="Confirm booking requests and enter league scores. Averages recalculate automatically."
      />
      <Section>
        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">Booking requests</TabsTrigger>
            <TabsTrigger value="scores">Score entry</TabsTrigger>
            <TabsTrigger value="roster">Rosters</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings" className="mt-6">
            <BookingsPanel />
          </TabsContent>
          <TabsContent value="scores" className="mt-6">
            <ScoreEntryPanel />
          </TabsContent>
          <TabsContent value="roster" className="mt-6">
            <RosterPanel />
          </TabsContent>
        </Tabs>
      </Section>
    </>
  );
}

function BookingsPanel() {
  const qc = useQueryClient();
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*")
        .order("requested_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("booking_requests")
        .update({ status: status as (typeof STATUSES)[number] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking updated");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (bookings.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if ((bookings.data ?? []).length === 0)
    return <p className="text-muted-foreground">No booking requests yet.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(bookings.data ?? []).map((b) => (
        <article key={b.id} className="neon-panel rounded-2xl p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl">{b.contact_name}</h3>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest text-accent">
              {b.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-accent">{b.booking_type}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <dt className="text-xs uppercase tracking-widest">When</dt>
              <dd>
                {b.requested_date} at {b.requested_time}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest">Group</dt>
              <dd>
                {b.party_size} bowlers · {b.lanes} lane(s)
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest">Phone</dt>
              <dd>{b.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest">Email</dt>
              <dd className="break-all">{b.email}</dd>
            </div>
          </dl>
          {b.notes ? <p className="mt-3 text-sm">{b.notes}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={b.status === s ? "default" : "outline"}
                onClick={() => update.mutate({ id: b.id, status: s })}
              >
                {s}
              </Button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function useLeagues() {
  return useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leagues").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
}

function ScoreEntryPanel() {
  const qc = useQueryClient();
  const leagues = useLeagues();
  const [leagueId, setLeagueId] = useState<string>("");

  const players = useQuery({
    queryKey: ["players", leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, first_name, last_name, average, games_played")
        .eq("league_id", leagueId)
        .order("last_name");
      if (error) throw error;
      return data;
    },
    enabled: !!leagueId,
  });

  const addScore = useMutation({
    mutationFn: async (values: {
      player_id: string;
      week_date: string;
      game_number: number;
      score: number;
    }) => {
      const { error } = await supabase.from("scores").insert({ ...values, league_id: leagueId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Score saved — average recalculated");
      void qc.invalidateQueries({ queryKey: ["players", leagueId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    addScore.mutate({
      player_id: String(form.get("player_id")),
      week_date: String(form.get("week_date")),
      game_number: Number(form.get("game_number")),
      score: Number(form.get("score")),
    });
    e.currentTarget.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Label htmlFor="league">League</Label>
        <Select value={leagueId} onValueChange={setLeagueId}>
          <SelectTrigger id="league" className="mt-2 w-full">
            <SelectValue placeholder="Choose a league" />
          </SelectTrigger>
          <SelectContent>
            {(leagues.data ?? []).map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {leagueId ? (
          <form onSubmit={handleSubmit} className="neon-panel mt-6 space-y-4 rounded-2xl p-5">
            <div>
              <Label htmlFor="player_id">Bowler</Label>
              <select
                id="player_id"
                name="player_id"
                required
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(players.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.last_name}, {p.first_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="week_date">Week</Label>
                <Input id="week_date" name="week_date" type="date" required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="game_number">Game #</Label>
                <Input
                  id="game_number"
                  name="game_number"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={1}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="score">Score (0–450)</Label>
                <Input id="score" name="score" type="number" min={0} max={450} required className="mt-2" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={addScore.isPending}>
              Save score
            </Button>
          </form>
        ) : null}
      </div>

      <div>
        <h3 className="text-2xl">Current averages</h3>
        {!leagueId ? (
          <p className="mt-2 text-muted-foreground">Pick a league to see its bowlers.</p>
        ) : (players.data ?? []).length === 0 ? (
          <p className="mt-2 text-muted-foreground">No bowlers on this roster yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-3">Bowler</th>
                  <th className="p-3 text-right">Games</th>
                  <th className="p-3 text-right">Average</th>
                </tr>
              </thead>
              <tbody>
                {(players.data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">
                      {p.last_name}, {p.first_name}
                    </td>
                    <td className="p-3 text-right">{p.games_played}</td>
                    <td className="p-3 text-right font-display text-lg text-accent">
                      {Number(p.average).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RosterPanel() {
  const qc = useQueryClient();
  const leagues = useLeagues();
  const [leagueId, setLeagueId] = useState<string>("");

  const addPlayer = useMutation({
    mutationFn: async (values: { first_name: string; last_name: string }) => {
      const { error } = await supabase.from("players").insert({ ...values, league_id: leagueId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bowler added to the roster");
      void qc.invalidateQueries({ queryKey: ["players", leagueId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    addPlayer.mutate({
      first_name: String(form.get("first_name")),
      last_name: String(form.get("last_name")),
    });
    e.currentTarget.reset();
  }

  return (
    <div className="max-w-xl">
      <Label htmlFor="roster-league">League</Label>
      <Select value={leagueId} onValueChange={setLeagueId}>
        <SelectTrigger id="roster-league" className="mt-2 w-full">
          <SelectValue placeholder="Choose a league" />
        </SelectTrigger>
        <SelectContent>
          {(leagues.data ?? []).map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {leagueId ? (
        <form onSubmit={handleSubmit} className="neon-panel mt-6 space-y-4 rounded-2xl p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" required className="mt-2" />
            </div>
          </div>
          <Button type="submit" disabled={addPlayer.isPending}>
            Add bowler
          </Button>
        </form>
      ) : null}
    </div>
  );
}
