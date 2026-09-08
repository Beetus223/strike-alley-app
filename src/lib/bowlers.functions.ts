import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Staff-only bowler account management.
 *
 * Bowlers never register themselves: staff create the account here, the system
 * mints a unique Bowler ID (VB-#####) and a matching sign-in identity so the
 * bowler can log in with "Bowler ID + password".
 */

export const BOWLER_EMAIL_DOMAIN = "bowlers.vegrevillebowling.ca";

export function bowlerLoginEmail(bowlerId: string) {
  return `${bowlerId.trim().toLowerCase()}@${BOWLER_EMAIL_DOMAIN}`;
}

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

async function admin(): Promise<AdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertStaff(supabase: {
  from: (t: "user_roles") => {
    select: (c: string) => { eq: (c: string, v: string) => Promise<{ data: unknown }> };
  };
}, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = ((data ?? []) as { role: string }[]).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("staff")) {
    throw new Error("Staff access required");
  }
}

function randomBowlerId() {
  return `VB-${Math.floor(10000 + Math.random() * 90000)}`;
}

async function uniqueBowlerId(db: AdminClient) {
  for (let i = 0; i < 25; i += 1) {
    const candidate = randomBowlerId();
    const { data } = await db.from("bowlers").select("id").eq("bowler_id", candidate).maybeSingle();
    if (!data) return candidate;
  }
  throw new Error("Could not generate a unique Bowler ID — please try again");
}

const createSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  password: z.string().min(6),
});

export const createBowlerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const db = await admin();

    const bowlerId = await uniqueBowlerId(db);
    const { data: created, error: authError } = await db.auth.admin.createUser({
      email: bowlerLoginEmail(bowlerId),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: `${data.first_name} ${data.last_name}`, bowler_id: bowlerId },
    });
    if (authError || !created.user) throw new Error(authError?.message ?? "Could not create login");

    const { data: row, error } = await db
      .from("bowlers")
      .insert({
        bowler_id: bowlerId,
        user_id: created.user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
      })
      .select("*")
      .single();
    if (error) {
      await db.auth.admin.deleteUser(created.user.id);
      throw new Error(error.message);
    }
    return row;
  });

export const regenerateBowlerId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const db = await admin();
    const { data: bowler, error: readError } = await db
      .from("bowlers")
      .select("id, user_id")
      .eq("id", data.id)
      .single();
    if (readError || !bowler) throw new Error("Bowler not found");

    const bowlerId = await uniqueBowlerId(db);
    if (bowler.user_id) {
      const { error } = await db.auth.admin.updateUserById(bowler.user_id, {
        email: bowlerLoginEmail(bowlerId),
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
    }
    const { error } = await db.from("bowlers").update({ bowler_id: bowlerId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { bowler_id: bowlerId };
  });

export const resetBowlerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const db = await admin();
    const { data: bowler } = await db.from("bowlers").select("user_id").eq("id", data.id).single();
    if (!bowler?.user_id) throw new Error("This bowler has no sign-in yet");
    const { error } = await db.auth.admin.updateUserById(bowler.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Turning an account off also blocks sign-in. */
export const setBowlerActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase as never, context.userId);
    const db = await admin();
    const { data: bowler } = await db.from("bowlers").select("user_id").eq("id", data.id).single();
    if (bowler?.user_id) {
      await db.auth.admin.updateUserById(bowler.user_id, {
        ban_duration: data.is_active ? "none" : "876000h",
      });
    }
    const { error } = await db
      .from("bowlers")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
