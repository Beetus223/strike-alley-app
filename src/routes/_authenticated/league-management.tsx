
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { LeagueManagement } from "@/components/league-management/LeagueManagement";

export const Route = createFileRoute("/_authenticated/league-management")({
  head: () => ({
    meta: [
      { title: "League Management | Vegreville Bowling Lanes Staff" },
      {
        name: "description",
        content: "Internal league secretary tools for Vegreville Bowling Lanes staff.",
      },
      { property: "og:title", content: "League Management | Vegreville Bowling Lanes Staff" },
      { property: "og:description", content: "Internal staff-only league management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { isStaff, loading } = useAuth();
  if (loading) return <Section>Loading…</Section>;
  if (!isStaff) {
    return (
      <Section>
        <div className="mx-auto max-w-lg rounded-2xl border border-border p-8 text-center">
          <h1 className="text-3xl">Staff only</h1>
          <p className="mt-2 text-muted-foreground">
            League Management is for centre staff only.
          </p>
        </div>
      </Section>
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Centre staff"
        title="League Management"
        intro="Run league nights the way a league secretary does: set up the league, teams and bowlers, enter scores, and keep every week on record."
      />
      <Section>
        <Link to="/admin" className="mb-6 inline-block text-sm text-accent hover:underline">
          ← Back to Staff Dashboard
        </Link>
        <LeagueManagement />
      </Section>
    </>
  );
}
