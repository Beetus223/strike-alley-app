import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PanelIntro } from "@/components/site/AdminField";
import {
  buildReport,
  DEFAULT_SETTINGS,
  fmtAvg,
  fmtPct,
  fullName,
  handicapConfigured,
  inSeason,
  type LeagueReport,
  type LeagueSettings,
  type Matchup,
  type Player,
  type Score,
  type Team,
} from "@/lib/league-stats";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function suggestedDate(night: string | undefined) {
  const today = new Date();
  const idx = DAY_NAMES.findIndex((d) => (night ?? "").toLowerCase().includes(d.toLowerCase()));
  if (idx < 0) return toISO(today);
  const t = new Date(today);
  t.setDate(today.getDate() - ((today.getDay() - idx + 7) % 7));
  return toISO(t);
}
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

/* ------------------------------------------------------------ data hooks */

function useLeagueData(leagueId: string) {
  const enabled = !!leagueId;
  const league = useQuery({
    queryKey: ["lr", "league", leagueId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, night, season")
        .eq("id", leagueId)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const settings = useQuery({
    queryKey: ["lr", "settings", leagueId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_settings")
        .select("*")
        .eq("league_id", leagueId)
        .maybeSingle();
      if (error) throw error;
      return (data as LeagueSettings | null) ?? DEFAULT_SETTINGS(leagueId);
    },
  });
  const teams = useQuery({
    queryKey: ["lr", "teams", leagueId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, team_number")
        .eq("league_id", leagueId)
        .order("team_number", { nullsFirst: false })
        .order("name");
      if (error) throw error;
      return data as Team[];
    },
  });
  const players = useQuery({
    queryKey: ["lr", "players", leagueId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, first_name, last_name, team_id, is_active")
        .eq("league_id", leagueId)
        .order("last_name");
      if (error) throw error;
      return data as Player[];
    },
  });
  const scores = useQuery({
    queryKey: ["lr", "scores", leagueId],
    enabled,
    queryFn: async () => {
      const out: Score[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("scores")
          .select("player_id, week_date, game_number, score")
          .eq("league_id", leagueId)
          .order("id")
          .range(from, from + 999);
        if (error) throw error;
        out.push(...(data as Score[]));
        if ((data ?? []).length < 1000) break;
      }
      return out;
    },
  });
  const matchups = useQuery({
    queryKey: ["lr", "matchups", leagueId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_matchups")
        .select(
          "id, team_id, opponent_team_id, manual_wins, manual_losses, manual_ties, league_sessions!inner(session_date, league_id)",
        )
        .eq("league_sessions.league_id", leagueId);
      if (error) throw error;
      return (data ?? []).map((m) => ({
        ...m,
        session_date: (m.league_sessions as unknown as { session_date: string }).session_date,
      })) as (Matchup & { id: string })[];
    },
  });
  return { league, settings, teams, players, scores, matchups };
}

function useLeagueList() {
  return useQuery({
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
}

/* ------------------------------------------------------------- the panel */

export function LeagueReportsPanel() {
  const leagues = useLeagueList();
  const [leagueId, setLeagueId] = useState("");
  const [date, setDate] = useState("");
  const d = useLeagueData(leagueId);
  const settings = d.settings.data ?? DEFAULT_SETTINGS(leagueId);

  const dates = useMemo(() => {
    const set = new Set((d.scores.data ?? []).map((s) => s.week_date));
    return [...set].sort().reverse();
  }, [d.scores.data]);

  const ready =
    !!leagueId && !!date && d.teams.data && d.players.data && d.scores.data && d.matchups.data;

  const report = useMemo<LeagueReport | null>(() => {
    if (!ready) return null;
    return buildReport({
      date,
      settings,
      teams: d.teams.data!,
      players: d.players.data!,
      scores: d.scores.data!,
      matchups: d.matchups.data!,
    });
  }, [ready, date, settings, d.teams.data, d.players.data, d.scores.data, d.matchups.data]);

  return (
    <div className="space-y-6">
      <PanelIntro>
        Choose a league and bowling night, type each bowler’s games, and save. Totals, averages,
        high games and series, team standings, weekly leaders and records are all worked out
        automatically from the saved games. Reports only read scores — they never change them.
      </PanelIntro>

      <div className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-3 print:hidden">
        <div>
          <Label>League</Label>
          <Select
            value={leagueId}
            onValueChange={(id) => {
              setLeagueId(id);
              setDate(suggestedDate((leagues.data ?? []).find((l) => l.id === id)?.night));
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a league" />
            </SelectTrigger>
            <SelectContent>
              {(leagues.data ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Season</Label>
          <p className="mt-2 flex h-10 items-center rounded-md border border-border px-3 text-sm">
            {leagueId
              ? settings.season_label || d.league.data?.season || "Current season"
              : "—"}
          </p>
          {leagueId && !settings.season_start && !settings.season_end ? (
            <p className="mt-1 text-xs text-muted-foreground">
              No season dates set — all recorded games are included.
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="lr-date">Bowling date / session</Label>
          <Input
            id="lr-date"
            type="date"
            className="mt-2"
            value={date}
            disabled={!leagueId}
            onChange={(e) => setDate(e.target.value)}
          />
          {dates.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {dates.slice(0, 6).map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setDate(x)}
                  className={`rounded-full border px-2 py-0.5 text-xs ${x === date ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!leagueId ? null : (
        <Tabs defaultValue="enter">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 print:hidden">
            <TabsTrigger value="enter">Enter scores</TabsTrigger>
            <TabsTrigger value="report">League report</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="settings">League settings</TabsTrigger>
          </TabsList>
          <TabsContent value="enter" className="mt-6">
            {date && d.teams.data && d.players.data && d.scores.data ? (
              <>
                <TeamScoreEntry
                  leagueId={leagueId}
                  date={date}
                  settings={settings}
                  teams={d.teams.data}
                  players={d.players.data}
                  scores={d.scores.data}
                />
                <MatchupEditor
                  leagueId={leagueId}
                  date={date}
                  settings={settings}
                  teams={d.teams.data}
                  matchups={d.matchups.data ?? []}
                />
              </>
            ) : (
              <p className="text-muted-foreground">Loading…</p>
            )}
          </TabsContent>
          <TabsContent value="report" className="mt-6">
            {report && d.league.data ? (
              <ReportView
                report={report}
                leagueName={d.league.data.name}
                season={settings.season_label || d.league.data.season}
                date={date}
                settings={settings}
                teams={d.teams.data ?? []}
              />
            ) : (
              <p className="text-muted-foreground">Loading…</p>
            )}
          </TabsContent>
          <TabsContent value="teams" className="mt-6">
            <TeamsEditor
              leagueId={leagueId}
              teams={d.teams.data ?? []}
              players={d.players.data ?? []}
            />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            {d.settings.data ? (
              <SettingsForm key={leagueId} settings={d.settings.data} />
            ) : (
              <p className="text-muted-foreground">Loading…</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function useInvalidateLeague(leagueId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["lr"] });
    void qc.invalidateQueries({ queryKey: ["players", leagueId] });
    void qc.invalidateQueries({ queryKey: ["sessions", leagueId] });
    void qc.invalidateQueries({ queryKey: ["session-scores"] });
    void qc.invalidateQueries({ queryKey: ["history"] });
    void qc.invalidateQueries({ queryKey: ["bowler-scores"] });
  };
}

/* ------------------------------------------------------ team score entry */

function TeamScoreEntry({
  leagueId,
  date,
  settings,
  teams,
  players,
  scores,
}: {
  leagueId: string;
  date: string;
  settings: LeagueSettings;
  teams: Team[];
  players: Player[];
  scores: Score[];
}) {
  const invalidate = useInvalidateLeague(leagueId);
  const [teamId, setTeamId] = useState<string>(teams[0]?.id ?? "none");
  const gps = settings.games_per_session;
  const roster = players.filter(
    (p) => p.is_active && (teamId === "none" ? !p.team_id : p.team_id === teamId),
  );
  const existing = (pid: string, n: number) =>
    scores.find((s) => s.player_id === pid && s.week_date === date && s.game_number === n)?.score;

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const upserts: { player_id: string; league_id: string; week_date: string; game_number: number; score: number }[] = [];
      const deletes: { player_id: string; game_number: number }[] = [];
      for (const p of roster) {
        for (let n = 1; n <= gps; n += 1) {
          const raw = String(form.get(`${p.id}_${n}`) ?? "").trim();
          if (raw === "") {
            if (existing(p.id, n) != null) deletes.push({ player_id: p.id, game_number: n });
            continue;
          }
          const v = Number(raw);
          if (!Number.isInteger(v) || v < 0 || v > 450)
            throw new Error(`${fullName(p)} game ${n}: scores must be 0–450`);
          if (existing(p.id, n) !== v)
            upserts.push({ player_id: p.id, league_id: leagueId, week_date: date, game_number: n, score: v });
        }
      }
      if (upserts.length) {
        const { error } = await supabase
          .from("scores")
          .upsert(upserts, { onConflict: "player_id,week_date,game_number" });
        if (error) throw error;
      }
      for (const del of deletes) {
        const { error } = await supabase
          .from("scores")
          .delete()
          .eq("player_id", del.player_id)
          .eq("week_date", date)
          .eq("game_number", del.game_number);
        if (error) throw error;
      }
      return upserts.length + deletes.length;
    },
    onSuccess: (n) => {
      toast.success(n ? `Scores saved (${n} change${n === 1 ? "" : "s"})` : "No changes to save");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl">Enter scores</h3>
          <p className="text-sm text-muted-foreground">{prettyDate(date)}</p>
        </div>
        <div className="w-64">
          <Label>Team</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.team_number != null ? `${t.team_number}. ` : ""}
                  {t.name}
                </SelectItem>
              ))}
              <SelectItem value="none">Bowlers without a team</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {teams.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No teams yet — add them in the Teams tab. You can still enter scores for bowlers without
          a team.
        </p>
      ) : null}
      <form
        key={`${teamId}-${date}-${scores.length}`}
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(new FormData(e.currentTarget));
        }}
      >
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active bowlers here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 pr-3">Bowler</th>
                  {Array.from({ length: gps }, (_, i) => (
                    <th key={i} className="px-1 py-2">
                      Game {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium">{fullName(p)}</td>
                    {Array.from({ length: gps }, (_, i) => (
                      <td key={i} className="px-1 py-2">
                        <Input
                          name={`${p.id}_${i + 1}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={450}
                          aria-label={`${fullName(p)} game ${i + 1}`}
                          defaultValue={existing(p.id, i + 1) ?? ""}
                          className="w-20"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" disabled={save.isPending || roster.length === 0}>
            {save.isPending ? "Saving…" : "Save scores"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Leave a box empty if the game wasn’t bowled. Clearing a saved score removes it.
          </p>
        </div>
      </form>
    </div>
  );
}

/* --------------------------------------------------------- match-ups */

function MatchupEditor({
  leagueId,
  date,
  settings,
  teams,
  matchups,
}: {
  leagueId: string;
  date: string;
  settings: LeagueSettings;
  teams: Team[];
  matchups: (Matchup & { id: string })[];
}) {
  const invalidate = useInvalidateLeague(leagueId);
  const method = settings.winloss_method;
  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const { data: sess, error: se } = await supabase
        .from("league_sessions")
        .upsert(
          { league_id: leagueId, session_date: date },
          { onConflict: "league_id,session_date" },
        )
        .select("id")
        .single();
      if (se) throw se;
      const num = (k: string) => {
        const v = String(form.get(k) ?? "").trim();
        return v === "" ? null : Number(v);
      };
      const rows = teams.map((t) => {
        const opp = String(form.get(`opp_${t.id}`) ?? "");
        return {
          session_id: sess.id,
          team_id: t.id,
          opponent_team_id: opp && opp !== "none" ? opp : null,
          manual_wins: num(`w_${t.id}`),
          manual_losses: num(`l_${t.id}`),
          manual_ties: num(`t_${t.id}`),
        };
      });
      const { error } = await supabase
        .from("team_matchups")
        .upsert(rows, { onConflict: "session_id,team_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Match-ups saved — standings updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (teams.length < 2) return null;
  if (method === "not_configured")
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        Wins and losses aren’t calculated yet — choose this league’s win/loss rule in League
        settings.
      </p>
    );

  const forDate = (tid: string) =>
    matchups.find((m) => m.team_id === tid && m.session_date === date);

  return (
    <form
      key={`${date}-${matchups.length}`}
      className="mt-6 rounded-2xl border border-border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(new FormData(e.currentTarget));
      }}
    >
      <h3 className="text-2xl">
        {method === "manual" ? "Wins & losses this night" : "Who bowled whom this night"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {method === "manual"
          ? "Enter each team’s points for this night. Win percentage is worked out for you."
          : "Pick each team’s opponent. Wins and losses are worked out by comparing team totals game by game."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {teams.map((t) => {
          const m = forDate(t.id);
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/50 p-3">
              <span className="min-w-32 font-medium">{t.name}</span>
              {method === "manual" ? (
                (["w", "l", "t"] as const).map((k) => (
                  <Input
                    key={k}
                    name={`${k}_${t.id}`}
                    type="number"
                    step="0.5"
                    min={0}
                    placeholder={k === "w" ? "W" : k === "l" ? "L" : "T"}
                    aria-label={`${t.name} ${k === "w" ? "wins" : k === "l" ? "losses" : "ties"}`}
                    defaultValue={
                      (k === "w" ? m?.manual_wins : k === "l" ? m?.manual_losses : m?.manual_ties) ?? ""
                    }
                    className="w-16"
                  />
                ))
              ) : (
                <select
                  name={`opp_${t.id}`}
                  defaultValue={m?.opponent_team_id ?? "none"}
                  aria-label={`${t.name} opponent`}
                  className="h-10 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="none">No match / bye</option>
                  {teams
                    .filter((o) => o.id !== t.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        vs {o.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
      <Button type="submit" className="mt-4" disabled={save.isPending}>
        Save match-ups
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------ teams */

function TeamsEditor({
  leagueId,
  teams,
  players,
}: {
  leagueId: string;
  teams: Team[];
  players: Player[];
}) {
  const invalidate = useInvalidateLeague(leagueId);
  const run = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: unknown }>) => {
      const { error } = await fn();
      if (error) throw error as Error;
    },
    onSuccess: () => {
      toast.success("Saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border p-5">
        <h3 className="text-2xl">Teams</h3>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") ?? "").trim();
            const num = String(f.get("num") ?? "").trim();
            if (!name) return;
            run.mutate(() =>
              supabase
                .from("teams")
                .insert({ league_id: leagueId, name, team_number: num ? Number(num) : null }),
            );
            e.currentTarget.reset();
          }}
        >
          <Input name="num" type="number" placeholder="#" aria-label="Team number" className="w-20" />
          <Input name="name" placeholder="Team name" aria-label="Team name" className="flex-1" />
          <Button type="submit">Add team</Button>
        </form>
        <ul className="mt-4 divide-y divide-border">
          {teams.map((t) => (
            <li key={t.id}>
              <form
                className="flex flex-wrap items-center gap-2 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const num = String(f.get("num") ?? "").trim();
                  run.mutate(() =>
                    supabase
                      .from("teams")
                      .update({
                        name: String(f.get("name") ?? "").trim() || t.name,
                        team_number: num ? Number(num) : null,
                      })
                      .eq("id", t.id),
                  );
                }}
              >
                <Input name="num" type="number" defaultValue={t.team_number ?? ""} aria-label="Team number" className="w-20" />
                <Input name="name" defaultValue={t.name} aria-label="Team name" className="flex-1" />
                <Button type="submit" size="sm" variant="outline">
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!confirm(`Remove team ${t.name}? Bowlers and scores are kept.`)) return;
                    run.mutate(async () => {
                      const r = await supabase.from("players").update({ team_id: null }).eq("team_id", t.id);
                      if (r.error) return r;
                      return supabase.from("teams").delete().eq("id", t.id);
                    });
                  }}
                >
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-border p-5">
        <h3 className="text-2xl">Team rosters</h3>
        <p className="text-sm text-muted-foreground">
          Bowlers are added to the league in the Bowlers tab. Assign each to a team here.
        </p>
        <ul className="mt-4 divide-y divide-border">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span className={p.is_active ? "" : "text-muted-foreground line-through"}>
                {fullName(p)}
              </span>
              <select
                value={p.team_id ?? "none"}
                aria-label={`${fullName(p)} team`}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                onChange={(e) =>
                  run.mutate(() =>
                    supabase
                      .from("players")
                      .update({ team_id: e.target.value === "none" ? null : e.target.value })
                      .eq("id", p.id),
                  )
                }
              >
                <option value="none">No team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- settings */

function Choice({
  name,
  label,
  value,
  options,
  hint,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={`ls-${name}`}>{label}</Label>
      <select
        id={`ls-${name}`}
        name={name}
        defaultValue={value}
        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Num({ name, label, value, hint }: { name: string; label: string; value: number | null; hint?: string }) {
  return (
    <div>
      <Label htmlFor={`ls-${name}`}>{label}</Label>
      <Input id={`ls-${name}`} name={name} type="number" defaultValue={value ?? ""} className="mt-2" />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SettingsForm({ settings }: { settings: LeagueSettings }) {
  const invalidate = useInvalidateLeague(settings.league_id);
  const [hdcp, setHdcp] = useState(settings.handicap_enabled);
  const save = useMutation({
    mutationFn: async (f: FormData) => {
      const t = (k: string) => {
        const v = String(f.get(k) ?? "").trim();
        return v === "" ? null : v;
      };
      const n = (k: string) => (t(k) == null ? null : Number(t(k)));
      const row = {
        league_id: settings.league_id,
        season_label: t("season_label"),
        season_start: t("season_start"),
        season_end: t("season_end"),
        games_per_session: n("games_per_session") ?? 3,
        team_size: n("team_size"),
        handicap_enabled: hdcp,
        handicap_method: t("handicap_method") ?? "not_configured",
        handicap_base: n("handicap_base"),
        handicap_percent: n("handicap_percent"),
        handicap_scope: t("handicap_scope") ?? "individual",
        handicap_basis: t("handicap_basis") ?? "prior_average",
        absent_rule: t("absent_rule") ?? "not_configured",
        absent_value: n("absent_value"),
        vacant_rule: t("vacant_rule") ?? "not_configured",
        vacant_value: n("vacant_value"),
        winloss_method: t("winloss_method") ?? "not_configured",
        winloss_use_handicap: f.get("winloss_use_handicap") === "on",
        series_point: f.get("series_point") === "on",
        tie_rule: t("tie_rule") ?? "tie",
        standings_rule: t("standings_rule") ?? "win_pct",
        notes: t("notes"),
      };
      const { error } = await supabase.from("league_settings").upsert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("League settings saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const s = settings;
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(new FormData(e.currentTarget));
      }}
    >
      <p className="rounded-xl bg-secondary/60 p-4 text-sm">
        Rules left as “Not configured” are never guessed — the report will say so instead of
        showing a number.
      </p>
      <fieldset className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-2 font-display text-xl">Season</legend>
        <div>
          <Label htmlFor="ls-season_label">Season name</Label>
          <Input id="ls-season_label" name="season_label" defaultValue={s.season_label ?? ""} placeholder="2026–2027" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="ls-season_start">Start date</Label>
          <Input id="ls-season_start" name="season_start" type="date" defaultValue={s.season_start ?? ""} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="ls-season_end">End date</Label>
          <Input id="ls-season_end" name="season_end" type="date" defaultValue={s.season_end ?? ""} className="mt-2" />
        </div>
        <Num name="games_per_session" label="Games per night" value={s.games_per_session} hint="A full series = this many games." />
        <Num name="team_size" label="Bowlers per team" value={s.team_size} />
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-2 font-display text-xl">Handicap</legend>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
          <Switch id="ls-hdcp" checked={hdcp} onCheckedChange={setHdcp} />
          <Label htmlFor="ls-hdcp">Handicap enabled</Label>
        </div>
        <Choice
          name="handicap_method"
          label="Calculation method"
          value={s.handicap_method}
          options={[
            ["not_configured", "Not configured"],
            ["percent_of_difference", "Percentage of (base − average)"],
          ]}
        />
        <Num name="handicap_base" label="Handicap base" value={s.handicap_base} />
        <Num name="handicap_percent" label="Handicap percentage" value={s.handicap_percent} />
        <Choice
          name="handicap_basis"
          label="Average used"
          value={s.handicap_basis}
          options={[
            ["prior_average", "Average before that night"],
            ["current_average", "Average including that night"],
          ]}
        />
        <Choice
          name="handicap_scope"
          label="Applied to"
          value={s.handicap_scope}
          options={[
            ["individual", "Each bowler (team handicap = sum)"],
            ["team", "Team (sum of bowler handicaps)"],
          ]}
        />
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-2 font-display text-xl">Absent & vacant bowlers</legend>
        <Choice
          name="absent_rule"
          label="Absent bowler counts as"
          value={s.absent_rule}
          options={[
            ["not_configured", "Not configured (not counted)"],
            ["exclude", "Nothing — not counted"],
            ["use_average", "Their average"],
            ["fixed", "A fixed score"],
          ]}
          hint="Used for team totals only — never added to the bowler’s own record."
        />
        <Num name="absent_value" label="Absent fixed score" value={s.absent_value} />
        <Choice
          name="vacant_rule"
          label="Vacant spot counts as"
          value={s.vacant_rule}
          options={[
            ["not_configured", "Not configured (not counted)"],
            ["exclude", "Nothing — not counted"],
            ["fixed", "A fixed score"],
          ]}
          hint="Needs “Bowlers per team” set."
        />
        <Num name="vacant_value" label="Vacant fixed score" value={s.vacant_value} />
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="px-2 font-display text-xl">Wins, losses & standings</legend>
        <Choice
          name="winloss_method"
          label="Win/loss rule"
          value={s.winloss_method}
          options={[
            ["not_configured", "Not configured"],
            ["per_game_vs_opponent", "Each game vs opponent (automatic)"],
            ["manual", "Staff enter points each night"],
          ]}
        />
        <Choice
          name="tie_rule"
          label="Ties"
          value={s.tie_rule}
          options={[
            ["tie", "Recorded as a tie"],
            ["none", "No point awarded"],
          ]}
        />
        <Choice
          name="standings_rule"
          label="Standings ranked by"
          value={s.standings_rule}
          options={[
            ["win_pct", "Win % (then pins)"],
            ["wins", "Wins (then pins)"],
            ["pins", "Total scratch pins"],
            ["handicap_pins", "Total pins with handicap"],
          ]}
        />
        <div className="space-y-3 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="series_point" defaultChecked={s.series_point} /> Extra point for
            higher series total
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="winloss_use_handicap" defaultChecked={s.winloss_use_handicap} />{" "}
            Compare with handicap
          </label>
        </div>
      </fieldset>
      <div>
        <Label htmlFor="ls-notes">Notes</Label>
        <textarea
          id="ls-notes"
          name="notes"
          defaultValue={s.notes ?? ""}
          rows={3}
          className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm"
        />
      </div>
      <Button type="submit" disabled={save.isPending}>
        Save league settings
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------ report */

function ReportView({
  report: r,
  leagueName,
  season,
  date,
  settings,
  teams,
}: {
  report: LeagueReport;
  leagueName: string;
  season: string;
  date: string;
  settings: LeagueSettings;
  teams: Team[];
}) {
  const gps = r.gamesPerSession;
  const week = r.sessionDates.indexOf(date) + 1;
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "—";
  const groups: { id: string | null; name: string }[] = [
    ...teams.map((t) => ({ id: t.id as string | null, name: t.name })),
    { id: null, name: "Bowlers without a team" },
  ];
  const hasTeams = teams.length > 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()} size="lg">
          <Printer className="mr-2 h-4 w-4" /> Print League Report
        </Button>
        <p className="self-center text-sm text-muted-foreground">
          Tip: choose “Save as PDF” in the print window to keep a copy.
        </p>
      </div>

      <article id="league-report" className="league-report rounded-2xl border border-border bg-card p-6 text-card-foreground">
        <header className="border-b border-border pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Vegreville Bowling Lanes · League Report
          </p>
          <h2 className="mt-1 text-3xl">{leagueName}</h2>
          <p className="text-sm">
            {season ? `${season} · ` : ""}
            {prettyDate(date)}
            {week > 0 ? ` · Week ${week}` : " · No games recorded this night"}
          </p>
        </header>

        {!r.handicapConfigured ? (
          <p className="mt-4 text-sm italic text-muted-foreground">
            Handicap rules have not been configured for this league.
          </p>
        ) : null}

        {hasTeams ? (
          <section className="rpt-section">
            <h3>Team standings</h3>
            {!r.winLossConfigured ? (
              <p className="text-sm italic text-muted-foreground">
                Win/loss rules have not been configured for this league.
              </p>
            ) : null}
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>#</th>
                  <th className="text-left">Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Win %</th>
                  <th>Pins</th>
                  <th>Hdcp pins</th>
                  <th>Games</th>
                  <th>Avg</th>
                  <th>High G</th>
                  <th>High S</th>
                </tr>
              </thead>
              <tbody>
                {r.standings.map((t, i) => (
                  <tr key={t.team.id}>
                    <td>{i + 1}</td>
                    <td>{t.team.team_number ?? "—"}</td>
                    <td className="text-left font-medium">{t.team.name}</td>
                    <td>{t.wins ?? "—"}</td>
                    <td>{t.losses ?? "—"}</td>
                    <td>{fmtPct(t.winPct)}</td>
                    <td>{t.seasonPins}</td>
                    <td>{t.seasonHdcpPins ?? "—"}</td>
                    <td>{t.seasonGames}</td>
                    <td>{fmtAvg(t.average)}</td>
                    <td>{t.highGame ?? "—"}</td>
                    <td>{t.highSeries ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <div className="rpt-section grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <RecordTable title="Weekly leaders" rows={r.weeklyLeaders} empty="No games recorded this night." />
          <RecordTable title="Season records" rows={r.seasonRecords} empty="No games recorded yet this season." />
        </div>

        {groups.map((g) => {
          const lines = r.bowlers.filter((b) => b.player.team_id === g.id && (b.player.is_active || b.seasonGames > 0));
          if (!lines.length) return null;
          const tl = r.teams.find((t) => t.team.id === g.id);
          return (
            <section key={g.id ?? "none"} className="rpt-section rpt-team">
              <h3>
                {tl?.team.team_number != null ? `${tl.team.team_number}. ` : ""}
                {g.name}
              </h3>
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th className="text-left">Bowler</th>
                    {Array.from({ length: gps }, (_, i) => (
                      <th key={i}>G{i + 1}</th>
                    ))}
                    <th>Total</th>
                    <th>Gms</th>
                    <th>Avg</th>
                    {r.handicapConfigured ? <th>Hdcp</th> : null}
                    <th>Season pins</th>
                    <th>Season gms</th>
                    <th>Season avg</th>
                    <th>High G</th>
                    <th>High S</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((b) => (
                    <tr key={b.player.id}>
                      <td className="text-left">
                        {fullName(b.player)}
                        {b.absent ? <span className="text-muted-foreground"> (absent)</span> : null}
                      </td>
                      {b.games.map((x, i) => (
                        <td key={i}>{x ?? ""}</td>
                      ))}
                      <td className="font-semibold">{b.sessionGames ? b.sessionTotal : ""}</td>
                      <td>{b.sessionGames || ""}</td>
                      <td>{b.sessionAvg == null ? "" : fmtAvg(b.sessionAvg)}</td>
                      {r.handicapConfigured ? <td>{b.handicap ?? "—"}</td> : null}
                      <td>{b.seasonPins}</td>
                      <td>{b.seasonGames}</td>
                      <td>{fmtAvg(b.seasonAvg)}</td>
                      <td>{b.highGame ?? "—"}</td>
                      <td>{b.highSeries ?? "—"}</td>
                    </tr>
                  ))}
                  {tl ? (
                    <tr className="rpt-total">
                      <td className="text-left">Team total</td>
                      {tl.gameTotals.map((x, i) => (
                        <td key={i}>{x || ""}</td>
                      ))}
                      <td>{tl.sessionPins || ""}</td>
                      <td colSpan={r.handicapConfigured ? 8 : 7} className="text-left">
                        {tl.hdcpGameTotals
                          ? `With handicap: ${tl.hdcpGameTotals.join(" · ")} = ${tl.hdcpGameTotals.reduce((a, b) => a + b, 0)}`
                          : ""}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          );
        })}
        <footer className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
          Averages are total pins ÷ games bowled (fractions dropped). A series is a full night of{" "}
          {gps} games. {settings.notes ?? ""} Team: {teamName(null) === "—" ? "" : ""}
        </footer>
      </article>
    </div>
  );
}

function RecordTable({ title, rows, empty }: { title: string; rows: LeagueReport["weeklyLeaders"]; empty: string }) {
  return (
    <div>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <table className="rpt-table">
          <thead>
            <tr>
              <th className="text-left">Category</th>
              <th className="text-left">Name</th>
              <th className="text-left">Team</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.label}>
                <td className="text-left">{x.label}</td>
                <td className="text-left font-medium">{x.name}</td>
                <td className="text-left">{x.team}</td>
                <td className="font-semibold">{x.score}</td>
                <td>{x.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export { inSeason, handicapConfigured };
