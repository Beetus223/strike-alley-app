import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, PanelIntro, TextField } from "@/components/site/AdminField";
import {
  bowlerStats, calcMatch, f0, fPts, lineups, standings,
  type MatchOutcome, type MemberRef, type RawScore, type Rules, type StandingRow,
} from "@/lib/lm-engine";

type LmLeague = Tables<"lm_leagues">;
type LmTeam = Tables<"lm_teams">;
type LmDivision = Tables<"lm_divisions">;
type LmNight = Tables<"lm_league_nights">;
type LmMatchup = Tables<"lm_matchups">;
type LmMember = Tables<"lm_team_members">;
type LmScore = Tables<"lm_night_scores">;
type Bowler = Pick<Tables<"bowlers">, "id" | "bowler_id" | "first_name" | "last_name" | "is_active">;

const SECTIONS = [
  "Dashboard",
  "League Setup",
  "League Rules",
  "Teams",
  "Bowlers",
  "League Nights",
  "Score Entry",
  "Standings",
  "League Reports",
  "History",
] as const;
type SectionName = (typeof SECTIONS)[number];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
};

const s = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const n = (f: FormData, k: string) => {
  const v = s(f, k);
  return v == null ? null : Number(v);
};
const bowlerName = (b: Pick<Bowler, "first_name" | "last_name">) =>
  `${b.first_name} ${b.last_name}`.trim();
const selectCls =
  "mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

// ---------------- data hooks
function useLmLeagues() {
  return useQuery({
    queryKey: ["lm", "leagues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lm_leagues").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}
function useLeagueBits(leagueId: string | null) {
  return useQuery({
    queryKey: ["lm", "bits", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const id = leagueId!;
      const [div, teams, nights] = await Promise.all([
        supabase.from("lm_divisions").select("*").eq("league_id", id).order("sort_order"),
        supabase.from("lm_teams").select("*").eq("league_id", id).order("team_number"),
        supabase.from("lm_league_nights").select("*").eq("league_id", id).order("night_date"),
      ]);
      for (const r of [div, teams, nights]) if (r.error) throw r.error;
      const teamIds = (teams.data ?? []).map((t) => t.id);
      const members = teamIds.length
        ? await supabase.from("lm_team_members").select("*").in("team_id", teamIds)
        : { data: [] as LmMember[], error: null };
      if (members.error) throw members.error;
      return {
        divisions: div.data ?? [],
        teams: teams.data ?? [],
        nights: nights.data ?? [],
        members: members.data ?? [],
      };
    },
  });
}
function useBowlers() {
  return useQuery({
    queryKey: ["lm", "bowlers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bowlers")
        .select("id, bowler_id, first_name, last_name, is_active")
        .order("last_name");
      if (error) throw error;
      return data as Bowler[];
    },
  });
}
function useInvalidate() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["lm"] });
}
function useSave<T>(fn: (v: T) => PromiseLike<{ error: { message: string } | null }>, msg: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: T) => {
      const { error } = await fn(v);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(msg);
      inv();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------------- shell
export function LeagueManagement() {
  const [section, setSection] = useState<SectionName>("Dashboard");
  const leagues = useLmLeagues();
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const activeId = leagueId ?? leagues.data?.[0]?.id ?? null;
  const league = leagues.data?.find((l) => l.id === activeId) ?? null;
  const needsLeague = !["Dashboard", "League Setup"].includes(section);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label="League Management" className="flex flex-wrap gap-2 lg:flex-col">
        {SECTIONS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSection(name)}
            aria-current={section === name ? "page" : undefined}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
              section === name
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface hover:border-primary"
            }`}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="min-w-0">
        <h2 className="text-3xl">{section}</h2>
        {needsLeague && (
          <div className="mt-4 max-w-sm">
            <Label htmlFor="lm-league">League</Label>
            <select
              id="lm-league"
              className={selectCls}
              value={activeId ?? ""}
              onChange={(e) => setLeagueId(e.target.value || null)}
            >
              {(leagues.data ?? []).length === 0 && <option value="">No leagues yet</option>}
              {(leagues.data ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.season ? `(${l.season})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-6">
          {section === "Dashboard" && (
            <Dashboard leagues={leagues.data ?? []} go={setSection} />
          )}
          {section === "League Setup" && <LeagueSetup leagues={leagues.data ?? []} />}
          {needsLeague && !league && (
            <Empty>Create an internal league in League Setup first.</Empty>
          )}
          {needsLeague && league && <LeagueSection section={section} league={league} />}
        </div>
      </div>
    </div>
  );
}

function LeagueSection({ section, league }: { section: SectionName; league: LmLeague }) {
  const bits = useLeagueBits(league.id);
  if (bits.isLoading || !bits.data) return <p className="text-muted-foreground">Loading…</p>;
  const d = bits.data;
  switch (section) {
    case "Teams":
      return <Teams league={league} {...d} />;
    case "Bowlers":
      return <BowlersView league={league} {...d} />;
    case "League Nights":
      return <Nights league={league} {...d} />;
    case "Score Entry":
      return <ScoreEntry league={league} {...d} />;
    case "League Rules":
      return <Rules league={league} />;
    case "Standings":
      return <Standings league={league} {...d} />;
    case "League Reports":
      return <Reports league={league} {...d} />;
    case "History":
      return <History league={league} {...d} />;
    default:
      return null;
  }
}

