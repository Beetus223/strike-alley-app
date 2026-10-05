import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, PanelIntro, TextField } from "@/components/site/AdminField";

type LmLeague = Tables<"lm_leagues">;
type LmTeam = Tables<"lm_teams">;
type LmDivision = Tables<"lm_divisions">;
type LmNight = Tables<"lm_league_nights">;
type LmMatchup = Tables<"lm_matchups">;
type LmMember = Tables<"lm_team_members">;
type Bowler = Pick<Tables<"bowlers">, "id" | "bowler_id" | "first_name" | "last_name" | "is_active">;

const SECTIONS = [
  "Dashboard",
  "League Setup",
  "Teams",
  "Bowlers",
  "League Nights",
  "Score Entry",
  "Standings",
  "League Reports",
  "League Rules",
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
      return <BowlersView {...d} />;
    case "League Nights":
      return <Nights league={league} {...d} />;
    case "Score Entry":
      return <ScoreEntry league={league} {...d} />;
    case "League Rules":
      return <Rules league={league} />;
    case "Standings":
      return (
        <Foundation
          title="Team standings"
          items={["Position", "Team", "Wins / Losses", "Win %", "Points", "Pins", "Pins against", "Games", "Average", "Division"]}
          note="Standings will be calculated automatically from saved league-night scores once the points engine is built in the next step. Nothing is calculated or guessed yet."
          count={`${d.nights.filter((x) => x.status === "completed").length} completed night(s) on record`}
        />
      );
    case "League Reports":
      return (
        <Foundation
          title="Reports"
          items={["Weekly standings", "Team standings", "Individual statistics", "Weekly scores", "High game / series", "High 4-game block", "Weekly recap", "Season statistics", "Bowler, team and league history", "Print / PDF"]}
          note="Printable Bowl 101-style reports will be added in a later step. The existing League Reports tab on the Staff Dashboard keeps working in the meantime."
        />
      );
    case "History":
      return <History {...d} />;
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
function Foundation({ title, items, note, count }: { title: string; items: string[]; note: string; count?: string }) {
  return (
    <Card>
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      {count && <p className="mt-2 text-sm font-semibold">{count}</p>}
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i} className="rounded-full border border-border px-3 py-1 text-xs">
            {i}
          </li>
        ))}
      </ul>
    </Card>
  );
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
        Rules belong to this league only. Leave anything unclear blank and keep "Needs confirmation"
        ticked — nothing is calculated from these yet.
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
  const addMember = useSave((v: { team_id: string; bowler_id: string; division_id: string | null; is_substitute: boolean }) =>
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
                addMember.mutate({ team_id: t.id, bowler_id: bid, division_id: s(f, "division_id"), is_substitute: f.get("sub") === "on" });
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

// ---------------- Bowlers
function BowlersView({ teams, members, divisions }: Bits) {
  const bowlers = useBowlers();
  const byId = new Map((bowlers.data ?? []).map((b) => [b.id, b]));
  return (
    <div className="space-y-4">
      <PanelIntro>
        League bowlers use the existing bowler accounts — no duplicates. Create new accounts or reset
        passwords in the Staff Dashboard's Bowlers tab, then add them to a team here. Averages, high
        game, high series and high 4-game block will appear once the scoring engine is added.
      </PanelIntro>
      {members.length === 0 ? <Empty>No bowlers on teams in this league yet.</Empty> : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left"><tr>
              {["Bowler ID", "Name", "Team", "Division", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
            </tr></thead>
            <tbody>
              {members.map((m) => {
                const b = byId.get(m.bowler_id);
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{b?.bowler_id}</td>
                    <td className="px-3 py-2">{b ? bowlerName(b) : "—"}</td>
                    <td className="px-3 py-2">{teams.find((t) => t.id === m.team_id)?.name}</td>
                    <td className="px-3 py-2">{divisions.find((d) => d.id === m.division_id)?.code ?? "—"}</td>
                    <td className="px-3 py-2">{m.is_active ? (m.is_substitute ? "Substitute" : "Regular") : "Inactive"}</td>
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
                  if (!a || !b || a === b) return toast.error("Pick two different teams.");
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

// ---------------- Score Entry
function ScoreEntry({ league, nights, teams, members, divisions }: Bits & { league: LmLeague }) {
  const bowlers = useBowlers();
  const [nightId, setNightId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const night = nights.find((x) => x.id === nightId);
  const matchups = useMatchups(nightId ? [nightId] : []);
  const match = (matchups.data ?? []).find((m) => m.id === matchId);
  const scores = useQuery({
    queryKey: ["lm", "night-scores", nightId],
    enabled: !!nightId,
    queryFn: async () => {
      const { data, error } = await supabase.from("lm_night_scores").select("*").eq("night_id", nightId);
      if (error) throw error;
      return data;
    },
  });
  const inv = useInvalidate();
  const gpn = league.games_per_night;
  const locked = night?.status === "completed";

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      if (!match || !night) return;
      const rows: Tables<"lm_night_scores">["Insert"][] = [];
      const clears: { bowler_id: string; game_number: number }[] = [];
      for (const teamId of [match.team_a_id, match.team_b_id]) {
        const team = teams.find((t) => t.id === teamId);
        if (!team) continue;
        for (const m of members.filter((x) => x.team_id === team.id && x.is_active)) {
          const b = bowlers.data?.find((x) => x.id === m.bowler_id);
          for (let g = 1; g <= gpn; g++) {
            const raw = String(form.get(`${m.bowler_id}-${g}`) ?? "").trim();
            if (raw === "") { clears.push({ bowler_id: m.bowler_id, game_number: g }); continue; }
            const score = Number(raw);
            if (!Number.isInteger(score) || score < 0 || score > 450) throw new Error(`Scores must be 0–450 (${b ? bowlerName(b) : ""}, game ${g}).`);
            rows.push({
              night_id: night.id, matchup_id: match.id, team_id: team.id, bowler_id: m.bowler_id,
              team_name: team.name, bowler_name: b ? bowlerName(b) : null,
              division_code: divisions.find((d) => d.id === m.division_id)?.code ?? null,
              game_number: g, score,
            });
          }
        }
      }
      if (rows.length) {
        const { error } = await supabase.from("lm_night_scores").upsert(rows, { onConflict: "night_id,bowler_id,game_number" });
        if (error) throw new Error(error.message);
      }
      for (const c of clears) {
        await supabase.from("lm_night_scores").delete().eq("night_id", night.id).eq("bowler_id", c.bowler_id).eq("game_number", c.game_number);
      }
    },
    onSuccess: () => { toast.success("Scores saved"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const existing = (bid: string, g: number) => scores.data?.find((x) => x.bowler_id === bid && x.game_number === g)?.score;

  return (
    <div className="space-y-5">
      <PanelIntro>Pick the week and matchup, then type the raw scores. Handicap and points will be worked out automatically in the next step — nothing is calculated yet.</PanelIntro>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="se-night">Week / date</Label>
          <select id="se-night" className={selectCls} value={nightId} onChange={(e) => { setNightId(e.target.value); setMatchId(""); }}>
            <option value="">Choose…</option>
            {[...nights].reverse().map((x) => <option key={x.id} value={x.id}>Week {x.week_number ?? "—"} · {x.night_date} ({STATUS_LABEL[x.status]})</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="se-match">Matchup</Label>
          <select id="se-match" className={selectCls} value={matchId} onChange={(e) => setMatchId(e.target.value)} disabled={!nightId}>
            <option value="">Choose…</option>
            {(matchups.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.team_a_name} vs {m.team_b_name}</option>)}
          </select>
        </div>
      </div>
      {nightId && (matchups.data ?? []).length === 0 && <Empty>Add matchups for this night in League Nights.</Empty>}
      {locked && <p className="font-semibold text-primary">This night is completed and locked. Reopen it in League Nights to make corrections.</p>}
      {match && (
        <form key={`${matchId}-${scores.dataUpdatedAt}`} onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {[match.team_a_id, match.team_b_id].map((teamId) => {
              const team = teams.find((t) => t.id === teamId);
              if (!team) return null;
              const roster = members.filter((x) => x.team_id === team.id && x.is_active)
                .sort((a, b) => (divisions.find((d) => d.id === a.division_id)?.sort_order ?? 99) - (divisions.find((d) => d.id === b.division_id)?.sort_order ?? 99));
              return (
                <Card key={team.id}>
                  <h3 className="text-2xl">{team.name}</h3>
                  {roster.length === 0 && <p className="text-sm text-muted-foreground">No bowlers on this team.</p>}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left">
                        <th className="py-1 pr-2">Div</th><th className="py-1 pr-2">Bowler</th>
                        {Array.from({ length: gpn }, (_, i) => <th key={i} className="px-1 py-1">G{i + 1}</th>)}
                      </tr></thead>
                      <tbody>
                        {roster.map((m) => {
                          const b = bowlers.data?.find((x) => x.id === m.bowler_id);
                          return (
                            <tr key={m.id} className="border-t border-border">
                              <td className="py-2 pr-2">{divisions.find((d) => d.id === m.division_id)?.code ?? "—"}</td>
                              <td className="py-2 pr-2 font-semibold">{b ? bowlerName(b) : "—"}</td>
                              {Array.from({ length: gpn }, (_, i) => (
                                <td key={i} className="px-1 py-1">
                                  <Input aria-label={`${b ? bowlerName(b) : ""} game ${i + 1}`} name={`${m.bowler_id}-${i + 1}`} type="number" min={0} max={450}
                                    inputMode="numeric" disabled={locked} defaultValue={existing(m.bowler_id, i + 1) ?? ""} className="h-10 w-20" />
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
          <Button type="submit" size="lg" disabled={locked || save.isPending}>Save scores</Button>
        </form>
      )}
    </div>
  );
}

// ---------------- History
function History({ nights }: Bits) {
  const done = nights.filter((x) => x.status === "completed");
  const [open, setOpen] = useState<string | null>(null);
  const scores = useQuery({
    queryKey: ["lm", "history-scores", open],
    enabled: !!open,
    queryFn: async () => {
      const { data, error } = await supabase.from("lm_night_scores").select("*").eq("night_id", open!).order("team_name").order("bowler_name").order("game_number");
      if (error) throw error;
      return data;
    },
  });
  const grouped = useMemo(() => {
    const m = new Map<string, { team: string; bowler: string; div: string | null; games: number[] }>();
    for (const r of scores.data ?? []) {
      const k = `${r.team_name}|${r.bowler_id}`;
      const e = m.get(k) ?? { team: r.team_name ?? "—", bowler: r.bowler_name ?? "—", div: r.division_code, games: [] };
      e.games[r.game_number - 1] = r.score;
      m.set(k, e);
    }
    return [...m.values()];
  }, [scores.data]);
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
            grouped.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No scores saved.</p> : (
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {grouped.map((g, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1 pr-2">{g.team}</td><td className="py-1 pr-2">{g.div ?? ""}</td>
                      <td className="py-1 pr-2 font-semibold">{g.bowler}</td>
                      <td className="py-1 tabular-nums">{g.games.map((x) => x ?? "—").join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </Card>
      ))}
    </div>
  );
}
