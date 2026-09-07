import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CENTRE } from "@/lib/site-data";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Lane | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "Send a lane, party or rental booking request to Vegreville Bowling Lanes. We confirm by phone or email within one business day.",
      },
      { property: "og:title", content: "Book a Lane | Vegreville Bowling Lanes" },
      {
        property: "og:description",
        content: "Request a lane, birthday party or full-house rental at our 5-pin centre.",
      },
    ],
  }),
  component: BookPage,
});

const BOOKING_TYPES = [
  "Open bowling lane",
  "Birthday party",
  "Group / fundraiser rental",
  "Whole house rental",
  "Meeting room",
];

function BookPage() {
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<string>(BOOKING_TYPES[0] ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    window.setTimeout(() => {
      setSubmitting(false);
      form.reset();
      setType(BOOKING_TYPES[0]);
      toast.success("Request sent", {
        description: "We'll confirm your lane by phone or email within one business day.",
      });
    }, 600);
  }

  return (
    <>
      <PageHeader
        eyebrow="Confirmed within one business day"
        title="Book a lane"
        intro={`Tell us when you'd like to bowl and how many people are coming. Prefer to talk it through? Call ${CENTRE.phone}.`}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <form onSubmit={handleSubmit} className="neon-panel rounded-2xl p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="booking-type">What are you booking?</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="booking-type" className="mt-2 w-full">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" name="name" required autoComplete="name" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className="mt-2"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="date">Preferred date</Label>
                <Input id="date" name="date" type="date" required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="time">Preferred start time</Label>
                <Input id="time" name="time" type="time" required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="people">Number of bowlers</Label>
                <Input
                  id="people"
                  name="people"
                  type="number"
                  min={1}
                  max={60}
                  defaultValue={4}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="lanes">Lanes needed</Label>
                <Input id="lanes" name="lanes" type="number" min={1} max={8} defaultValue={1} className="mt-2" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Anything else? (allergies, cake, accessibility)</Label>
                <Textarea id="notes" name="notes" rows={4} className="mt-2" />
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Send booking request"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              A request isn't a confirmed reservation until we reply.
            </p>
          </form>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-2xl">Before you send</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Each lane fits up to 6 bowlers comfortably.</li>
                <li>Parties need one week's notice and a $50 deposit.</li>
                <li>League nights book out lanes 1–8 after 7 PM, Monday and Thursday.</li>
                <li>Glow bowling starts at 8 PM Friday and Saturday.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-2xl">Rather call?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {CENTRE.phone} · {CENTRE.email}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{CENTRE.address}</p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
