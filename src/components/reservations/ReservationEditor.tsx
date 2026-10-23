import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  Cake,
  Users,
  BriefcaseBusiness,
  Building,
  DoorOpen,
  CircleHelp,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveStaffReservation, saveStaffInquiry } from "@/lib/reservations.functions";
import {
  allocate,
  estimate,
  localDay,
  prettyTime,
  BOOKING_TYPES,
  statusLabel,
  type Reservation,
  type EventInquiry,
  type BookingConfig,
} from "@/lib/reservations";
export function ReservationEditor({
  reservation,
  inquiry,
  config,
  day,
  onClose,
  onSaved,
}: {
  reservation: Reservation | null;
  inquiry?: EventInquiry | null;
  config: BookingConfig;
  day?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveStaffReservation);
  const saveEvent = useServerFn(saveStaffInquiry);
  const [kind, setKind] = useState(reservation ? "Regular Bowling" : (inquiry?.booking_type ?? ""));
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestKey] = useState(() => reservation?.request_key ?? crypto.randomUUID());
  const [f, setF] = useState({
    contact_name: reservation?.contact_name ?? inquiry?.contact_name ?? "",
    phone: reservation?.phone ?? inquiry?.phone ?? "",
    email: reservation?.email ?? inquiry?.email ?? "",
    day: reservation?.starts_at.slice(0, 10) ?? inquiry?.requested_date ?? day ?? localDay(),
    time:
      reservation?.starts_at.slice(11, 16) ??
      (inquiry?.requested_time === "00:00:00" ? "" : inquiry?.requested_time.slice(0, 5)) ??
      "",
    people: reservation?.allocations.reduce((a, b) => a + b, 0) ?? inquiry?.party_size ?? 4,
    lanes: reservation?.allocations.length ?? inquiry?.lanes ?? 1,
    games: reservation?.games ?? config.games[0] ?? 1,
    duration:
      reservation?.duration_minutes ??
      inquiry?.duration_minutes ??
      estimate([4], config.games[0] ?? 1, config).duration,
    notes: reservation?.notes ?? inquiry?.notes ?? "",
    facility: inquiry?.facility_requirements ?? "",
    status: reservation?.status ?? inquiry?.follow_up_status ?? "confirmed",
  });
  const regular = kind === "Regular Bowling";
  const update = (key: keyof typeof f, value: string | number) =>
    setF((old) => ({ ...old, [key]: value }));
  function numbers(key: "people" | "lanes" | "games", value: number) {
    const next = { ...f, [key]: value };
    try {
      next.duration = estimate(allocate(next.people, next.lanes), next.games, config).duration;
    } catch {
      /* keep staff-entered duration until valid */
    }
    setF(next);
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (
        f.status === "cancelled" &&
        !window.confirm("Cancel this booking and release any reserved lanes?")
      )
        return;
      if (regular)
        await save({
          data: {
            ...(reservation ? { id: reservation.id } : {}),
            values: {
              request_key: requestKey,
              contact_name: f.contact_name,
              phone: f.phone,
              email: f.email,
              day: f.day,
              time: f.time,
              allocations: allocate(f.people, f.lanes),
              games: f.games,
              duration_minutes: f.duration,
              status: f.status,
              notes: f.notes,
              staff_notes: reservation?.staff_notes ?? "",
            },
          },
        });
      else
        await saveEvent({
          data: {
            ...(inquiry ? { id: inquiry.id } : {}),
            values: {
              booking_type: kind,
              contact_name: f.contact_name,
              phone: f.phone,
              email: f.email,
              requested_date: f.day,
              requested_time: f.time,
              party_size: f.people,
              lanes: f.lanes,
              duration_minutes: f.duration,
              follow_up_status: f.status,
              facility_requirements: f.facility,
              notes: f.notes,
            },
          },
        });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const icons = [CalendarDays, Cake, Users, BriefcaseBusiness, Building, DoorOpen, CircleHelp];
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl">
            {review
              ? "Review booking"
              : reservation || inquiry
                ? "Edit booking"
                : "Add Reservation"}
          </DialogTitle>
        </DialogHeader>
        {!kind ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {BOOKING_TYPES.map((type, i) => {
              const Icon = icons[i] ?? CircleHelp;
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto min-h-16 justify-start whitespace-normal text-left text-base"
                  onClick={() => {
                    setKind(type);
                    setF({ ...f, status: type === "Regular Bowling" ? "confirmed" : "inquiry", lanes: type === "Regular Bowling" ? Math.max(1, f.lanes) : 0 });
                  }}
                >
                  <Icon className="size-6 shrink-0" />
                  {type}
                </Button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl">{kind}</h3>
              {!reservation && !inquiry && !review && (
                <Button variant="ghost" onClick={() => setKind("")}>
                  <ArrowLeft />
                  Change type
                </Button>
              )}
            </div>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                if (review) {
                  void submit();
                  return;
                }
                try {
                  if (regular) allocate(f.people, f.lanes);
                  setReview(true);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Check the number of lanes and bowlers.",
                  );
                }
              }}
            >
              {review ? (
                <div className="space-y-3 border-y border-border py-5">
                  <p className="text-lg font-semibold">
                    {f.contact_name} · {f.phone}
                  </p>
                  {f.email && <p className="break-all">{f.email}</p>}
                  <p>
                    {f.day} · {f.time ? prettyTime(f.time) : "Time to be arranged"} · Alberta time
                  </p>
                  <p>
                    {f.people} {regular ? "bowlers" : "guests"} · {f.lanes}{" "}
                    {f.lanes === 1 ? "lane" : "lanes"}
                    {regular ? ` · ${f.games} games each` : ""}
                  </p>
                  {f.lanes > 0 && <p>{f.duration} minutes</p>}
                  <p>Status: {statusLabel(f.status)}</p>
                  {f.notes && <p>{f.notes}</p>}
                  {f.facility && <p>Facilities: {f.facility}</p>}
                  {!regular && (
                    <p className="text-muted-foreground">
                      {f.status === "confirmed" && f.lanes > 0
                        ? "Saving will reserve lanes after checking availability."
                        : "Inquiry and tentative bookings do not reserve lanes."}
                    </p>
                  )}
                  <Button type="button" variant="outline" onClick={() => setReview(false)}>
                    <ArrowLeft />
                    Edit details
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        {
                          key: "contact_name",
                          label: "Customer name",
                          type: "text",
                          required: true,
                        },
                        { key: "phone", label: "Telephone number", type: "tel", required: true },
                        { key: "day", label: "Booking date", type: "date", required: true },
                        {
                          key: "time",
                          label: regular
                            ? "Start time · Alberta"
                            : "Preferred time (optional) · Alberta",
                          type: "time",
                          required: regular || (f.status === "confirmed" && f.lanes > 0),
                        },
                      ] as const
                    ).map((x) => (
                      <div key={x.key}>
                        <Label htmlFor={`booking-${x.key}`} className="text-base">
                          {x.label}
                        </Label>
                        <Input
                          id={`booking-${x.key}`}
                          className="mt-2 h-12 text-base"
                          type={x.type}
                          required={x.required}
                          minLength={
                            x.key === "contact_name" ? 2 : x.key === "phone" ? 7 : undefined
                          }
                          maxLength={
                            x.key === "contact_name" ? 120 : x.key === "phone" ? 40 : undefined
                          }
                          value={f[x.key]}
                          onChange={(e) => update(x.key, e.target.value)}
                        />
                      </div>
                    ))}
                    <div>
                      <Label htmlFor="booking-people" className="text-base">
                        Number of {regular ? "bowlers" : "guests"}
                      </Label>
                      <Input
                        id="booking-people"
                        className="mt-2 h-12 text-base"
                        type="number"
                        min={1}
                        max={regular ? 36 : 1000}
                        required
                        value={f.people}
                        onChange={(e) =>
                          regular
                            ? numbers("people", Number(e.target.value))
                            : update("people", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="booking-lanes" className="text-base">
                        {regular ? "Number of lanes" : "Lanes requested"}
                      </Label>
                      <select
                        id="booking-lanes"
                        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                        value={f.lanes}
                        onChange={(e) =>
                          regular
                            ? numbers("lanes", Number(e.target.value))
                            : update("lanes", Number(e.target.value))
                        }
                      >
                        {!regular && <option value={0}>No bowling lanes</option>}
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "lane" : "lanes"}
                          </option>
                        ))}
                      </select>
                    </div>
                    {regular && (
                      <div>
                        <Label htmlFor="booking-games" className="text-base">
                          Games per bowler
                        </Label>
                        <select
                          id="booking-games"
                          className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                          value={f.games}
                          onChange={(e) => numbers("games", Number(e.target.value))}
                        >
                          {Array.from(new Set([...config.games, f.games])).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {f.lanes > 0 && (
                      <div>
                        <Label htmlFor="booking-duration" className="text-base">
                          {regular ? "Estimated duration" : "Bowling duration"} (minutes)
                        </Label>
                        <Input
                          id="booking-duration"
                          className="mt-2 h-12 text-base"
                          type="number"
                          min={1}
                          max={1440}
                          required
                          value={f.duration}
                          onChange={(e) => update("duration", Number(e.target.value))}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="booking-status" className="text-base">
                        {regular ? "Status" : "Follow-up status"}
                      </Label>
                      <select
                        id="booking-status"
                        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                        value={f.status}
                        onChange={(e) => update("status", e.target.value)}
                      >
                        {(regular
                          ? ["confirmed", "pending", "cancelled", "completed"]
                          : ["inquiry", "tentative", "confirmed", "cancelled"]
                        ).map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!regular && (
                      <div>
                        <Label htmlFor="booking-email" className="text-base">
                          Email (optional)
                        </Label>
                        <Input
                          id="booking-email"
                          className="mt-2 h-12 text-base"
                          type="email"
                          maxLength={254}
                          value={f.email}
                          onChange={(e) => update("email", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  {!regular && (
                    <div>
                      <Label htmlFor="booking-facility" className="text-base">
                        Meeting room or other requirements (optional)
                      </Label>
                      <Input
                        id="booking-facility"
                        className="mt-2 h-12 text-base"
                        maxLength={1000}
                        value={f.facility}
                        onChange={(e) => update("facility", e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="booking-notes" className="text-base">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="booking-notes"
                      className="mt-2 text-base"
                      maxLength={3000}
                      value={f.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>
                </>
              )}
              {error && (
                <p role="alert" className="border-l-4 border-destructive pl-3 text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" size="lg" disabled={busy} onClick={onClose}>
                  Close without saving
                </Button>
                <Button type="submit" size="lg" disabled={busy}>
                  {review && <CheckCircle2 />}
                  {busy ? "Saving…" : review ? "Save Reservation" : "Review booking"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
