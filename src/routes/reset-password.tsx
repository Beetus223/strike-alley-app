import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Section } from "@/components/site/PageHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Set Staff Password | Vegreville Bowling Lanes" },
    { name: "description", content: "Secure password recovery for authorized Vegreville Bowling Lanes staff." },
    { property: "og:title", content: "Set Staff Password | Vegreville Bowling Lanes" },
    { property: "og:description", content: "Secure staff password recovery." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, loading, passwordSetup, signOut } = useAuth();
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setVerified(false);
    if (user && passwordSetup) {
      void supabase.auth.getUser().then(({ data, error }) => {
        if (!cancelled) setVerified(!error && Boolean(data.user));
      });
    }
    return () => { cancelled = true; };
  }, [user?.id, passwordSetup]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!verified || !passwordSetup) return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage(error.message); return; }
      setSaved(true);
      setMessage("Your password has been updated. Sign in with your new password.");
      await signOut();
    } catch {
      setMessage("Please return to staff sign in. If your password was not saved, request a new reset link.");
    } finally { setBusy(false); }
  }

  return <>
    <PageHeader eyebrow="Authorized centre staff" title="Set your password" />
    <Section><div className="mx-auto max-w-md">
      {saved ? <p role="status">{message}</p> : loading ? <p>Checking your reset link…</p> : verified && passwordSetup ?
        <form onSubmit={save} className="card-soft space-y-4 rounded-2xl p-6">
          <div><Label htmlFor="new-password">New password</Label><Input id="new-password" name="password" type="password" autoComplete="new-password" required className="mt-2" /></div>
          <div><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required className="mt-2" /></div>
          {message && <p role="alert" className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
        </form> : <p role="status">A valid password-reset or invitation link is required. Request a new link from staff sign in.</p>}
      <Button asChild variant="ghost" className="mt-4"><Link to="/auth">Back to staff sign in</Link></Button>
    </div></Section>
  </>;
}