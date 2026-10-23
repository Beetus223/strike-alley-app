import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { PageHeader, Section } from "@/components/site/PageHeader";
import { StaffReservations } from "@/components/reservations/StaffReservations";
import { MenuEditor } from "@/components/food/MenuEditor";
import { Field, PanelIntro, TextField } from "@/components/site/AdminField";

import {
  useAnnouncements,
  useEvents,
  useHours,
  useLeagues,
  usePricing,
  useSeasonalHours,
  type AnnouncementItem,
  type EventItem,
  type HoursItem,
  type LeagueItem,
  type PricingItem,
  type SeasonalHoursDay,
  type SeasonalHoursSchedule,
} from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Manage events, hours, pricing, leagues, menu and booking requests for Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Staff Dashboard | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Everything centre staff need to keep the website up to date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const STATUSES = ["new", "confirmed", "declined", "completed"] as const;

/** Anything saved here should refresh the public pages too. */
function useContentInvalidate() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["content"] });
}

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v === "" ? null : v;
}

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
        intro="Everything on the website — events, hours, prices, announcements, leagues and the snack bar menu — is edited here. Changes show up on the public pages right away."
      />
      <Section>
        <Tabs defaultValue="events">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="menu">Snack Bar Menu</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="events" className="mt-6">
            <EventsPanel />
          </TabsContent>
          <TabsContent value="leagues" className="mt-6">
            <LeaguesPanel />
          </TabsContent>
          <TabsContent value="hours" className="mt-6">
            <HoursPanel />
          </TabsContent>
          <TabsContent value="pricing" className="mt-6">
            <PricingPanel />
          </TabsContent>
          <TabsContent value="announcements" className="mt-6">
            <AnnouncementsPanel />
          </TabsContent>
          <TabsContent value="menu" className="mt-6">
            <MenuEditor />
          </TabsContent>
          <TabsContent value="bookings" className="mt-6">
            <Tabs defaultValue="reservations"><TabsList><TabsTrigger value="reservations">Lane reservations</TabsTrigger><TabsTrigger value="inquiries">Event inquiries & previous requests</TabsTrigger></TabsList><TabsContent value="reservations" className="mt-6"><StaffReservations /></TabsContent><TabsContent value="inquiries" className="mt-6"><BookingsPanel /></TabsContent></Tabs>
          </TabsContent>
        </Tabs>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ events */

function EventsPanel() {
  const invalidate = useContentInvalidate();
  const events = useEvents(true);

  const save = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | undefined;
      values: Record<string, unknown>;
    }) => {
      const { error } = id
        ? await supabase
            .from("events")
            .update(values as never)
            .eq("id", id)
        : await supabase.from("events").insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      id,
      values: {
        title: String(form.get("title")),
        category: String(form.get("category") || "Special"),
        schedule_text: str(form, "schedule_text"),
        start_date: str(form, "start_date"),
        end_date: str(form, "end_date"),
        start_time: str(form, "start_time"),
        end_time: str(form, "end_time"),
        description: str(form, "description"),
        sort_order: Number(form.get("sort_order") || 0),
        is_active: form.get("is_active") === "on",
      },
    });
    if (!id) e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <PanelIntro>
        Anything listed here appears in “What’s on this week” on the homepage and on the events
        calendar. Use “When” for plain wording like “Every Friday, 7:00 – 10:00 PM”, or fill in the
        date and time boxes instead. Untick “Show on the website” to hide an event without deleting
        it.
      </PanelIntro>

      <details className="card-soft rounded-2xl p-5" open>
        <summary className="cursor-pointer font-display text-2xl">Add a new event</summary>
        <EventForm onSubmit={(e) => submit(e)} submitLabel="Add event" />
      </details>

      {(events.data ?? []).map((ev) => (
        <details key={ev.id} className="card-soft rounded-2xl p-5">
          <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-2xl">{ev.title}</span>
            <span className="text-sm text-muted-foreground">
              {ev.category}
              {ev.is_active ? "" : " · hidden"}
            </span>
          </summary>
          <EventForm
            event={ev}
            onSubmit={(e) => submit(e, ev.id)}
            submitLabel="Save changes"
            onDelete={() => {
              if (confirm(`Remove “${ev.title}” from the website?`)) remove.mutate(ev.id);
            }}
          />
        </details>
      ))}
    </div>
  );
}

