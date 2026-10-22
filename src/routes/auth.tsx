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

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In | Vegreville Bowling Lanes" },
      { name: "description", content: "Sign in for Vegreville Bowling Lanes centre staff." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Staff Sign In | Vegreville Bowling Lanes" },
      { property: "og:description", content: "Centre staff sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/admin" });
  }, [loading, user, navigate]);

  async function signIn(email: string, password: string) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      void navigate({ to: "/admin" });
    } catch {
      toast.error("Wrong email or password.");
    } finally {
      setBusy(false);
    }
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
    void navigate({ to: "/admin" });
  }

  return (
    <>
      <PageHeader
        eyebrow="Centre staff"
        title="Sign in"
        intro="This sign-in is for Vegreville Bowling Lanes staff to update the website."
      />
      <Section>
        <div className="mx-auto max-w-md">
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
        </div>
      </Section>
    </>
  );
}
