import { SpecialScheduleEditor } from "@/components/content/SpecialScheduleEditor";
import { WebsiteEditor } from "@/components/content/WebsiteEditor";
import { OfferingEditor } from "@/components/content/OfferingEditor";
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
  const { isStaff, loading, accessError, retryAccess, signOut } = useAuth();

  if (loading) return <Section>Loading…</Section>;
  if (accessError) {
    return (
      <Section>
        <div className="mx-auto max-w-lg border border-border rounded-lg p-8 text-center">
          <h1 className="text-3xl">Unable to check staff access</h1>
          <p className="mt-2 text-muted-foreground">Your account access could not be checked. Please try again.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={retryAccess}>Try again</Button>
            <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </Section>
    );
  }
  if (!isStaff) {
    return (
      <Section>
        <div className="mx-auto max-w-lg rounded-2xl border border-border p-8 text-center">
          <h1 className="text-3xl">Staff only</h1>
          <p className="mt-2 text-muted-foreground">
            This area is for centre staff. If you manage a league and need access, ask an
            administrator to add your account.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={retryAccess}>Check access again</Button>
            <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Centre staff"
        title="Dashboard"
        intro="Bookings and website content"
      />
      <Section>
        <Tabs defaultValue="bookings">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="website">Manage Website</TabsTrigger>
            <TabsTrigger value="packages">Packages & Rentals</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="menu">Snack Bar Menu</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="website" className="mt-6"><WebsiteEditor /></TabsContent>
          <TabsContent value="packages" className="mt-6"><OfferingEditor /></TabsContent>
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
            <StaffReservations />
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
      const { error } = await supabase.from("events").update({is_archived:true,is_active:false}).eq("id", id);
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
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

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
        ...(form.get("is_active") === "on" && (form.has("featured")) ? {is_archived:false} : {}),
        ...(form.has("featured") ? {featured:form.get("featured")==="on"} : {}),
        ...(form.has("image_url") ? {image_url:str(form,"image_url")} : {}),
      },
    });
    
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
      <Field label="Photo link (optional)" name="image_url" type="url" defaultValue={event?.image_url} />
      <label className="flex items-center gap-3"><Switch name="featured" defaultChecked={event?.featured ?? true}/>Featured on home page</label>
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
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

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
        ...(form.get("is_active") === "on" && (form.has("featured")) ? {is_archived:false} : {}),
        registration_open: form.get("registration_open") === "on",
      },
    });
    
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
      const { error } = await supabase
        .from("seasonal_hour_schedules")
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seasonal schedule updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSeasonalDay = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("seasonal_hours")
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seasonal hours updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSeasonal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seasonal_hour_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seasonal schedule removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

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

      <SpecialScheduleEditor />
      <p className="text-sm text-muted-foreground">When business hours change, update booking windows in Bookings → Settings too. One-off closures are managed there.</p>
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
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

                  saveSeasonalSchedule.mutate({
                    id: schedule.id,
                    values: {
                      title: String(form.get("title")),
                      date_label: String(form.get("date_label")),
                      starts_on: str(form, "starts_on"),
                      ends_on: str(form, "ends_on"),
                      reservation_notice: String(form.get("reservation_notice")),
                      is_active: form.get("is_active") === "on",
        ...(form.get("is_active") === "on" && (form.has("featured")) ? {is_archived:false} : {}),
                    },
                  });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Schedule title"
                    name="title"
                    defaultValue={schedule.title}
                    required
                  />
                  <Field
                    label="Date range"
                    name="date_label"
                    defaultValue={schedule.date_label}
                    required
                  />
                  <Field
                    label="Starts on"
                    name="starts_on"
                    type="date"
                    defaultValue={schedule.starts_on}
                  />
                  <Field
                    label="Ends on"
                    name="ends_on"
                    type="date"
                    defaultValue={schedule.ends_on}
                  />
                  <Field
                    label="Reservation notice"
                    name="reservation_notice"
                    defaultValue={schedule.reservation_notice}
                    required
                  />
                  <div className="flex items-center gap-3 pt-7">
                    <Switch
                      id={`seasonal-${schedule.id}`}
                      name="is_active"
                      defaultChecked={schedule.is_active}
                    />
                    <Label htmlFor={`seasonal-${schedule.id}`}>Show on the website</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Save schedule</Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Remove “${schedule.title}” and all of its daily hours?`))
                        removeSeasonal.mutate(schedule.id);
                    }}
                  >
                    Remove schedule
                  </Button>
                </div>
              </form>

              <div className="mt-6 space-y-3 border-t border-border pt-5">
                {schedule.seasonal_hours.map((day: SeasonalHoursDay) => (
                  <form
                    key={day.id}
                    className="rounded-xl border border-border p-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

                      saveSeasonalDay.mutate({
                        id: day.id,
                        values: {
                          food_service: str(form, "food_service"),
                          bowler_hours: str(form, "bowler_hours"),
                          note: str(form, "note"),
                        },
                      });
                    }}
                  >
                    <h3 className="text-xl">{day.day_label}</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Food service"
                        name="food_service"
                        defaultValue={day.food_service}
                      />
                      <Field label="Bowlers" name="bowler_hours" defaultValue={day.bowler_hours} />
                      <Field label="Note" name="note" defaultValue={day.note} />
                    </div>
                    <Button type="submit" size="sm" className="mt-4">
                      Save {day.day_label}
                    </Button>
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
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

    save.mutate({
      id: item?.id,
      values: {
        label: String(form.get("label")),
        price: `$${Number(String(form.get("price")).replace("$", "")).toFixed(2)}`,
        note: str(form, "note"),
        category: String(form.get("category") || "Walk-in"),
        sort_order: Number(form.get("sort_order") || 0),
        is_active: form.get("is_active") === "on",
        ...(form.get("is_active") === "on" && (form.has("featured")) ? {is_archived:false} : {}),
        ...(form.has("featured") ? {featured:form.get("featured")==="on"} : {}),
        ...(form.has("image_url") ? {image_url:str(form,"image_url")} : {}),
      },
    });
    
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
      const { error } = await supabase.from("announcements").update({is_archived:true,is_active:false}).eq("id", id);
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
    const start=String(form.get("start_date") || form.get("starts_on") || "");
    const end=String(form.get("end_date") || form.get("ends_on") || "");
    if(start && end && end < start){toast.error("End date must be on or after the start date.");return;}
    if(form.has("message") && !String(form.get("message")).trim()){toast.error("A message is required.");return;}
    if(form.has("price") && !/^\$?\d+(\.\d{1,2})?$/.test(String(form.get("price")).trim())){toast.error("Enter a valid dollar amount, such as $5.25.");return;}

    save.mutate({
      id: item?.id,
      values: {
        title: String(form.get("title")),
        message: String(form.get("message")),
        starts_on: str(form, "starts_on"),
        ends_on: str(form, "ends_on"),
        is_active: form.get("is_active") === "on",
        ...(form.get("is_active") === "on" && (form.has("featured")) ? {is_archived:false} : {}),
        ...(form.has("featured") ? {featured:form.get("featured")==="on"} : {}),
        ...(form.has("image_url") ? {image_url:str(form,"image_url")} : {}),
      },
    });
    
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
      <Field label="Photo link (optional)" name="image_url" type="url" defaultValue={item?.image_url} />
      <label className="flex items-center gap-3"><Switch name="featured" defaultChecked={item?.featured ?? true}/>Featured on home page</label>
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

