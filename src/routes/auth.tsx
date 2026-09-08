import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Section } from "@/components/site/PageHeader";
import { bowlerLoginEmail, normalizeBowlerId } from "@/lib/bowler-id";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Bowler Sign In | Vegreville Bowling Lanes" },
      {
        name: "description",
        content:
          "League bowlers sign in with their Bowler ID to see their averages, sessions and game history at Vegreville Bowling Lanes.",
      },
      { property: "og:title", content: "Bowler Sign In | Vegreville Bowling Lanes" },
      { property: "og:description", content: "League bowler and staff portal sign in." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"bowler" | "staff">("bowler");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  async function signIn(email: string, password: string) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      void navigate({ to: "/dashboard" });
    } catch {
      toast.error(
        mode === "bowler"
          ? "That Bowler ID and password don’t match. Ask at the counter if you need a reset."
          : "Wrong email or password.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleBowler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const id = normalizeBowlerId(String(form.get("bowler_id") ?? ""));
    void signIn(bowlerLoginEmail(id), String(form.get("password")));
  }

  function handleStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void signIn(String(form.get("email")), String(form.get("password")));
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  }

  return (
    <>
      <PageHeader
        eyebrow={mode === "bowler" ? "League bowlers" : "Centre staff"}
        title="Sign in"
        intro="League bowlers sign in with the Bowler ID the centre gave them to see every game they've bowled and watch their average update automatically."
      />
      <Section>
        <div className="mx-auto max-w-md">
          {mode === "bowler" ? (
            <form onSubmit={handleBowler} className="card-soft space-y-4 rounded-2xl p-6">
              <div>
                <Label htmlFor="bowler_id">Bowler ID</Label>
                <Input
                  id="bowler_id"
                  name="bowler_id"
                  required
                  autoComplete="username"
                  placeholder="VB-48291"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Bowler accounts are set up by centre staff. Forgot your ID or password? Call the
                centre at (780) 632-2695 or ask at the counter and we’ll reset it for you.
              </p>
            </form>
          ) : (
            <form onSubmit={handleStaff} className="card-soft space-y-4 rounded-2xl p-6">
              <div>
                <Label htmlFor="email">Staff email</Label>
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
                <Label htmlFor="staff_password">Password</Label>
                <Input
                  id="staff_password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : "Staff sign in"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                Continue with Google
              </Button>
            </form>
          )}

          <button
            type="button"
            className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "bowler" ? "staff" : "bowler")}
          >
            {mode === "bowler" ? "Centre staff sign in" : "Back to bowler sign in"}
          </button>
        </div>
      </Section>
    </>
  );
}
