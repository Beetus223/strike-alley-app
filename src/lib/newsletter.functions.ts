import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import { draftSchema, sendSchema, renderNewsletter, NEWSLETTER_TEST_SEND_APPROVED, TEST_EMAIL, TEST_SENDER_NAME, type NewsletterDraft } from './newsletter';

// Local additive typing until generated types include the accepted migration.
type NewsletterDatabase = Database & { public: {
  Tables: { newsletter_drafts: {
    Row: NewsletterDraft;
    Insert: { subject: string; body: string; created_by?: string };
    Update: Partial<Omit<NewsletterDraft, 'id' | 'created_by' | 'created_at'>>;
    Relationships: [];
  } };
  Functions: { newsletter_staff_access: { Args: Record<string, never>; Returns: boolean } };
} };
const staffClient = createServerOnlyFn(async (client: SupabaseClient<Database>) => {
  const db = client as unknown as SupabaseClient<NewsletterDatabase>;
  const { data, error } = await db.rpc('newsletter_staff_access');
  if (error) throw new Error('Newsletter access could not be checked. Please try again.');
  if (data !== true) throw new Error('Staff access is required.');
  return db;
});
export const listNewsletterDrafts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    const db = await staffClient(context.supabase);
    const { data, error } = await db.from('newsletter_drafts').select('*').order('updated_at', { ascending: false });
    if (error) throw new Error('Newsletter drafts could not be loaded.');
    return data ?? [];
  });
export const saveNewsletterDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => draftSchema.parse(input))
  .handler(async ({ data, context }) => {
    const db = await staffClient(context.supabase);
    const values = { subject: data.subject, body: data.body };
    const query = data.id ? db.from('newsletter_drafts').update(values).eq('id', data.id)
      : db.from('newsletter_drafts').insert({ ...values, created_by: context.userId });
    const result = await query.select('*').single();
    if (result.error || !result.data) throw new Error('Draft could not be saved. Your entries are still here.');
    return result.data;
  });
export const deleteNewsletterDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const db = await staffClient(context.supabase);
    const result = await db.from('newsletter_drafts').delete().eq('id', data.id).select('id').single();
    if (result.error) throw new Error('Draft could not be deleted.');
    return { deleted: true };
  });
export const sendNewsletterTest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const db = await staffClient(context.supabase);
    // This gate remains closed until the user explicitly approves a real email in chat.
    if (!NEWSLETTER_TEST_SEND_APPROVED) return { ok: false, message: 'Email sending awaits approval in chat.' };
    const key = process.env['BREVO_API_KEY'];
    if (!key) return { ok: false, message: 'The email service is not configured.' };
    const result = await db.from('newsletter_drafts').select('*').eq('id', data.id).single();
    if (result.error || !result.data) return { ok: false, message: 'Save and reopen the draft before testing.' };
    const draft = draftSchema.parse(result.data);
    const pending = await db.from('newsletter_drafts').update({ last_test_status: 'sending', last_test_at: new Date().toISOString(), last_test_recipient: data.recipient }).eq('id', data.id);
    if (pending.error) return { ok: false, message: 'Test status could not be saved. No email was sent.' };
    let ok = false;
    let status = 'failed';
    let message = 'The email service could not be reached. Check the last result before retrying.';
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': key },
        body: JSON.stringify({ sender: { email: TEST_EMAIL, name: TEST_SENDER_NAME }, to: [{ email: data.recipient }], subject: draft.subject, htmlContent: renderNewsletter(draft.subject, draft.body), textContent: draft.body }),
        signal: AbortSignal.timeout(20000),
      });
      // Do not parse, log or expose the provider response body.
      await response.body?.cancel();
      ok = response.ok;
      status = ok ? 'accepted' : `failed_http_${response.status}`;
      message = ok ? 'Brevo accepted the test email. Delivery is not yet confirmed.'
        : response.status === 401 || response.status === 403 ? `Brevo rejected the test (HTTP ${response.status}). Check credentials, sender verification and IP authorization.`
        : response.status === 429 ? 'Brevo limited this test (HTTP 429). Check your daily allowance before retrying.'
        : `Brevo did not accept the test (HTTP ${response.status}). Check sender verification and account settings.`;
    } catch { status = 'delivery_unknown'; }
    const recorded = await db.from('newsletter_drafts').update({ last_test_status: status, last_test_at: new Date().toISOString(), last_test_recipient: data.recipient }).eq('id', data.id);
    return { ok, message: recorded.error ? `${message} The result could not be recorded; do not resend automatically.` : message };
  });