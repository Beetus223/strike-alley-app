import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

/**
 * Edits an existing bowler record in place (never creates a new one).
 * The established average lives on the bowler's team membership(s) in the
 * given league, so every membership id passed in is updated together.
 */
export function EditBowlerDialog({
  bowlerId,
  memberIds,
  currentAverage,
  onClose,
}: {
  bowlerId: string | null;
  memberIds: string[];
  currentAverage: number | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const open = !!bowlerId;
  const row = useQuery({
    queryKey: ["lm", "bowler-detail", bowlerId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("bowlers").select("*").eq("id", bowlerId!).single();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ bowler_id: "", first_name: "", last_name: "", email: "", phone: "", notes: "", average: "" });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row.data) return;
    setForm({
      bowler_id: row.data.bowler_id,
      first_name: row.data.first_name,
      last_name: row.data.last_name,
      email: row.data.email ?? "",
      phone: row.data.phone ?? "",
      notes: row.data.notes ?? "",
      average: currentAverage != null ? String(currentAverage) : "",
    });
    setErr(null);
  }, [row.data, currentAverage]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!bowlerId) return;
    const first = form.first_name.trim(), last = form.last_name.trim(), bid = form.bowler_id.trim().toUpperCase();
    if (!first || !last) return setErr("First and last name are required.");
    if (!/^VB-\d{3,}$/.test(bid)) return setErr("Bowler ID must look like VB-48291.");
    const email = form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Email doesn't look right.");
    let avg: number | null = null;
    if (form.average.trim() !== "") {
      if (!/^\d+(\.\d+)?$/.test(form.average.trim())) return setErr("Average must be a number.");
      avg = Number(form.average);
      if (avg < 0 || avg > 400) return setErr("Average must be between 0 and 400.");
    }
    setErr(null);
    setSaving(true);
    try {
      const { error } = await supabase.from("bowlers").update({
        bowler_id: bid, first_name: first, last_name: last,
        email: email || null, phone: form.phone.trim() || null, notes: form.notes.trim() || null,
      }).eq("id", bowlerId);
      if (error) throw new Error(error.code === "23505" ? "That Bowler ID is already used." : error.message);
      if (memberIds.length) {
        const { error: mErr } = await supabase.from("lm_team_members").update({ entering_average: avg }).in("id", memberIds);
        if (mErr) throw new Error(mErr.message);
      }
      toast.success("Bowler updated");
      await qc.invalidateQueries({ queryKey: ["lm"] });
      onClose();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit bowler</DialogTitle>
          <DialogDescription>Changes update this same bowler. Team, scores and history stay connected.</DialogDescription>
        </DialogHeader>
        {row.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="eb-avg">Established average</Label>
              <Input id="eb-avg" inputMode="decimal" value={form.average} onChange={set("average")} disabled={!memberIds.length} className="mt-2 text-lg" placeholder="e.g. 185" />
              <p className="mt-1 text-xs text-muted-foreground">
                {memberIds.length ? "Used for handicap until they've bowled in this league. Leave blank for none." : "Put this bowler on a team in this league to set an average."}
              </p>
            </div>
            <div><Label htmlFor="eb-f">First name</Label><Input id="eb-f" className="mt-2" value={form.first_name} onChange={set("first_name")} required /></div>
            <div><Label htmlFor="eb-l">Last name</Label><Input id="eb-l" className="mt-2" value={form.last_name} onChange={set("last_name")} required /></div>
            <div><Label htmlFor="eb-e">Email (optional)</Label><Input id="eb-e" type="email" className="mt-2" value={form.email} onChange={set("email")} /></div>
            <div><Label htmlFor="eb-p">Phone (optional)</Label><Input id="eb-p" className="mt-2" value={form.phone} onChange={set("phone")} /></div>
            <div><Label htmlFor="eb-id">Bowler ID</Label><Input id="eb-id" className="mt-2 font-mono" value={form.bowler_id} onChange={set("bowler_id")} /></div>
            <div className="sm:col-span-2"><Label htmlFor="eb-n">Notes</Label><Textarea id="eb-n" rows={2} className="mt-2" value={form.notes} onChange={set("notes")} /></div>
            {err && <p role="alert" className="text-sm text-destructive sm:col-span-2">{err}</p>}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
