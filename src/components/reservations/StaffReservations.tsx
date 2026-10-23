import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { readStaffSchedule, saveStaffReservation } from "@/lib/reservations.functions";
import {
  localDay,
  clock,
  minutes,
  prettyTime,
  blockApplies,
  statusLabel,
  laneAvailability,
  type EventInquiry,
  type Reservation,
} from "@/lib/reservations";
import { ReservationEditor } from "./ReservationEditor";
import { ScheduleSettings } from "./ScheduleSettings";
export function StaffReservations() {
  const read = useServerFn(readStaffSchedule);
  const save = useServerFn(saveStaffReservation);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["staff-schedule"],
    queryFn: () => read(),
    refetchInterval: 30000,
  });
  const [laneFilter, setLaneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [day, setDay] = useState(localDay);
  const [view, setView] = useState("day");
  const [availabilityTime, setAvailabilityTime] = useState("12:00");
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [event, setEvent] = useState<EventInquiry | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refreshed = () => {
    void qc.invalidateQueries({ queryKey: ["staff-schedule"] });
    void qc.invalidateQueries({ queryKey: ["booking-times"] });
    void qc.invalidateQueries({ queryKey: ["booking-config"] });
  };
  async function status(r: Reservation, status: string) {
    if (
      (status === "cancelled" || status === "declined") &&
      !window.confirm(
        `${status === "cancelled" ? "Cancel" : "Decline"} this reservation and release its lanes?`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await save({
        data: {
          id: r.id,
          values: { ...r, day: r.starts_at.slice(0, 10), time: r.starts_at.slice(11, 16), status },
        },
      });
      refreshed();
      setMessage("Reservation updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }
  if (q.isPending) return <p role="status">Loading lane schedule…</p>;
  if (q.isError || !q.data)
    return (
      <div role="alert">
        <p>Lane schedule could not be loaded.</p>
        <Button variant="outline" onClick={() => void q.refetch()}>
          Try again
        </Button>
      </div>
    );
  const data = q.data;
  const available = laneAvailability(data, day, availabilityTime);
  const days = Array.from({ length: view === "week" ? 7 : 1 }, (_, i) => {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const rows = data.reservations.filter(
    (r) =>
      (view === "upcoming"
        ? r.starts_at.slice(0, 10) >= localDay()
        : days.includes(r.starts_at.slice(0, 10))) &&
      (laneFilter === "all" || r.lanes.includes(Number(laneFilter))) &&
      (statusFilter === "all" || r.status === statusFilter),
  );
  function move(n: number) {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + n);
    setDay(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">Reservation book</h2>
          <p className="mt-1 text-sm text-muted-foreground">Telephone bookings · Alberta time</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh schedule"
            title="Refresh schedule"
            onClick={() => void q.refetch()}
          >
            <RefreshCw />
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setEvent(null);
              setMessage("");
              setShowEditor(true);
            }}
          >
            <Plus />
            Add Reservation
          </Button>
        </div>
      </div>
      {message && (
        <p role="status" className="border-l-4 border-primary bg-secondary p-4 text-lg">
          {message}
        </p>
      )}
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="settings">Hours & lane closures</TabsTrigger>
          <TabsTrigger value="audit">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-5 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="schedule-day">Date</Label>
              <Input
                id="schedule-day"
                className="mt-2 w-44"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              aria-label="Previous date"
              onClick={() => move(view === "week" ? -7 : -1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Next date"
              onClick={() => move(view === "week" ? 7 : 1)}
            >
              <ChevronRight />
            </Button>
            <div>
              <Label htmlFor="filter-lane">Lane</Label>
              <select
                id="filter-lane"
                className="mt-2 h-10 rounded-md border border-input bg-background px-3"
                value={laneFilter}
                onChange={(e) => setLaneFilter(e.target.value)}
              >
                <option value="all">All lanes</option>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    Lane {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <select
                id="filter-status"
                className="mt-2 h-10 rounded-md border border-input bg-background px-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {["pending", "confirmed", "declined", "cancelled", "completed"].map((v) => (
                  <option key={v} value={v}>
                    {statusLabel(v)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDay(localDay());
                setView("day");
              }}
            >
              Today
            </Button>
            <div className="flex flex-wrap gap-2">
              {["day", "week", "upcoming"].map((v) => (
                <Button
                  key={v}
                  variant={view === v ? "default" : "outline"}
                  onClick={() => setView(v)}
                >
                  {v === "upcoming" ? "Upcoming bookings" : v === "week" ? "Week" : "Day"}
                </Button>
              ))}
            </div>
          </div>
          {view !== "upcoming" && (
            <div className="flex flex-wrap items-center gap-4 border-y border-border py-4">
              <div>
                <Label htmlFor="availability-time">Lane availability at · Alberta time</Label>
                <Input
                  id="availability-time"
                  className="mt-2 h-12"
                  type="time"
                  value={availabilityTime}
                  onChange={(e) => setAvailabilityTime(e.target.value || "12:00")}
                />
              </div>
              <p role="status" className="text-lg font-semibold">
                {available.closed
                  ? "Closed for lane bookings"
                  : `${available.free.length} of 6 lanes available at ${prettyTime(availabilityTime)}`}
              </p>
            </div>
          )}
          {view !== "upcoming" &&
            days.map((d) => (
              <section key={d} className="space-y-3">
                <h3 className="text-xl">{d}</h3>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[720px] text-base">
                    <thead className="bg-secondary">
                      <tr>
                        {[1, 2, 3, 4, 5, 6].map((l) => (
                          <th
                            key={l}
                            className="w-1/6 border-r border-border px-3 py-3 text-left font-medium"
                          >
                            Lane {l}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[1, 2, 3, 4, 5, 6].map((l) => {
                          const reservations = data.reservations.filter(
                            (r) =>
                              r.starts_at.slice(0, 10) === d &&
                              r.lanes.includes(l) &&
                              ["pending", "confirmed"].includes(r.status),
                          );
                          const blocks = data.blocks.filter(
                            (b) => b.lanes.includes(l) && blockApplies(b, d),
                          );
                          return (
                            <td key={l} className="border-r border-border p-3 align-top">
                              <div className="space-y-3">
                                {reservations.map((r) => (
                                  <Button
                                    key={r.id}
                                    variant="outline"
                                    className="h-auto w-full flex-col items-start whitespace-normal px-2 py-3 text-left"
                                    onClick={() => {
                                      const linked = data.inquiries.find(
                                        (e) => e.lane_reservation_id === r.id,
                                      );
                                      setEditing(linked ? null : r);
                                      setEvent(linked ?? null);
                                      setShowEditor(true);
                                    }}
                                  >
                                    <span className="text-primary">
                                      {prettyTime(r.starts_at.slice(11, 16))}–
                                      {prettyTime(
                                        clock(
                                          minutes(r.starts_at.slice(11, 16)) + r.duration_minutes,
                                        ),
                                      )}
                                    </span>
                                    <span className="break-all">{r.contact_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {data.inquiries.find((e) => e.lane_reservation_id === r.id)
                                        ?.booking_type ?? "Regular Bowling"}{" "}
                                      · {statusLabel(r.status)} ·{" "}
                                      {r.allocations[r.lanes.indexOf(l)]} bowlers
                                    </span>
                                  </Button>
                                ))}
                                {blocks.map((b) => (
                                  <div
                                    key={b.id}
                                    className="border-l-2 border-primary bg-secondary p-2"
                                  >
                                    <p className="font-medium">{b.title}</p>
                                    <p className="text-xs">
                                      {prettyTime(clock(b.start_minute))}–
                                      {prettyTime(clock(b.end_minute))}
                                    </p>
                                  </div>
                                ))}
                                {!reservations.length && !blocks.length && (
                                  <p className="text-muted-foreground">No lanes reserved</p>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <h3 className="text-2xl">
            {view === "upcoming" ? "Upcoming lane bookings" : "Regular bowling"}
          </h3>
          {!rows.length && <p className="text-muted-foreground">No reservations for this view.</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            {rows
              .filter((r) => !data.inquiries.some((e) => e.lane_reservation_id === r.id))
              .map((r) => (
                <article key={r.id} className="card-soft rounded-lg p-5">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="text-2xl">{r.contact_name}</h3>
                    <span className="font-medium text-primary">{statusLabel(r.status)}</span>
                  </div>
                  <p className="mt-2 text-sm">
                    {r.starts_at.slice(0, 10)} · {prettyTime(r.starts_at.slice(11, 16))} ·{" "}
                    {r.duration_minutes} minutes
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lanes {r.lanes.join(", ")} · {r.allocations.reduce((a, b) => a + b, 0)} bowlers
                    · {r.games} games each
                  </p>
                  <a className="mt-3 block text-primary" href={`tel:${r.phone.replace(/\D/g, "")}`}>
                    {r.phone}
                  </a>
                  {r.email && (
                    <a className="block break-all text-primary" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  )}
                  {r.notes && <p className="mt-3 text-sm">{r.notes}</p>}
                  {r.staff_notes && (
                    <p className="mt-3 border-l-2 border-border pl-3 text-sm">
                      Staff: {r.staff_notes}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(r);
                        setEvent(null);
                        setShowEditor(true);
                      }}
                    >
                      Edit
                    </Button>
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void status(r, "confirmed")}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void status(r, "declined")}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {["pending", "confirmed"].includes(r.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void status(r, "cancelled")}
                      >
                        Cancel reservation
                      </Button>
                    )}
                    {r.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void status(r, "completed")}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </article>
              ))}
          </div>
          <section className="space-y-4 border-t border-border pt-6">
            <h3 className="text-2xl">Special events & inquiries</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.inquiries
                .filter((e) =>
                  view === "upcoming"
                    ? e.requested_date >= localDay()
                    : days.includes(e.requested_date),
                )
                .map((e) => (
                  <article key={e.id} className="card-soft rounded-lg p-5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h4 className="text-2xl">{e.contact_name}</h4>
                      <span className="font-semibold text-primary">
                        {statusLabel(e.follow_up_status)}
                      </span>
                    </div>
                    <p className="mt-2 font-medium">{e.booking_type}</p>
                    <p className="mt-2">
                      {e.requested_date} ·{" "}
                      {e.requested_time === "00:00:00"
                        ? "Time to be arranged"
                        : prettyTime(e.requested_time.slice(0, 5))}
                    </p>
                    <p>
                      {e.party_size} guests · {e.lanes} lanes requested
                    </p>
                    <a
                      className="mt-2 block text-primary"
                      href={`tel:${e.phone.replace(/\D/g, "")}`}
                    >
                      {e.phone}
                    </a>
                    {e.notes && <p className="mt-2">{e.notes}</p>}
                    <Button
                      className="mt-4 min-h-11"
                      variant="outline"
                      onClick={() => {
                        setEvent(e);
                        setEditing(null);
                        setShowEditor(true);
                      }}
                    >
                      Open event booking
                    </Button>
                  </article>
                ))}
            </div>
          </section>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <ScheduleSettings key={JSON.stringify(data.settings)} data={data} onSaved={refreshed} />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <div className="divide-y divide-border">
            {data.audit.slice(0, 200).map((a, i) => (
              <div key={i} className="py-3 text-sm">
                <p className="font-semibold">
                  {a.action} · {new Date(a.occurred_at).toLocaleString()}
                </p>
                <p className="break-all text-muted-foreground">
                  {a.reservation_id ? `Reservation ${a.reservation_id}` : "Schedule configuration"}{" "}
                  · {a.actor_id ? "Authorized staff" : "Public request"}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      {showEditor && (
        <ReservationEditor
          reservation={editing}
          inquiry={event}
          day={day}
          config={data.settings}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            refreshed();
            setMessage("Reservation saved successfully.");
          }}
        />
      )}
    </div>
  );
}
