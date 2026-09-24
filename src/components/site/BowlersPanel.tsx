import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, PanelIntro, TextField } from "@/components/site/AdminField";
import {
  createBowlerAccount,
  regenerateBowlerId,
  resetBowlerPassword,
  setBowlerActive,
} from "@/lib/bowlers.functions";

type Bowler = {
  id: string;
  bowler_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
};

type Membership = {
  id: string;
  league_id: string;
  bowler_ref: string | null;
  average: number;
  games_played: number;
  leagues: { name: string; night: string } | null;
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

export function BowlersPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const leagues = useQuery({
    queryKey: ["content", "league-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, night")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const bowlers = useQuery({
    queryKey: ["bowlers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bowlers")
        .select("*")
        .order("last_name")
        .order("first_name");
      if (error) throw error;
      return data as Bowler[];
    },
  });

  const memberships = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, league_id, bowler_ref, average, games_played, leagues(name, night)");
      if (error) throw error;
      return data as unknown as Membership[];
    },
  });

  const byBowler = useMemo(() => {
    const map = new Map<string, Membership[]>();
    for (const m of memberships.data ?? []) {
      if (!m.bowler_ref) continue;
      map.set(m.bowler_ref, [...(map.get(m.bowler_ref) ?? []), m]);
    }
    return map;
  }, [memberships.data]);

  const create = useMutation({
    mutationFn: async (values: {
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
      notes: string | null;
      password: string;
    }) => createBowlerAccount({ data: values }),
    onSuccess: (row) => {
      toast.success(`Bowler ID ${row.bowler_id} created`, {
        description: "Write it down — the bowler signs in with this ID and their password.",
      });
      void qc.invalidateQueries({ queryKey: ["bowlers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveDetails = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Bowler> }) => {
      const { error } = await supabase.from("bowlers").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bowler details saved");
      void qc.invalidateQueries({ queryKey: ["bowlers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const newId = useMutation({
    mutationFn: async (id: string) => regenerateBowlerId({ data: { id } }),
    onSuccess: (r) => {
      toast.success(`New Bowler ID: ${r.bowler_id}`);
      void qc.invalidateQueries({ queryKey: ["bowlers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const newPassword = useMutation({
    mutationFn: async (v: { id: string; password: string }) => resetBowlerPassword({ data: v }),
    onSuccess: () => toast.success("Password reset"),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (v: { id: string; is_active: boolean }) => setBowlerActive({ data: v }),
    onSuccess: () => {
      toast.success("Account updated");
      void qc.invalidateQueries({ queryKey: ["bowlers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addLeague = useMutation({
    mutationFn: async ({ bowler, leagueId }: { bowler: Bowler; leagueId: string }) => {
      const { data: linked } = await supabase
        .from("bowlers")
        .select("user_id")
        .eq("id", bowler.id)
        .single();
      const { error } = await supabase.from("players").insert({
        league_id: leagueId,
        bowler_ref: bowler.id,
        profile_id: linked?.user_id ?? null,
        first_name: bowler.first_name,
        last_name: bowler.last_name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to league");
      void qc.invalidateQueries({ queryKey: ["memberships"] });
      void qc.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeLeague = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.from("players").delete().eq("id", playerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from league");
      void qc.invalidateQueries({ queryKey: ["memberships"] });
      void qc.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (e: Error) =>
      toast.error(`${e.message}. If this bowler already has scores in the league, keep them here.`),
  });

  const term = search.trim().toLowerCase();
  const list = (bowlers.data ?? []).filter((b) => {
    const matchesTerm =
      term === "" ||
      `${b.first_name} ${b.last_name}`.toLowerCase().includes(term) ||
      b.bowler_id.toLowerCase().includes(term);
    const matchesLeague =
      leagueFilter === "" ||
      (byBowler.get(b.id) ?? []).some((m) => m.league_id === leagueFilter);
    return matchesTerm && matchesLeague;
  });

  function submitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const val = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : v;
    };
    create.mutate({
      first_name: String(f.get("first_name")),
      last_name: String(f.get("last_name")),
      email: val("email"),
      phone: val("phone"),
      notes: val("notes"),
      password: String(f.get("password")),
    });
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <PanelIntro>
        Bowlers don’t sign themselves up. Create the account here and the system gives it a unique
        Bowler ID like <strong>VB-48291</strong>. The bowler signs in with that ID and the password
        you set, and only ever sees their own scores. Add them to as many leagues as they bowl in.
      </PanelIntro>

      <details className="card-soft rounded-2xl p-5">
        <summary className="cursor-pointer font-display text-2xl">Create a bowler account</summary>
        <form onSubmit={submitNew} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="first_name" required />
            <Field label="Last name" name="last_name" required />
            <Field label="Email (optional)" name="email" type="email" />
            <Field label="Phone (optional)" name="phone" />
            <Field
              label="Password"
              name="password"
              required
              hint="At least 6 characters. You can reset it any time."
            />
          </div>
          <TextField label="Notes (optional)" name="notes" rows={2} />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create bowler & generate Bowler ID"}
          </Button>
        </form>
      </details>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bowler-search">Search by name or Bowler ID</Label>
          <Input
            id="bowler-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Matheson or VB-48291"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="bowler-league">Filter by league</Label>
          <select
            id="bowler-league"
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All leagues</option>
            {(leagues.data ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {bowlers.isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
      {!bowlers.isLoading && list.length === 0 ? (
        <p className="text-muted-foreground">No bowler accounts match that search yet.</p>
      ) : null}

      <div className="space-y-4">
        {list.map((b) => {
          const mine = byBowler.get(b.id) ?? [];
          const open = openId === b.id;
          return (
            <div key={b.id} className="card-soft rounded-2xl p-5">
              <button
                type="button"
                className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
                onClick={() => setOpenId(open ? null : b.id)}
              >
                <span className="font-display text-2xl">
                  {b.last_name}, {b.first_name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {b.bowler_id}
                  {b.is_active ? "" : " · deactivated"} · {mine.length} league
                  {mine.length === 1 ? "" : "s"}
                </span>
              </button>

              {open ? (
                <div className="mt-5 space-y-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      const val = (k: string) => {
                        const v = String(f.get(k) ?? "").trim();
                        return v === "" ? null : v;
                      };
                      saveDetails.mutate({
                        id: b.id,
                        values: {
                          first_name: String(f.get("first_name")),
                          last_name: String(f.get("last_name")),
                          email: val("email"),
                          phone: val("phone"),
                          notes: val("notes"),
                        },
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="First name" name="first_name" defaultValue={b.first_name} required />
                      <Field label="Last name" name="last_name" defaultValue={b.last_name} required />
                      <Field label="Email" name="email" type="email" defaultValue={b.email} />
                      <Field label="Phone" name="phone" defaultValue={b.phone} />
                    </div>
                    <TextField label="Notes" name="notes" rows={2} defaultValue={b.notes} />
                    <Button type="submit" size="sm">
                      Save details
                    </Button>
                  </form>

                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Bowler ID
                    </p>
                    <p className="font-display text-3xl text-primary">{b.bowler_id}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            confirm(
                              "Give this bowler a brand new ID? Their old ID will stop working.",
                            )
                          )
                            newId.mutate(b.id);
                        }}
                      >
                        Regenerate Bowler ID
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const pw = prompt("New password (at least 6 characters)");
                          if (pw) newPassword.mutate({ id: b.id, password: pw });
                        }}
                      >
                        Reset password
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}
                      >
                        {b.is_active ? "Deactivate account" : "Reactivate account"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-xl">Leagues</h4>
                    <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                      {mine.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-muted-foreground">
                          Not in any league yet.
                        </li>
                      ) : null}
                      {mine.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                        >
                          <span>{m.leagues?.name ?? "League"}</span>
                          <span className="flex items-center gap-4 text-muted-foreground">
                            {m.games_played} games · avg {Number(m.average).toFixed(2)}
                            <button
                              type="button"
                              className="text-xs underline-offset-4 hover:underline"
                              onClick={() => {
                                if (confirm("Remove this bowler from the league?"))
                                  removeLeague.mutate(m.id);
                              }}
                            >
                              remove
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <select
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addLeague.mutate({ bowler: b, leagueId: e.target.value });
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">Add to a league…</option>
                        {(leagues.data ?? [])
                          .filter((l) => !mine.some((m) => m.league_id === l.id))
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({l.night})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <BowlerHistory memberships={mine} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BowlerHistory({ memberships }: { memberships: Membership[] }) {
  const ids = memberships.map((m) => m.id);
  const history = useQuery({
    queryKey: ["bowler-history", ids.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scores")
        .select("id, week_date, game_number, score, league_id, player_id")
        .in("player_id", ids)
        .order("week_date", { ascending: false })
        .order("game_number");
      if (error) throw error;
      return data;
    },
    enabled: ids.length > 0,
  });

  const grouped = new Map<string, { date: string; league: string; games: number[] }>();
  for (const s of history.data ?? []) {
    const league =
      memberships.find((m) => m.id === s.player_id)?.leagues?.name ?? "League";
    const key = `${s.week_date}|${league}`;
    const entry = grouped.get(key) ?? { date: s.week_date, league, games: [] };
    entry.games.push(s.score);
    grouped.set(key, entry);
  }

  // Highest individual game per league membership, from full score history.
  const highestByPlayer = new Map<string, number>();
  for (const s of history.data ?? []) {
    const current = highestByPlayer.get(s.player_id) ?? 0;
    if (s.score > current) highestByPlayer.set(s.player_id, s.score);
  }

  if (ids.length === 0) return null;

  return (
    <div>
      <h4 className="font-display text-xl">Bowling history</h4>
      {highestByPlayer.size > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {memberships.map((m) =>
            highestByPlayer.has(m.id) ? (
              <li key={m.id}>
                {m.leagues?.name ?? "League"}: highest game{" "}
                <span className="font-display text-base text-primary">
                  {highestByPlayer.get(m.id)}
                </span>{" "}
                · average {Number(m.average).toFixed(1)}
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
      {grouped.size === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No games entered yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {Array.from(grouped.values()).map((s) => (
            <div key={`${s.date}${s.league}`} className="rounded-xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary px-4 py-2">
                <span className="text-sm font-semibold">{prettyDate(s.date)}</span>
                <span className="text-xs text-muted-foreground">{s.league}</span>
              </div>
              <div className="flex flex-wrap gap-4 px-4 py-3 text-sm">
                {s.games.map((g, i) => (
                  <span key={i}>
                    Game {i + 1}: <span className="font-display text-lg text-primary">{g}</span>
                  </span>
                ))}
                <span className="text-muted-foreground">
                  Session average{" "}
                  {(s.games.reduce((a, b) => a + b, 0) / s.games.length).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