function EventForm({
  event,
  onSubmit,
  submitLabel,
  onDelete,
}: {
  event?: EventItem | undefined;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  onDelete?: (() => void) | undefined;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event title" name="title" defaultValue={event?.title} required />
        <Field
          label="Category"
          name="category"
          defaultValue={event?.category ?? "Special"}
          hint="For example: Weekly, Tournament, Seasonal, Holiday, Glow"
        />
      </div>
      <Field
        label="When (plain wording)"
        name="schedule_text"
        defaultValue={event?.schedule_text}
        placeholder="Every Friday, 7:00 PM – 10:00 PM"
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Start date" name="start_date" type="date" defaultValue={event?.start_date} />
        <Field label="End date" name="end_date" type="date" defaultValue={event?.end_date} />
        <Field label="Start time" name="start_time" type="time" defaultValue={event?.start_time} />
        <Field label="End time" name="end_time" type="time" defaultValue={event?.end_time} />
      </div>
      <TextField label="Description" name="description" defaultValue={event?.description} />
      <div className="flex flex-wrap items-end gap-6">
        <Field
          label="Order on the page"
          name="sort_order"
          type="number"
          defaultValue={event?.sort_order ?? 0}
        />
        <label className="flex items-center gap-3 pb-2 text-sm">
          <Switch name="is_active" defaultChecked={event?.is_active ?? true} />
          Show on the website
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
        {onDelete ? (
          <Button type="button" variant="outline" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------- leagues */

function LeaguesPanel() {
  const invalidate = useContentInvalidate();
  const leagues = useLeagues(true);

  const save = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | undefined;
      values: Record<string, unknown>;
    }) => {
      const { error } = id
        ? await supabase
            .from("leagues")
            .update(values as never)
            .eq("id", id)
        : await supabase.from("leagues").insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("League saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leagues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("League removed");
      invalidate();
    },
    onError: (e: Error) =>
      toast.error(
        `${e.message}. If this league has bowlers or scores, hide it instead of deleting it.`,
      ),
  });

  function submit(e: React.FormEvent<HTMLFormElement>, league?: LeagueItem) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    save.mutate({
      id: league?.id,
      values: {
        name,
        slug:
          league?.slug ??
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        night: String(form.get("night")),
        start_time: String(form.get("start_time")),
        season: String(form.get("season")),
        format: String(form.get("format")),
        fee: String(form.get("fee")),
        spots: str(form, "spots"),
        description: str(form, "description"),
        sort_order: Number(form.get("sort_order") || 0),
        is_active: form.get("is_active") === "on",
        registration_open: form.get("registration_open") === "on",
      },
    });
    if (!league) e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <PanelIntro>
        These leagues appear on the homepage and the Leagues page. Enter the night and start time
        exactly as you want them to read, for example “Monday” and “7:00 PM”. Hide a league that
        isn’t running instead of deleting it if it already has bowlers and scores.
      </PanelIntro>

      <details className="card-soft rounded-2xl p-5">
        <summary className="cursor-pointer font-display text-2xl">Add a new league</summary>
        <LeagueForm onSubmit={(e) => submit(e)} submitLabel="Add league" />
      </details>

      {(leagues.data ?? []).map((l) => (
        <details key={l.id} className="card-soft rounded-2xl p-5">
          <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-2xl">{l.name}</span>
            <span className="text-sm text-muted-foreground">
              {l.night} · {l.start_time}
              {l.is_active ? "" : " · hidden"}
            </span>
          </summary>
          <LeagueForm
            league={l}
            onSubmit={(e) => submit(e, l)}
            submitLabel="Save changes"
            onDelete={() => {
              if (confirm(`Remove “${l.name}” from the website?`)) remove.mutate(l.id);
            }}
          />
        </details>
      ))}
    </div>
  );
}