// ---------------- small UI
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">
      {children}
    </div>
  );
}
function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface p-5">{children}</div>;
}
// ---------------- Dashboard
function Dashboard({ leagues, go }: { leagues: LmLeague[]; go: (s: SectionName) => void }) {
  const steps: [SectionName, string][] = [
    ["League Setup", "Create the league: day, games per night, divisions."],
    ["League Rules", "Record the league's handicap and points rules."],
    ["Teams", "Add teams and put bowlers on them."],
    ["League Nights", "Add each week and who bowls who."],
    ["Score Entry", "Type in raw scores for each matchup."],
    ["History", "Review completed weeks."],
  ];
  return (
    <div className="space-y-6">
      <PanelIntro>
        This is the internal league system. It is separate from the public Leagues listing, so
        editing the website never changes league scores.
      </PanelIntro>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map(([name, text], i) => (
          <button
            key={name}
            type="button"
            onClick={() => go(name)}
            className="rounded-xl border border-border bg-surface p-5 text-left hover:border-primary"
          >
            <span className="text-xs font-bold text-primary">STEP {i + 1}</span>
            <span className="mt-1 block font-display text-2xl">{name}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
          </button>
        ))}
      </div>
      <Card>
        <h3 className="text-xl">Internal leagues</h3>
        {leagues.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {leagues.map((l) => (
              <li key={l.id}>
                <strong>{l.name}</strong> · {l.league_code}
                {l.bowling_day != null ? ` · ${DAYS[l.bowling_day]}` : ""}
                {l.is_active ? "" : " · inactive"}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------------- League Setup
function LeagueSetup({ leagues }: { leagues: LmLeague[] }) {
  const [editing, setEditing] = useState<LmLeague | "new" | null>(null);
  const publicLeagues = useQuery({
    queryKey: ["lm", "public-leagues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leagues").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const inv = useInvalidate();
  const save = useMutation({
    mutationFn: async ({ form, id }: { form: FormData; id?: string }) => {
      const row = {
        league_code: s(form, "league_code") ?? "",
        name: s(form, "name") ?? "",
        season: s(form, "season"),
        start_date: s(form, "start_date"),
        end_date: s(form, "end_date"),
        bowling_day: n(form, "bowling_day"),
        start_time: s(form, "start_time"),
        games_per_night: n(form, "games_per_night") ?? 4,
        team_count: n(form, "team_count"),
        bowlers_per_team: n(form, "bowlers_per_team"),
        division_count: n(form, "division_count") ?? 0,
        is_active: form.get("is_active") === "on",
        notes: s(form, "notes"),
        public_league_id: s(form, "public_league_id"),
      };
      if (!row.name || !row.league_code) throw new Error("League ID and name are required.");
      const res = id
        ? await supabase.from("lm_leagues").update(row).eq("id", id).select().single()
        : await supabase.from("lm_leagues").insert(row).select().single();
      if (res.error) throw new Error(res.error.message);
      // Make sure division letters exist (A, B, C…); never delete existing ones.
      const codes = Array.from({ length: row.division_count }, (_, i) => String.fromCharCode(65 + i));
      if (codes.length) {
        await supabase.from("lm_divisions").upsert(
          codes.map((c, i) => ({ league_id: res.data.id, code: c, name: `Division ${c}`, sort_order: i })),
          { onConflict: "league_id,code", ignoreDuplicates: true },
        );
      }
      if (!id) await supabase.from("lm_league_rules").insert({ league_id: res.data.id });
    },
    onSuccess: () => {
      toast.success("League saved");
      setEditing(null);
      inv();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useSave(
    (id: string) => supabase.from("lm_leagues").update({ is_active: false }).eq("id", id),
    "League marked inactive",
  );

  if (editing) {
    const l = editing === "new" ? null : editing;
    return (
      <form
        className="grid max-w-3xl gap-4 sm:grid-cols-2"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          save.mutate({ form: new FormData(e.currentTarget), ...(l ? { id: l.id } : {}) });
        }}
      >
        <Field label="League ID" name="league_code" required defaultValue={l?.league_code} placeholder="e.g. MON-MIXED" />
        <Field label="League name" name="name" required defaultValue={l?.name} />
        <Field label="Season" name="season" defaultValue={l?.season} placeholder="e.g. 2026–2027" />
        <div>
          <Label htmlFor="bd">Bowling day</Label>
          <select id="bd" name="bowling_day" className={selectCls} defaultValue={l?.bowling_day ?? ""}>
            <option value="">—</option>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <Field label="Start date" name="start_date" type="date" defaultValue={l?.start_date} />
        <Field label="End date" name="end_date" type="date" defaultValue={l?.end_date} />
        <Field label="Start time" name="start_time" defaultValue={l?.start_time} placeholder="e.g. 7:00 PM" />
        <Field label="Games per night" name="games_per_night" type="number" defaultValue={l?.games_per_night ?? 4} />
        <Field label="Number of teams" name="team_count" type="number" defaultValue={l?.team_count} />
        <Field label="Bowlers per team" name="bowlers_per_team" type="number" defaultValue={l?.bowlers_per_team} />
        <Field label="Number of divisions" name="division_count" type="number" defaultValue={l?.division_count ?? 4} hint="Divisions A, B, C… are created automatically." />
        <div>
          <Label htmlFor="pl">Linked public listing (optional)</Label>
          <select id="pl" name="public_league_id" className={selectCls} defaultValue={l?.public_league_id ?? ""}>
            <option value="">Not linked</option>
            {(publicLeagues.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <TextField label="League notes" name="notes" defaultValue={l?.notes} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="is_active" defaultChecked={l?.is_active ?? true} /> Active league
        </label>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" size="lg" disabled={save.isPending}>Save league</Button>
          <Button type="button" size="lg" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
        </div>
      </form>
    );
  }
  return (
    <div className="space-y-4">
      <PanelIntro>
        Internal leagues are separate from the public Leagues listing. Linking one is optional and
        never changes the website.
      </PanelIntro>
      <Button size="lg" onClick={() => setEditing("new")}>Add league</Button>
      {leagues.length === 0 && <Empty>No internal leagues yet.</Empty>}
      <div className="grid gap-3 md:grid-cols-2">
        {leagues.map((l) => (
          <Card key={l.id}>
            <p className="text-xs font-bold text-primary">{l.league_code}</p>
            <h3 className="text-2xl">{l.name}</h3>
            <p className="text-sm text-muted-foreground">
              {[l.season, l.bowling_day != null ? DAYS[l.bowling_day] : null, l.start_time, `${l.games_per_night} games`, `${l.division_count} divisions`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {!l.is_active && <p className="mt-1 text-xs font-semibold text-destructive">Inactive</p>}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setEditing(l)}>Edit</Button>
              {l.is_active && (
                <Button variant="ghost" onClick={() => remove.mutate(l.id)}>Make inactive</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------- League Rules
function Rules({ league }: { league: LmLeague }) {
  const rules = useQuery({
    queryKey: ["lm", "rules", league.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lm_league_rules").select("*").eq("league_id", league.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const save = useSave((form: FormData) =>
    supabase.from("lm_league_rules").upsert({
      league_id: league.id,
      handicap_method: s(form, "handicap_method") ?? "not_configured",
      handicap_percent: n(form, "handicap_percent"),
      handicap_base: n(form, "handicap_base"),
      points_with_handicap: form.get("points_with_handicap") === "on",
      game_points: n(form, "game_points"),
      series_points: n(form, "series_points"),
      team_points: n(form, "team_points"),
      match_point_rule: s(form, "match_point_rule"),
      high_block_scratch: form.get("high_block_scratch") === "on",
      high_single_scratch: form.get("high_single_scratch") === "on",
      needs_confirmation: form.get("needs_confirmation") === "on",
      confirmation_notes: s(form, "confirmation_notes"),
      custom_rules: s(form, "custom_rules"),
    }),
  "Rules saved");
  if (rules.isLoading) return <p>Loading…</p>;
  const r = rules.data;
  return (
    <form
      key={r?.updated_at ?? "new"}
      className="grid max-w-3xl gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(new FormData(e.currentTarget));
      }}
    >
      <p className="text-sm text-muted-foreground sm:col-span-2">
        Rules belong to this league only. Score Entry, Standings and Reports use these numbers
        automatically. Leave anything unclear blank and keep "Needs confirmation" ticked.
      </p>
      <div>
        <Label htmlFor="hm">Handicap method</Label>
        <select id="hm" name="handicap_method" className={selectCls} defaultValue={r?.handicap_method ?? "not_configured"}>
          <option value="not_configured">Not configured</option>
          <option value="difference_between_bowlers">% of difference between the two bowlers' averages</option>
          <option value="percent_of_base">% of difference from a base score</option>
          <option value="none">Scratch (no handicap)</option>
        </select>
      </div>
      <Field label="Handicap %" name="handicap_percent" type="number" defaultValue={r?.handicap_percent} placeholder="e.g. 80" />
      <Field label="Handicap base (if used)" name="handicap_base" type="number" defaultValue={r?.handicap_base} />
      <Field label="Points per game" name="game_points" type="number" defaultValue={r?.game_points} />
      <Field label="Points for total series" name="series_points" type="number" defaultValue={r?.series_points} />
      <Field label="Team / match points" name="team_points" type="number" defaultValue={r?.team_points} />
      <div className="sm:col-span-2">
        <TextField label="How match points work (plain words)" name="match_point_rule" defaultValue={r?.match_point_rule} placeholder="e.g. Division A bowls Division A; winning team gets 2 points…" />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="points_with_handicap" defaultChecked={r?.points_with_handicap ?? false} /> Points are taken with handicap</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="high_block_scratch" defaultChecked={r?.high_block_scratch ?? true} /> High 4-game block is scratch</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="high_single_scratch" defaultChecked={r?.high_single_scratch ?? true} /> High singles are scratch</label>
      <label className="flex items-center gap-2 text-sm font-semibold text-primary"><input type="checkbox" name="needs_confirmation" defaultChecked={r?.needs_confirmation ?? true} /> Needs confirmation</label>
      <div className="sm:col-span-2">
        <TextField label="Questions to confirm" name="confirmation_notes" defaultValue={r?.confirmation_notes} />
      </div>
      <div className="sm:col-span-2">
        <TextField label="Other league rules" name="custom_rules" defaultValue={r?.custom_rules} />
      </div>
      <Button type="submit" size="lg" className="sm:col-span-2 sm:w-fit" disabled={save.isPending}>Save rules</Button>
    </form>
  );
}

// ---------------- Teams
type Bits = { divisions: LmDivision[]; teams: LmTeam[]; nights: LmNight[]; members: LmMember[] };

function Teams({ league, divisions, teams, members }: Bits & { league: LmLeague }) {
  const bowlers = useBowlers();
  const byId = useMemo(() => new Map((bowlers.data ?? []).map((b) => [b.id, b])), [bowlers.data]);
  const addTeam = useSave((form: FormData) =>
    supabase.from("lm_teams").insert({ league_id: league.id, name: s(form, "name") ?? "Team", team_number: n(form, "team_number") }),
  "Team added");
  const updTeam = useSave((v: { id: string; patch: Partial<LmTeam> }) => supabase.from("lm_teams").update(v.patch).eq("id", v.id), "Team updated");
  const addMember = useSave((v: { team_id: string; bowler_id: string; division_id: string | null; is_substitute: boolean; entering_average: number | null }) =>
    supabase.from("lm_team_members").insert(v), "Bowler added to team");
  const updMember = useSave((v: { id: string; patch: Partial<LmMember> }) => supabase.from("lm_team_members").update(v.patch).eq("id", v.id), "Updated");

  return (
    <div className="space-y-6">
      <PanelIntro>
        Renaming a team or changing its roster only affects future weeks. Saved league nights keep
        the names as they were.
      </PanelIntro>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          addTeam.mutate(new FormData(e.currentTarget));
          e.currentTarget.reset();
        }}
      >
        <div className="w-28"><Field label="Team #" name="team_number" type="number" /></div>
        <div className="w-64"><Field label="Team name" name="name" required /></div>
        <Button type="submit" size="lg">Add team</Button>
      </form>
      {teams.length === 0 && <Empty>No teams yet.</Empty>}
      <div className="grid gap-4 xl:grid-cols-2">
        {teams.map((t) => {
          const roster = members.filter((m) => m.team_id === t.id);
          return (
            <Card key={t.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-2xl">
                  {t.team_number != null ? `#${t.team_number} ` : ""}{t.name}
                  {!t.is_active && <span className="ml-2 text-xs text-destructive">inactive</span>}
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const name = window.prompt("New team name", t.name);
                    if (name?.trim()) updTeam.mutate({ id: t.id, patch: { name: name.trim() } });
                  }}>Rename</Button>
                  <Button size="sm" variant="ghost" onClick={() => updTeam.mutate({ id: t.id, patch: { is_active: !t.is_active } })}>
                    {t.is_active ? "Make inactive" : "Reactivate"}
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor={`cap-${t.id}`}>Captain</Label>
                <select id={`cap-${t.id}`} className={selectCls} value={t.captain_bowler_id ?? ""}
                  onChange={(e) => updTeam.mutate({ id: t.id, patch: { captain_bowler_id: e.target.value || null } })}>
                  <option value="">—</option>
                  {roster.map((m) => { const b = byId.get(m.bowler_id); return b ? <option key={m.id} value={b.id}>{bowlerName(b)}</option> : null; })}
                </select>
              </div>
              <ul className="mt-4 divide-y divide-border text-sm">
                {roster.map((m) => {
                  const b = byId.get(m.bowler_id);
                  return (
                    <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
                      <span className="flex-1 font-semibold">
                        {b ? bowlerName(b) : "Unknown"} <span className="text-muted-foreground">{b?.bowler_id}</span>
                        {m.is_substitute && <span className="ml-1 text-xs text-accent">sub</span>}
                        {!m.is_active && <span className="ml-1 text-xs text-destructive">inactive</span>}
                      </span>
                      <select aria-label="Division" className="h-9 rounded-md border border-input bg-background px-2" value={m.division_id ?? ""}
                        onChange={(e) => updMember.mutate({ id: m.id, patch: { division_id: e.target.value || null } })}>
                        <option value="">No division</option>
                        {divisions.map((d) => <option key={d.id} value={d.id}>{d.name ?? d.code}</option>)}
                      </select>
                      <Button size="sm" variant="ghost" onClick={() => updMember.mutate({ id: m.id, patch: { is_active: !m.is_active } })}>
                        {m.is_active ? "Remove" : "Restore"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const bid = s(f, "bowler_id");
                if (!bid) return;
                addMember.mutate({ team_id: t.id, bowler_id: bid, division_id: s(f, "division_id"), is_substitute: f.get("sub") === "on", entering_average: n(f, "entering_average") });
                e.currentTarget.reset();
              }}>
                <select name="bowler_id" aria-label="Bowler" className="h-10 min-w-48 flex-1 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Add existing bowler…</option>
                  {(bowlers.data ?? []).filter((b) => b.is_active && !roster.some((m) => m.bowler_id === b.id)).map((b) => (
                    <option key={b.id} value={b.id}>{bowlerName(b)} ({b.bowler_id})</option>
                  ))}
                </select>
                <select name="division_id" aria-label="Division" className="h-10 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Division</option>
                  {divisions.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
                </select>
                <Input name="entering_average" type="number" min={0} max={450} placeholder="Entering avg" aria-label="Entering average" className="h-10 w-32" />
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sub" /> Sub</label>
                <Button type="submit">Add</Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- League Nights
function useMatchups(nightIds: string[]) {
  return useQuery({
    queryKey: ["lm", "matchups", nightIds],
    enabled: nightIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("lm_matchups").select("*").in("night_id", nightIds);
      if (error) throw error;
      return data;
    },
  });
}

function Nights({ league, nights, teams }: Bits & { league: LmLeague }) {
  const matchups = useMatchups(nights.map((x) => x.id));
  const addNight = useSave((f: FormData) => supabase.from("lm_league_nights").insert({
    league_id: league.id, night_date: s(f, "night_date") ?? "", week_number: n(f, "week_number"), notes: s(f, "notes"),
  }), "League night added");
  const setStatus = useSave((v: { id: string; status: string }) => supabase.from("lm_league_nights").update({
    status: v.status, completed_at: v.status === "completed" ? new Date().toISOString() : null,
  }).eq("id", v.id), "Status updated");
  const addMatch = useSave((v: { night_id: string; a: string; b: string }) => supabase.from("lm_matchups").insert({
    night_id: v.night_id, team_a_id: v.a, team_b_id: v.b,
    team_a_name: teams.find((t) => t.id === v.a)?.name ?? null,
    team_b_name: teams.find((t) => t.id === v.b)?.name ?? null,
  }), "Matchup added");
  const delMatch = useSave((id: string) => supabase.from("lm_matchups").delete().eq("id", id), "Matchup removed");
  const active = teams.filter((t) => t.is_active);

  return (
    <div className="space-y-6">
      <PanelIntro>Add each week, then choose which teams bowl against each other. Mark a night Completed when it's final — completed nights are locked so history can't change by accident.</PanelIntro>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); addNight.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
        <div className="w-28"><Field label="Week #" name="week_number" type="number" defaultValue={nights.length + 1} /></div>
        <div className="w-48"><Field label="Date" name="night_date" type="date" required /></div>
        <div className="w-64"><Field label="Notes" name="notes" /></div>
        <Button type="submit" size="lg">Add league night</Button>
      </form>
      {nights.length === 0 && <Empty>No league nights yet.</Empty>}
      <div className="space-y-3">
        {[...nights].reverse().map((night) => {
          const ms = (matchups.data ?? []).filter((m) => m.night_id === night.id);
          const locked = night.status === "completed";
          return (
            <Card key={night.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl">Week {night.week_number ?? "—"} · {night.night_date}</h3>
                <select aria-label="Status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={night.status}
                  onChange={(e) => setStatus.mutate({ id: night.id, status: e.target.value })}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {night.notes && <p className="text-sm text-muted-foreground">{night.notes}</p>}
              <ul className="mt-3 space-y-1 text-sm">
                {ms.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span className="flex-1">{m.team_a_name} <span className="text-muted-foreground">vs</span> {m.team_b_name}</span>
                    {!locked && <Button size="sm" variant="ghost" onClick={() => delMatch.mutate(m.id)}>Remove</Button>}
                  </li>
                ))}
              </ul>
              {!locked && active.length >= 2 && (
                <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const a = s(f, "a"), b = s(f, "b");
                  if (!a || !b || a === b) { toast.error("Pick two different teams."); return; }
                  addMatch.mutate({ night_id: night.id, a, b });
                }}>
                  {(["a", "b"] as const).map((k) => (
                    <select key={k} name={k} aria-label={k === "a" ? "Team" : "Opponent"} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
                      <option value="">{k === "a" ? "Team…" : "vs team…"}</option>
                      {active.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  ))}
                  <Button type="submit" variant="outline">Add matchup</Button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}


// ---------------- engine glue
function useLeagueEngine(league: LmLeague, bits: Bits) {
  const bowlers = useBowlers();
  const extra = useQuery({
    queryKey: ["lm", "engine", league.id, bits.nights.map((x) => x.id).join(",")],
    queryFn: async () => {
      const ids = bits.nights.map((x) => x.id);
      const [rules, scores, matchups] = await Promise.all([
        supabase.from("lm_league_rules").select("*").eq("league_id", league.id).maybeSingle(),
        ids.length ? supabase.from("lm_night_scores").select("*").in("night_id", ids).order("created_at") : Promise.resolve({ data: [] as LmScore[], error: null }),
        ids.length ? supabase.from("lm_matchups").select("*").in("night_id", ids) : Promise.resolve({ data: [] as LmMatchup[], error: null }),
      ]);
      for (const r of [rules, scores, matchups]) if (r.error) throw r.error;
      return { rules: rules.data as Rules | null, scores: (scores.data ?? []) as LmScore[], matchups: (matchups.data ?? []) as LmMatchup[] };
    },
  });
  const names = useMemo(() => new Map((bowlers.data ?? []).map((b) => [b.id, bowlerName(b)])), [bowlers.data]);
  const memberRefs: MemberRef[] = bits.members.map((m) => ({
    team_id: m.team_id, bowler_id: m.bowler_id, is_active: m.is_active,
    entering_average: m.entering_average == null ? null : Number(m.entering_average),
    division_code: bits.divisions.find((d) => d.id === m.division_id)?.code ?? null,
  }));
  const gpn = league.games_per_night;
  const outcome = (night: LmNight, match: LmMatchup, nightScores?: RawScore[]): MatchOutcome => {
    const all = extra.data?.scores ?? [];
    const scores = nightScores ?? all.filter((x) => x.night_id === night.id);
    const { a, b } = lineups(match, night, memberRefs, scores, all, bits.nights, names, gpn);
    return { night, match, result: calcMatch(a, b, gpn, extra.data?.rules ?? null) };
  };
  const completed = bits.nights.filter((x) => x.status === "completed");
  const outcomesFor = (nights: LmNight[]) =>
    nights.flatMap((nt) => (extra.data?.matchups ?? []).filter((m) => m.night_id === nt.id).map((m) => outcome(nt, m)));
  const completedScores = (extra.data?.scores ?? []).filter((x) => completed.some((n) => n.id === x.night_id));
  return {
    ready: !!extra.data && !bowlers.isLoading,
    rules: extra.data?.rules ?? null,
    scores: extra.data?.scores ?? [],
    matchups: extra.data?.matchups ?? [],
    names, memberRefs, gpn, outcome, outcomesFor, completed, completedScores, bowlers: bowlers.data ?? [],
  };
}

// ---------------- Bowlers
function BowlersView({ league, ...bits }: Bits & { league: LmLeague }) {
  const eng = useLeagueEngine(league, bits);
  const [q, setQ] = useState("");
  const inv = useInvalidate();
  const add = useMutation({
    mutationFn: async (f: FormData) => {
      const first = s(f, "first_name"), last = s(f, "last_name");
      if (!first || !last) throw new Error("First and last name are required.");
      for (let i = 0; i < 8; i++) {
        const id = `VB-${Math.floor(10000 + Math.random() * 90000)}`;
        const { error } = await supabase.from("bowlers").insert({ bowler_id: id, first_name: first, last_name: last, email: s(f, "email"), phone: s(f, "phone") });
        if (!error) return id;
        if (error.code !== "23505") throw new Error(error.message);
      }
      throw new Error("Could not create a unique Bowler ID. Try again.");
    },
    onSuccess: (id) => { toast.success(`Bowler added — Bowler ID ${id}`); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const upd = useSave((v: { id: string; patch: Partial<Tables<"bowlers">> }) => supabase.from("bowlers").update(v.patch).eq("id", v.id), "Bowler updated");
  const stats = new Map(bowlerStats(eng.completedScores, eng.gpn).map((x) => [x.bowler_id, x]));
  const list = eng.bowlers.filter((b) => `${bowlerName(b)} ${b.bowler_id}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PanelIntro>Add every league bowler once here. Then put them on a team in Teams. Stats below come only from completed league nights in this league.</PanelIntro>
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" onSubmit={(e) => { e.preventDefault(); add.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
        <Field label="First name" name="first_name" required />
        <Field label="Last name" name="last_name" required />
        <Field label="Email (optional)" name="email" type="email" />
        <Field label="Phone (optional)" name="phone" />
        <Button type="submit" size="lg" disabled={add.isPending}>Add bowler</Button>
      </form>
      <div className="max-w-sm"><Label htmlFor="bq">Search by name or Bowler ID</Label><Input id="bq" className="mt-2" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 ? <Empty>No bowlers yet.</Empty> : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left"><tr>
              {["Bowler ID", "Name", "Team", "Div", "Status", "Games", "Pins", "Average", "High game", "High series", "High 4-game block", ""].map((h) => <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map((b) => {
                const m = bits.members.find((x) => x.bowler_id === b.id && x.is_active);
                const st = stats.get(b.id);
                return (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{b.bowler_id}</td>
                    <td className="px-3 py-2 font-semibold">{bowlerName(b)}</td>
                    <td className="px-3 py-2">{bits.teams.find((t) => t.id === m?.team_id)?.name ?? "—"}</td>
                    <td className="px-3 py-2">{bits.divisions.find((d) => d.id === m?.division_id)?.code ?? "—"}</td>
                    <td className="px-3 py-2">{!b.is_active ? "Inactive" : m?.is_substitute ? "Substitute" : m ? "Regular" : "Not on a team"}</td>
                    <td className="px-3 py-2 tabular-nums">{st?.games ?? 0}</td>
                    <td className="px-3 py-2 tabular-nums">{st?.pins ?? 0}</td>
                    <td className="px-3 py-2 tabular-nums">{f0(st?.average ?? (m?.entering_average != null ? Number(m.entering_average) : null))}</td>
                    <td className="px-3 py-2 tabular-nums">{f0(st?.highGame)}</td>
                    <td className="px-3 py-2 tabular-nums">{f0(st?.highSeries)}</td>
                    <td className="px-3 py-2 tabular-nums">{f0(st?.highBlock)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => {
                        const first = window.prompt("First name", b.first_name); if (first == null) return;
                        const last = window.prompt("Last name", b.last_name); if (last == null) return;
                        upd.mutate({ id: b.id, patch: { first_name: first.trim() || b.first_name, last_name: last.trim() || b.last_name } });
                      }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: b.id, patch: { is_active: !b.is_active } })}>{b.is_active ? "Make inactive" : "Reactivate"}</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------- match result display (shared by Score Entry, Reports, History)
function MatchResultView({ o, gpn, rules }: { o: MatchOutcome; gpn: number; rules: Rules | null }) {
  const r = o.result;
  const useH = !!rules?.points_with_handicap;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xl">{o.match.team_a_name} <span className="text-muted-foreground">vs</span> {o.match.team_b_name}</h4>
        <p className="font-display text-2xl">{fPts(r.pointsA)} – {fPts(r.pointsB)} <span className="text-sm text-muted-foreground">points</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="rpt-table w-full text-sm">
          <thead><tr className="text-left">
            <th className="pr-2">Div</th><th className="pr-2">Bowler</th><th className="pr-2">Avg</th><th className="pr-2">Hdcp</th>
            {Array.from({ length: gpn }, (_, i) => <th key={i} className="px-1">G{i + 1}</th>)}
            <th className="px-1">Series</th><th className="px-1">Pts</th>
          </tr></thead>
          <tbody>
            {r.mode === "team" && ([["a", r.bowlersA], ["b", r.bowlersB]] as const).flatMap(([k, list]) => [
              ...list.map((bw, j) => {
                const scratch = bw.games.filter((x): x is number => x != null).reduce((a, b) => a + b, 0);
                return (
                  <tr key={k + bw.bowler_id} className={`border-t border-border ${j === 0 ? "border-t-2" : ""}`}>
                    <td className="pr-2">{bw.division ?? "—"}</td>
                    <td className="pr-2 font-semibold">{bw.name}</td>
                    <td className="pr-2 tabular-nums">{bw.average == null ? <span className="text-muted-foreground">not est.</span> : f0(bw.average)}</td>
                    <td className="pr-2"></td>
                    {Array.from({ length: gpn }, (_, i) => <td key={i} className="px-1 tabular-nums">{bw.games[i] ?? "—"}</td>)}
                    <td className="px-1 tabular-nums">{scratch || "—"}</td><td></td>
                  </tr>
                );
              }),
              <tr key={k + "tot"} className="border-t border-border font-semibold">
                <td></td>
                <td className="pr-2">{k === "a" ? o.match.team_a_name : o.match.team_b_name} {useH ? "(with hdcp)" : "(scratch)"}</td>
                <td></td>
                <td className="pr-2 tabular-nums">{(k === "a" ? r.teamHc?.a : r.teamHc?.b) || ""}</td>
                {r.teamGames.map((tg, i) => <td key={i} className="px-1 tabular-nums">{(k === "a" ? tg.a : tg.b) ?? "—"}</td>)}
                <td className="px-1 tabular-nums">{k === "a" ? (useH ? r.teamHdcpA : r.teamTotalA) : (useH ? r.teamHdcpB : r.teamTotalB)}</td>
                <td className="px-1 tabular-nums">{fPts(k === "a" ? r.pointsA : r.pointsB)}</td>
              </tr>,
            ])}
            {r.divisions.flatMap((d) => (["a", "b"] as const).map((k) => {
              const bw = d[k]; const hc = d.hc[k]; const idx = k === "a" ? 0 : 1;
              const pts = d.gamePts.reduce((s2, p) => s2 + p[idx], 0) + d.seriesPts[idx];
              const scratch = (bw?.games ?? []).filter((x): x is number => x != null).reduce((a, b) => a + b, 0);
              return (
                <tr key={d.division + k} className={`border-t border-border ${k === "b" ? "" : "border-t-2"}`}>
                  <td className="pr-2">{d.division}</td>
                  <td className="pr-2 font-semibold">{bw?.name ?? <span className="text-muted-foreground">no bowler</span>}</td>
                  <td className="pr-2 tabular-nums">{f0(bw?.average)}</td>
                  <td className="pr-2 tabular-nums">{hc || ""}</td>
                  {Array.from({ length: gpn }, (_, i) => <td key={i} className="px-1 tabular-nums">{bw?.games[i] ?? "—"}{hc && bw?.games[i] != null ? <span className="text-muted-foreground"> ({(bw.games[i] ?? 0) + hc})</span> : null}</td>)}
                  <td className="px-1 tabular-nums">{scratch || "—"}</td>
                  <td className="px-1 tabular-nums font-semibold">{fPts(pts)}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border border-border p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Points breakdown ({o.match.team_a_name} – {o.match.team_b_name})</p>
        <table className="text-sm tabular-nums"><tbody>
          {r.breakdown.games.map((p, i) => <tr key={i}><td className="pr-4">Game {i + 1}</td><td>{fPts(p[0])} – {fPts(p[1])}</td></tr>)}
          <tr><td className="pr-4">Series</td><td>{fPts(r.breakdown.series[0])} – {fPts(r.breakdown.series[1])}</td></tr>
          <tr><td className="pr-4">Team/Match</td><td>{fPts(r.breakdown.team[0])} – {fPts(r.breakdown.team[1])}</td></tr>
          <tr className="border-t border-border font-semibold"><td className="pr-4">Total</td><td>{fPts(r.pointsA)} – {fPts(r.pointsB)}</td></tr>
        </tbody></table>
      </div>
      {r.warnings.length > 0 && (
        <ul className="rpt-noprint list-disc space-y-0.5 rounded-lg border border-primary/40 bg-primary/5 p-3 pl-6 text-xs">
          {r.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
      <ul className="text-xs text-muted-foreground">
        {r.mode === "team" && r.teamHc && <li>Team-vs-team scoring (no divisions assigned). Handicap: {r.teamHc.explain}</li>}
        {r.divisions.map((d) => <li key={d.division}>Division {d.division}: {d.hc.explain}</li>)}
        <li>Team totals — scratch {r.teamTotalA} vs {r.teamTotalB}; with handicap {r.teamHdcpA} vs {r.teamHdcpB}. Team points {fPts(r.teamPts[0])} – {fPts(r.teamPts[1])} ({useH ? "with handicap" : "scratch"}).</li>
      </ul>
    </div>
  );
}

// ---------------- Score Entry
function ScoreEntry({ league, ...bits }: Bits & { league: LmLeague }) {
  const eng = useLeagueEngine(league, bits);
  const { nights, teams, members, divisions } = bits;
  const [nightId, setNightId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const night = nights.find((x) => x.id === nightId);
  const nightMatches = eng.matchups.filter((m) => m.night_id === nightId);
  const match = nightMatches.find((m) => m.id === matchId);
  const inv = useInvalidate();
  const gpn = league.games_per_night;
  const locked = night?.status === "completed";
  const saved = (bid: string, g: number) => eng.scores.find((x) => x.night_id === nightId && x.bowler_id === bid && x.game_number === g)?.score;
  const key = (bid: string, g: number) => `${bid}-${g}`;
  const val = (bid: string, g: number) => draft[key(bid, g)] ?? (saved(bid, g)?.toString() ?? "");

  const roster = (teamId: string | null) =>
    members.filter((x) => x.team_id === teamId && x.is_active)
      .sort((a, b) => (divisions.find((d) => d.id === a.division_id)?.sort_order ?? 99) - (divisions.find((d) => d.id === b.division_id)?.sort_order ?? 99));

  const buildRows = () => {
    if (!match || !night) return { rows: [] as TablesInsert<"lm_night_scores">[], clears: [] as { bowler_id: string; game_number: number }[] };
    const rows: TablesInsert<"lm_night_scores">[] = [];
    const clears: { bowler_id: string; game_number: number }[] = [];
    for (const teamId of [match.team_a_id, match.team_b_id]) {
      const team = teams.find((t) => t.id === teamId);
      if (!team) continue;
      for (const m of roster(team.id)) {
        const name = eng.names.get(m.bowler_id) ?? null;
        for (let g = 1; g <= gpn; g++) {
          const raw = val(m.bowler_id, g).trim();
          if (raw === "") { clears.push({ bowler_id: m.bowler_id, game_number: g }); continue; }
          const score = Number(raw);
          if (!Number.isInteger(score) || score < 0 || score > 450) throw new Error(`Scores must be whole numbers 0–450 (${name ?? ""}, game ${g}).`);
          rows.push({
            night_id: night.id, matchup_id: match.id, team_id: team.id, bowler_id: m.bowler_id,
            team_name: team.name, bowler_name: name,
            division_code: divisions.find((d) => d.id === m.division_id)?.code ?? null,
            game_number: g, score,
          });
        }
      }
    }
    return { rows, clears };
  };

  let preview: MatchOutcome | null = null;
  let previewError: string | null = null;
  if (review && match && night) {
    try {
      const { rows } = buildRows();
      const others = eng.scores.filter((x) => x.night_id === night.id && x.matchup_id !== match.id);
      preview = eng.outcome(night, match, [...others, ...(rows as RawScore[])]);
    } catch (e) { previewError = (e as Error).message; }
  }

  const save = useMutation({
    mutationFn: async (complete: boolean) => {
      if (!match || !night || !preview) return;
      const { rows, clears } = buildRows();
      // snapshot the average and handicap used tonight so history never changes
      const info = new Map<string, { avg: number | null; hc: number }>();
      for (const d of preview.result.divisions) {
        if (d.a) info.set(d.a.bowler_id, { avg: d.a.average, hc: d.hc.a });
        if (d.b) info.set(d.b.bowler_id, { avg: d.b.average, hc: d.hc.b });
      }
      const full = rows.map((r) => {
        const i = info.get(r.bowler_id!);
        return { ...r, average_at_time: i?.avg == null ? null : Math.floor(i.avg), handicap_at_time: i?.hc ?? 0 };
      });
      if (full.length) {
        const { error } = await supabase.from("lm_night_scores").upsert(full, { onConflict: "night_id,bowler_id,game_number" });
        if (error) throw new Error(error.message);
      }
      for (const c of clears) {
        const { error } = await supabase.from("lm_night_scores").delete().eq("night_id", night.id).eq("bowler_id", c.bowler_id).eq("game_number", c.game_number);
        if (error) throw new Error(error.message);
      }
      if (complete) {
        const { error } = await supabase.from("lm_league_nights").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", night.id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_d, complete) => { toast.success(complete ? "Saved and night marked completed" : "Scores saved"); setDraft({}); setReview(false); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <PanelIntro>1. Pick the week and matchup. 2. Type the raw scratch scores. 3. Press Calculate to see handicap and points. 4. Save. You never type handicaps or points.</PanelIntro>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="se-night">Week / date</Label>
          <select id="se-night" className={selectCls} value={nightId} onChange={(e) => { setNightId(e.target.value); setMatchId(""); setDraft({}); setReview(false); }}>
            <option value="">Choose…</option>
            {[...nights].reverse().map((x) => <option key={x.id} value={x.id}>Week {x.week_number ?? "—"} · {x.night_date} ({STATUS_LABEL[x.status]})</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="se-match">Matchup</Label>
          <select id="se-match" className={selectCls} value={matchId} onChange={(e) => { setMatchId(e.target.value); setDraft({}); setReview(false); }} disabled={!nightId}>
            <option value="">Choose…</option>
            {nightMatches.map((m) => <option key={m.id} value={m.id}>{m.team_a_name} vs {m.team_b_name}</option>)}
          </select>
        </div>
      </div>
      {nightId && nightMatches.length === 0 && <Empty>Add matchups for this night in League Nights.</Empty>}
      {locked && <p className="font-semibold text-primary">This night is completed and locked. Reopen it in League Nights to make corrections.</p>}
      {!eng.rules || eng.rules.handicap_method === "not_configured" ? (
        <p className="text-sm text-muted-foreground">Handicap is not configured for this league yet — set it in League Rules.</p>
      ) : null}
      {match && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {[match.team_a_id, match.team_b_id].map((teamId) => {
              const team = teams.find((t) => t.id === teamId);
              if (!team) return null;
              const r = roster(team.id);
              return (
                <Card key={team.id}>
                  <h3 className="text-2xl">{team.name}</h3>
                  {r.length === 0 && <p className="text-sm text-muted-foreground">No bowlers on this team. Add them in Teams.</p>}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left">
                        <th className="py-1 pr-2">Div</th><th className="py-1 pr-2">Bowler</th>
                        {Array.from({ length: gpn }, (_, i) => <th key={i} className="px-1 py-1">G{i + 1}</th>)}
                      </tr></thead>
                      <tbody>
                        {r.map((m) => {
                          const name = eng.names.get(m.bowler_id) ?? "—";
                          return (
                            <tr key={m.id} className="border-t border-border">
                              <td className="py-2 pr-2">{divisions.find((d) => d.id === m.division_id)?.code ?? "—"}</td>
                              <td className="py-2 pr-2 font-semibold">{name}{m.is_substitute && <span className="ml-1 text-xs text-accent">sub</span>}</td>
                              {Array.from({ length: gpn }, (_, i) => (
                                <td key={i} className="px-1 py-1">
                                  <Input aria-label={`${name} game ${i + 1}`} type="number" min={0} max={450} inputMode="numeric" disabled={locked}
                                    value={val(m.bowler_id, i + 1)} onChange={(e) => { setDraft((d) => ({ ...d, [key(m.bowler_id, i + 1)]: e.target.value })); setReview(false); }}
                                    className="h-11 w-20 text-base" />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="outline" onClick={() => setReview(true)} disabled={!eng.ready}>Calculate</Button>
          </div>
          {previewError && <p className="font-semibold text-destructive">{previewError}</p>}
          {preview && (
            <Card>
              <p className="mb-3 text-xs font-bold text-primary">REVIEW — NOT SAVED YET</p>
              <MatchResultView o={preview} gpn={gpn} rules={eng.rules} />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button size="lg" disabled={locked || save.isPending} onClick={() => save.mutate(false)}>Save scores</Button>
                <Button size="lg" variant="outline" disabled={locked || save.isPending} onClick={() => {
                  if (window.confirm("Save and mark this whole night completed? It will be locked.")) save.mutate(true);
                }}>Save &amp; complete night</Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Standings
function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="rpt-table w-full text-sm">
        <thead><tr className="text-left">{["Pos", "#", "Team", "W", "L", "T", "Win %", "Points", "Pins", "Pins against", "Games", "Avg"].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team_id} className="border-t border-border tabular-nums">
              <td className="px-2 py-1">{i + 1}</td><td className="px-2 py-1">{r.number ?? ""}</td>
              <td className="px-2 py-1 font-semibold">{r.name}</td>
              <td className="px-2 py-1">{r.wins}</td><td className="px-2 py-1">{r.losses}</td><td className="px-2 py-1">{r.ties}</td>
              <td className="px-2 py-1">{r.pct == null ? "—" : r.pct.toFixed(3).replace(/^0/, "")}</td>
              <td className="px-2 py-1 font-semibold">{fPts(r.points)}</td>
              <td className="px-2 py-1">{r.pins}</td><td className="px-2 py-1">{r.pinsAgainst}</td>
              <td className="px-2 py-1">{r.games}</td><td className="px-2 py-1">{f0(r.average)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Standings({ league, ...bits }: Bits & { league: LmLeague }) {
  const eng = useLeagueEngine(league, bits);
  if (!eng.ready) return <p className="text-muted-foreground">Loading…</p>;
  const rows = standings(bits.teams, eng.outcomesFor(eng.completed), eng.completedScores);
  return (
    <div className="space-y-4">
      <PanelIntro>Worked out automatically from completed league nights. A team wins a matchup by earning more points that night.</PanelIntro>
      {bits.teams.length === 0 ? <Empty>No teams yet.</Empty> : <Card><StandingsTable rows={rows} /></Card>}
      <p className="text-sm text-muted-foreground">{eng.completed.length} completed night(s) counted.</p>
    </div>
  );
}

// ---------------- Reports
function Reports({ league, ...bits }: Bits & { league: LmLeague }) {
  const eng = useLeagueEngine(league, bits);
  const [nightId, setNightId] = useState("");
  if (!eng.ready) return <p className="text-muted-foreground">Loading…</p>;
  const done = eng.completed;
  const night = done.find((x) => x.id === nightId) ?? done[done.length - 1];
  if (!night) return <Empty>Reports appear once a league night is marked completed.</Empty>;
  const upTo = done.filter((x) => x.night_date <= night.night_date);
  const upToScores = eng.completedScores.filter((x) => upTo.some((n) => n.id === x.night_id));
  const rows = standings(bits.teams, eng.outcomesFor(upTo), upToScores);
  const tonight = eng.outcomesFor([night]);
  const stats = bowlerStats(upToScores, eng.gpn);
  const top = (k: "highGame" | "highSeries" | "highBlock") => [...stats].filter((x) => x[k] != null).sort((a, b) => (b[k] ?? 0) - (a[k] ?? 0))[0];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Label htmlFor="rp-night">Week</Label>
          <select id="rp-night" className={selectCls} value={night.id} onChange={(e) => setNightId(e.target.value)}>
            {[...done].reverse().map((x) => <option key={x.id} value={x.id}>Week {x.week_number ?? "—"} · {x.night_date}</option>)}
          </select>
        </div>
        <Button size="lg" onClick={() => window.print()}>Print League Report</Button>
      </div>
      <article id="league-report" className="space-y-6 rounded-xl border border-border bg-surface p-5">
        <header>
          <h3 className="text-3xl">{league.name}</h3>
          <p className="text-sm text-muted-foreground">{league.season ?? ""} · Week {night.week_number ?? "—"} · {night.night_date}</p>
        </header>
        <section><h4 className="text-xl">Standings</h4><StandingsTable rows={rows} /></section>
        <section className="space-y-5"><h4 className="text-xl">Results this week</h4>
          {tonight.length === 0 ? <p className="text-sm">No matchups recorded.</p> : tonight.map((o) => <MatchResultView key={o.match.id} o={o} gpn={eng.gpn} rules={eng.rules} />)}
        </section>
        <section><h4 className="text-xl">Season highs (scratch)</h4>
          <ul className="text-sm">
            {top("highGame") && <li>High game: {top("highGame")!.name} — {top("highGame")!.highGame}</li>}
            {top("highSeries") && <li>High series: {top("highSeries")!.name} — {top("highSeries")!.highSeries}</li>}
            {top("highBlock") && <li>High 4-game block: {top("highBlock")!.name} — {top("highBlock")!.highBlock}</li>}
          </ul>
        </section>
        <section><h4 className="text-xl">Bowler statistics</h4>
          <div className="overflow-x-auto">
            <table className="rpt-table w-full text-sm">
              <thead><tr className="text-left">{["Bowler", "Team", "Div", "Games", "Pins", "Avg", "High game", "High series", "High 4-game block"].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
              <tbody>{stats.map((x) => (
                <tr key={x.bowler_id} className="border-t border-border tabular-nums">
                  <td className="px-2 py-1 font-semibold">{x.name}</td><td className="px-2 py-1">{x.team}</td><td className="px-2 py-1">{x.division}</td>
                  <td className="px-2 py-1">{x.games}</td><td className="px-2 py-1">{x.pins}</td><td className="px-2 py-1">{f0(x.average)}</td>
                  <td className="px-2 py-1">{f0(x.highGame)}</td><td className="px-2 py-1">{f0(x.highSeries)}</td><td className="px-2 py-1">{f0(x.highBlock)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </article>
    </div>
  );
}

// ---------------- History
function History({ league, ...bits }: Bits & { league: LmLeague }) {
  const eng = useLeagueEngine(league, bits);
  const [open, setOpen] = useState<string | null>(null);
  const done = eng.completed;
  return (
    <div className="space-y-3">
      <PanelIntro>Completed weeks are stored exactly as bowled — team and bowler names are saved as they were that night.</PanelIntro>
      {done.length === 0 && <Empty>No completed league nights yet.</Empty>}
      {[...done].reverse().map((night) => (
        <Card key={night.id}>
          <button type="button" className="w-full text-left" onClick={() => setOpen(open === night.id ? null : night.id)} aria-expanded={open === night.id}>
            <h3 className="text-xl">Week {night.week_number ?? "—"} · {night.night_date}</h3>
          </button>
          {open === night.id && (
            <div className="mt-4 space-y-5">
              {eng.outcomesFor([night]).map((o) => <MatchResultView key={o.match.id} o={o} gpn={eng.gpn} rules={eng.rules} />)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
