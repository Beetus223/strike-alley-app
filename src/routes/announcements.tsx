import { useWebsiteContent, useBusiness } from "@/lib/website-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { useAnnouncements } from "@/lib/content";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements | Vegreville Bowling Lanes" },
      { name: "description", content: "News, closures, special offers and important updates from Vegreville Bowling Lanes." },
      { property: "og:title", content: "Announcements | Vegreville Bowling Lanes" },
      { property: "og:description", content: "The latest news and notices from your local 5-pin centre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnnouncementsPage,
});

function fmt(d: string) {
  return new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}

function AnnouncementsPage() {
  const { text } = useWebsiteContent();
  const CENTRE = useBusiness();


  const { data, isError } = useAnnouncements();
  const items = data ?? [];
  return (
    <>
      <PageHeader eyebrow={text("announcements.001", "News & notices")} title={text("announcements.002", "Announcements")} intro={text("announcements.003", "Closures, special offers and important updates from the centre.")} />
      <Section>
        {isError ? (
          <p role="alert" className="text-muted-foreground">{text("announcements.004", "Announcements couldn't load. Please refresh or call us.")}</p>
        ) : items.length === 0 ? (
          <div className="card-soft max-w-2xl rounded-2xl p-8 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <p className="mt-3 font-medium">{text("announcements.005", "No announcements right now.")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {text("announcements.006", "Check our")}<Link to="/events" className="text-primary hover:underline">{text("announcements.007", "upcoming events")}</Link> or{" "}
              <Link to="/hours" className="text-primary hover:underline">{text("announcements.008", "hours")}</Link>.
            </p>
          </div>
        ) : (
          <ul className="grid max-w-3xl gap-4">
            {items.map((a) => (
              <li key={a.id} className="card-soft rounded-2xl border-l-4 border-l-primary p-6">
                {a.image_url && <img src={a.image_url} alt="" loading="lazy" className="mb-4 aspect-video w-full rounded-lg object-cover"/>}
                <h2 className="text-2xl">{a.title}</h2>
                {a.starts_on || a.ends_on ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {a.starts_on ? fmt(a.starts_on) : ""}{a.ends_on ? ` – ${fmt(a.ends_on)}` : ""}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{a.message}</p>
              </li>
            ))}
          </ul>
        )}
        <NewsletterSignup />
      </Section>
    </>
  );
}
