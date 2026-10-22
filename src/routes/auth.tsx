import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { staffSignInError } from "@/lib/staff-auth";
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
  const [reset, setReset] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { user, loading, passwordSetup, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) void navigate({ to: passwordSetup ? "/reset-password" : "/admin" });
  }, [loading, user, passwordSetup, navigate]);

  async function signIn(email: string, password: string) {
    setBusy(true);
    setFeedback("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setFeedback(staffSignInError(error.code)); return; }
      // Session and authorization are refreshed by the shared auth provider.
    } catch {
      setFeedback("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    if (reset) void requestReset(email);
    else void signIn(email, String(form.get("password")));
  }

  async function requestReset(email: string) {
    setBusy(true);
    setFeedback("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setFeedback(error
        ? "Unable to send a reset link right now. Please try again later."
        : "If an account exists for this email, you’ll receive a password-reset link. Check your inbox and spam folder.");
    } catch {
      setFeedback("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Centre staff"
        title={reset ? "Reset password" : "Sign in"}
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
              {!reset && <div>
                <Label htmlFor="staff_password">Password</Label>
                <Input
                  id="staff_password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-2"
                />
              </div>}
              {feedback && <p role="status" className="text-sm text-muted-foreground">{feedback}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : reset ? "Send reset link" : "Staff sign in"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={() => { setReset(!reset); setFeedback(""); }}>
                {reset ? "Back to staff sign in" : "Forgot password?"}
              </Button>
              {user && <Button type="button" variant="outline" className="w-full" onClick={() => void signOut().catch(() => toast.error("Sign-out failed. Please try again."))}>Sign out</Button>}
            </form>
        </div>
      </Section>
    </>
  );
}
