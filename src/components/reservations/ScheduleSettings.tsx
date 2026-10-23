import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/site/AdminField";
import { updateStaffSchedule } from "@/lib/reservations.functions";
import {
  DAYS,
  clock,
  minutes,
  prettyTime,
  localDay,
  type BookingConfig,
  type ScheduleBlock,
  type StaffSchedule,
} from "@/lib/reservations";
import type { Json } from "@/integrations/supabase/types";
function windowsText(w: number[][]) {
  return w.map((r) => `${clock(r[0] ?? 0)}-${clock(r[1] ?? 0)}`).join(", ");
}
function parseWindows(s: string) {
  if (!s.trim()) return [];
  return s.split(",").map((x) => {
    const pair = x.trim().split("-");
    if (pair.length !== 2 || pair.some((v) => !/^\d{2}:\d{2}$/.test(v)))
      throw new Error("Use HH:MM-HH:MM, separated by commas.");
    return pair.map(minutes);
  });
}
export function ScheduleSettings({ data, onSaved }: { data: StaffSchedule; onSaved: () => void }) {
  const update = useServerFn(updateStaffSchedule);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [c, setC] = useState<BookingConfig>(data.settings);
  const [editing, setEditing] = useState<ScheduleBlock | null>(null);
  async function save(action: string, values: Json) {
    setBusy(true);
    setError("");
    try {
      await update({ data: { action, values } });
      onSaved();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings could not be saved.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-10">
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            const next = {
              ...c,
              games: String(f.get("games")).split(",").map(Number),
              weekly: DAYS.map((_, i) => parseWindows(String(f.get(`day-${i}`)))),
              estimates: c.estimates,
            };
            if (
              next.enabled &&
              !data.settings.enabled &&
              !window.confirm(
                "Enable public reservations with these hours and rules? Confirm that league blocks and special dates have been reviewed.",
              )
            )
              return;
            await save("settings", next as unknown as Json);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Check settings.");
          }
        }}
      >
        <h2 className="text-2xl">Reservation rules & bookable hours</h2>
        <div className="flex flex-wrap gap-6">
          <Label className="flex items-center gap-3">
            <Switch checked={c.enabled} onCheckedChange={(enabled) => setC({ ...c, enabled })} />
            Online reservations
          </Label>
          <Label className="flex items-center gap-3">
            <Switch
              checked={c.approval_required}
              onCheckedChange={(approval_required) => setC({ ...c, approval_required })}
            />
            Staff approval required
          </Label>
          <Label className="flex items-center gap-3">
            <Switch
              checked={c.use_upper}
              onCheckedChange={(use_upper) => setC({ ...c, use_upper })}
            />
            Use upper estimate
          </Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Games offered (comma-separated)"
            name="games"
            defaultValue={c.games.join(",")}
            required
          />
          {(
            [
              { key: "before_minutes", label: "Before buffer (minutes)", min: 0, max: 120 },
              { key: "after_minutes", label: "After buffer (minutes)", min: 0, max: 120 },
              { key: "step_minutes", label: "Start-time interval (minutes)", min: 5, max: 120 },
              { key: "advance_days", label: "Advance booking (days)", min: 1, max: 730 },
              { key: "lead_minutes", label: "Minimum lead time (minutes)", min: 0, max: 10080 },
            ] as const
          ).map((x) => (
            <div key={x.key}>
              <Label htmlFor={x.key}>{x.label}</Label>
              <Input
                id={x.key}
                className="mt-2"
                type="number"
                min={x.min}
                max={x.max}
                required
                value={c[x.key]}
                onChange={(e) => setC({ ...c, [x.key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
        <fieldset>
          <legend className="mb-3 font-medium">Provisional one-game estimates · minutes</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.estimates.map((r, i) => (
              <div key={i}>
                <Label>
                  {i + 1} {i === 0 ? "bowler" : "bowlers"}
                </Label>
                <div className="mt-2 flex gap-2">
                  {[0, 1].map((j) => (
                    <Input
                      key={j}
                      aria-label={`${i + 1} bowlers ${j === 0 ? "minimum" : "maximum"} minutes`}
                      type="number"
                      min={1}
                      max={240}
                      required
                      value={r[j]}
                      onChange={(e) =>
                        setC({
                          ...c,
                          estimates: c.estimates.map((a, k) =>
                            k === i ? a.map((v, l) => (l === j ? Number(e.target.value) : v)) : a,
                          ),
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          {DAYS.map((d, i) => (
            <Field
              key={d}
              label={`${d} bookable windows`}
              name={`day-${i}`}
              defaultValue={windowsText(c.weekly[i] ?? [])}
              placeholder="10:30-13:00, 15:00-16:15"
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Blank windows mean closed for reservations. Review league blocks and special dates before
          enabling. Hours changes cannot invalidate active reservations.
        </p>
        <Button disabled={busy} type="submit">
          Save reservation settings
        </Button>
      </form>
      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl">Lane & recurring league blocks</h2>
        <form
          key={editing?.id ?? "new"}
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const values = {
              ...(editing ? { id: editing.id } : {}),
              title: String(f.get("title")),
              lanes: f.getAll("lanes").map(Number),
              starts_on: String(f.get("starts_on")),
              ends_on: String(f.get("ends_on")),
              weekday: f.get("weekday") === "" ? null : Number(f.get("weekday")),
              start_minute: minutes(String(f.get("start_time"))),
              end_minute: minutes(String(f.get("end_time"))),
              exceptions: String(f.get("exceptions"))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            };
            if (await save("block", values)) setEditing(null);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Block name" name="title" defaultValue={editing?.title} required />
            <Field
              label="First date"
              name="starts_on"
              type="date"
              defaultValue={editing?.starts_on ?? localDay()}
              required
            />
            <Field
              label="Last date"
              name="ends_on"
              type="date"
              defaultValue={editing?.ends_on ?? localDay()}
              required
            />
            <Field
              label="From"
              name="start_time"
              type="time"
              defaultValue={clock(editing?.start_minute ?? 630)}
              required
            />
            <Field
              label="Until"
              name="end_time"
              type="time"
              defaultValue={clock(editing?.end_minute ?? 1320)}
              required
            />
            <div>
              <Label htmlFor="block-weekday">Repeat</Label>
              <select
                id="block-weekday"
                name="weekday"
                defaultValue={editing?.weekday ?? ""}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="">Every date in range</option>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    Every {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <fieldset>
            <legend className="mb-2 font-medium">Blocked lanes</legend>
            <div className="flex flex-wrap gap-5">
              {[1, 2, 3, 4, 5, 6].map((l) => (
                <Label key={l} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="lanes"
                    value={l}
                    defaultChecked={editing?.lanes.includes(l) ?? true}
                  />
                  Lane {l}
                </Label>
              ))}
            </div>
          </fieldset>
          <Field
            label="Exceptions (YYYY-MM-DD, comma-separated)"
            name="exceptions"
            defaultValue={editing?.exceptions.join(", ")}
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {editing ? "Save block" : "Add block"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel edit
              </Button>
            )}
          </div>
        </form>
        <div className="divide-y divide-border">
          {data.blocks.map((b) => (
            <div key={b.id} className="flex flex-wrap justify-between gap-3 py-4">
              <div>
                <h3 className="text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Lanes {b.lanes.join(", ")} · {b.starts_on} – {b.ends_on} ·{" "}
                  {b.weekday === null ? "Daily" : DAYS[b.weekday]} ·{" "}
                  {prettyTime(clock(b.start_minute))}–{prettyTime(clock(b.end_minute))}
                </p>
                {b.exceptions.length > 0 && (
                  <p className="text-sm">Exceptions: {b.exceptions.join(", ")}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Remove ${b.title}?`))
                      void save("remove_block", { id: b.id });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl">Special-date hours & closures</h2>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await save("date_hours", {
                day: String(f.get("day")),
                windows: parseWindows(String(f.get("windows"))),
                note: String(f.get("note")),
              });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Check hours.");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" name="day" type="date" required />
            <Field label="Windows (blank means closed)" name="windows" placeholder="12:00-20:00" />
            <Field label="Staff note" name="note" />
          </div>
          <Button disabled={busy}>Save special-date hours</Button>
        </form>
        {data.date_hours.map((h) => (
          <div
            key={h.day}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
          >
            <p>
              {h.day} · {windowsText(h.windows) || "Closed"} · {h.note}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Restore regular booking hours for this date?"))
                  void save("remove_date_hours", { day: h.day });
              }}
            >
              Restore regular hours
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