function LeagueForm({
  league,
  onSubmit,
  submitLabel,
  onDelete,
}: {
  league?: LeagueItem | undefined;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  onDelete?: (() => void) | undefined;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="League name" name="name" defaultValue={league?.name} required />
        <Field
          label="Night"
          name="night"
          defaultValue={league?.night}
          required
          placeholder="Monday"
        />
        <Field
          label="Start time"
          name="start_time"
          defaultValue={league?.start_time}
          required
          placeholder="7:00 PM"
        />
        <Field
          label="Season"
          name="season"
          defaultValue={league?.season}
          required
          placeholder="September – April"
        />
        <Field
          label="Format"
          name="format"
          defaultValue={league?.format}
          required
          placeholder="Teams of 4, 3 games, handicap"
        />
        <Field
          label="Fee"
          name="fee"
          defaultValue={league?.fee}
          required
          placeholder="$18 per bowler"
        />
        <Field
          label="Open spots note"
          name="spots"
          defaultValue={league?.spots}
          placeholder="2 team spots open"
        />
        <Field
          label="Order on the page"
          name="sort_order"
          type="number"
          defaultValue={league?.sort_order ?? 0}
        />
      </div>
      <TextField label="Description" name="description" defaultValue={league?.description} />
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm">
          <Switch name="is_active" defaultChecked={league?.is_active ?? true} />
          Show on the website
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Switch name="registration_open" defaultChecked={league?.registration_open ?? true} />
          Registration open
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
        {onDelete ? (
          <Button type="button" variant="outline" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------- hours */

function HoursPanel() {
  const invalidate = useContentInvalidate();
  const hours = useHours();
  const seasonal = useSeasonalHours(true);

  const save = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("hours_of_operation")
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hours updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSeasonalSchedule = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("seasonal_hour_schedules").update(values as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Seasonal schedule updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSeasonalDay = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("seasonal_hours").update(values as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Seasonal hours updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSeasonal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seasonal_hour_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Seasonal schedule removed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      id,
      values: {
        open_hours: String(form.get("open_hours")),
        public_bowling: str(form, "public_bowling"),
        food_service: str(form, "food_service"),
        glow_bowling: str(form, "glow_bowling"),
        note: str(form, "note"),
      },
    });
  }

  return (
    <div className="space-y-5">
      <PanelIntro>
        Type the hours exactly as you want visitors to read them, for example “10:30 AM – 10:00 PM”.
        Leave a box empty to hide that line for the day. The note appears in small italics under
        that day.
      </PanelIntro>

      {(hours.data ?? []).map((h) => (
        <form
          key={h.id}
          onSubmit={(e) => submit(e, h.id)}
          className="card-soft space-y-4 rounded-2xl p-5"
        >
          <h3 className="font-display text-2xl">{h.day_label}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Open" name="open_hours" defaultValue={h.open_hours} required />
            <Field label="Public bowling" name="public_bowling" defaultValue={h.public_bowling} />
            <Field label="Food service" name="food_service" defaultValue={h.food_service} />
            <Field label="Glow neon bowling" name="glow_bowling" defaultValue={h.glow_bowling} />
          </div>
          <Field label="Note for this day" name="note" defaultValue={h.note} />
          <Button type="submit">Save {h.day_label}</Button>
        </form>
      ))}

      <div className="border-t border-border pt-8">
        <h2 className="text-3xl">Seasonal hours</h2>
        <PanelIntro>
          Seasonal schedules stay separate from regular hours. Turn one off to hide it from the
          website, edit any wording below, or remove it when it is no longer needed.
        </PanelIntro>
        <div className="space-y-6">
          {(seasonal.data ?? []).map((schedule: SeasonalHoursSchedule) => (
            <details key={schedule.id} className="card-soft rounded-2xl p-5" open>
              <summary className="cursor-pointer font-display text-2xl">{schedule.title}</summary>
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  saveSeasonalSchedule.mutate({ id: schedule.id, values: {
                    title: String(form.get("title")),
                    date_label: String(form.get("date_label")),
                    reservation_notice: String(form.get("reservation_notice")),
                    is_active: form.get("is_active") === "on",
                  }});
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Schedule title" name="title" defaultValue={schedule.title} required />
                  <Field label="Date range" name="date_label" defaultValue={schedule.date_label} required />
                  <Field label="Reservation notice" name="reservation_notice" defaultValue={schedule.reservation_notice} required />
                  <div className="flex items-center gap-3 pt-7">
                    <Switch id={`seasonal-${schedule.id}`} name="is_active" defaultChecked={schedule.is_active} />
                    <Label htmlFor={`seasonal-${schedule.id}`}>Show on the website</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Save schedule</Button>
                  <Button type="button" variant="destructive" onClick={() => {
                    if (confirm(`Remove “${schedule.title}” and all of its daily hours?`)) removeSeasonal.mutate(schedule.id);
                  }}>Remove schedule</Button>
                </div>
              </form>

              <div className="mt-6 space-y-3 border-t border-border pt-5">
                {schedule.seasonal_hours.map((day: SeasonalHoursDay) => (
                  <form key={day.id} className="rounded-xl border border-border p-4" onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    saveSeasonalDay.mutate({ id: day.id, values: {
                      food_service: str(form, "food_service"),
                      bowler_hours: str(form, "bowler_hours"),
                      note: str(form, "note"),
                    }});
                  }}>
                    <h3 className="text-xl">{day.day_label}</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                      <Field label="Food service" name="food_service" defaultValue={day.food_service} />
                      <Field label="Bowlers" name="bowler_hours" defaultValue={day.bowler_hours} />
                      <Field label="Note" name="note" defaultValue={day.note} />
                    </div>
                    <Button type="submit" size="sm" className="mt-4">Save {day.day_label}</Button>
                  </form>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- pricing */

function PricingPanel() {
  const invalidate = useContentInvalidate();
  const pricing = usePricing(true);

  const save = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | undefined;
      values: Record<string, unknown>;
    }) => {
      const { error } = id
        ? await supabase
            .from("pricing_items")
            .update(values as never)
            .eq("id", id)
        : await supabase.from("pricing_items").insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pricing saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Price removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent<HTMLFormElement>, item?: PricingItem) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      id: item?.id,
      values: {
        label: String(form.get("label")),
        price: String(form.get("price")),
        note: str(form, "note"),
        category: String(form.get("category") || "Walk-in"),
        sort_order: Number(form.get("sort_order") || 0),
        is_active: form.get("is_active") === "on",
      },
    });
    if (!item) e.currentTarget.reset();
  }

  return (
    <div className="space-y-5">
      <PanelIntro>
        These prices show on the homepage and the Bowling & Prices page. Write the price the way it
        should appear, including the dollar sign.
      </PanelIntro>

      <form onSubmit={(e) => submit(e)} className="card-soft space-y-4 rounded-2xl p-5">
        <h3 className="font-display text-2xl">Add a price</h3>
        <PricingFields />
        <Button type="submit">Add price</Button>
      </form>

      {(pricing.data ?? []).map((p) => (
        <form
          key={p.id}
          onSubmit={(e) => submit(e, p)}
          className="card-soft space-y-4 rounded-2xl p-5"
        >
          <PricingFields item={p} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm(`Remove “${p.label}”?`)) remove.mutate(p.id);
              }}
            >
              Delete
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}

function PricingFields({ item }: { item?: PricingItem }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What it is" name="label" defaultValue={item?.label} required />
        <Field label="Price" name="price" defaultValue={item?.price} required placeholder="$5.25" />
      </div>
      <Field
        label="Small print"
        name="note"
        defaultValue={item?.note}
        placeholder="per person, per game"
      />
      <div className="flex flex-wrap items-end gap-6">
        <Field label="Category" name="category" defaultValue={item?.category ?? "Walk-in"} />
        <Field label="Order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
        <label className="flex items-center gap-3 pb-2 text-sm">
          <Switch name="is_active" defaultChecked={item?.is_active ?? true} />
          Show on the website
        </label>
      </div>
    </>
  );
}

/* ----------------------------------------------------------- announcements */

function AnnouncementsPanel() {
  const invalidate = useContentInvalidate();
  const announcements = useAnnouncements(true);

  const save = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | undefined;
      values: Record<string, unknown>;
    }) => {
      const { error } = id
        ? await supabase
            .from("announcements")
            .update(values as never)
            .eq("id", id)
        : await supabase.from("announcements").insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent<HTMLFormElement>, item?: AnnouncementItem) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      id: item?.id,
      values: {
        title: String(form.get("title")),
        message: String(form.get("message")),
        starts_on: str(form, "starts_on"),
        ends_on: str(form, "ends_on"),
        is_active: form.get("is_active") === "on",
      },
    });
    if (!item) e.currentTarget.reset();
  }

  return (
    <div className="space-y-5">
      <PanelIntro>
        An active announcement shows as a banner at the top of the homepage — handy for closures,
        holiday hours or a last-minute change. Leave the dates empty to show it until you turn it
        off.
      </PanelIntro>

      <form onSubmit={(e) => submit(e)} className="card-soft space-y-4 rounded-2xl p-5">
        <h3 className="font-display text-2xl">Post an announcement</h3>
        <AnnouncementFields />
        <Button type="submit">Post announcement</Button>
      </form>

      {(announcements.data ?? []).map((a) => (
        <form
          key={a.id}
          onSubmit={(e) => submit(e, a)}
          className="card-soft space-y-4 rounded-2xl p-5"
        >
          <AnnouncementFields item={a} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm(`Remove “${a.title}”?`)) remove.mutate(a.id);
              }}
            >
              Delete
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}

function AnnouncementFields({ item }: { item?: AnnouncementItem }) {
  return (
    <>
      <Field label="Title" name="title" defaultValue={item?.title} required />
      <TextField label="Message" name="message" defaultValue={item?.message} rows={2} />
      <div className="flex flex-wrap items-end gap-6">
        <Field label="Show from" name="starts_on" type="date" defaultValue={item?.starts_on} />
        <Field label="Show until" name="ends_on" type="date" defaultValue={item?.ends_on} />
        <label className="flex items-center gap-3 pb-2 text-sm">
          <Switch name="is_active" defaultChecked={item?.is_active ?? true} />
          Active
        </label>
      </div>
    </>
  );
}

/* ------------------------------------------------------- scores & averages */

/* ---------------------------------------------------------------- bookings */

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
        <article key={b.id} className="card-soft rounded-2xl p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl">{b.contact_name}</h3>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest text-primary">
              {b.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-primary">{b.booking_type}</p>
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
