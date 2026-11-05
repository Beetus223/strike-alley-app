// Server-only newsletter subscriber operations that need the database master key.
// Run directly on a key-holding server, or via the authenticated relay route. Never import from browser code.
import { NEWSLETTER_CONSENT_TEXT, subscriberEmailAllowed, renderConfirmEmail, renderWelcomeEmail, TEST_EMAIL, TEST_SENDER_NAME } from './newsletter';
import { clientFingerprint, randomToken, sendBrevoEmail, sha256Hex, unsubscribeToken, verifyUnsubscribeToken } from './newsletter.server';

const SENDER = { email: TEST_EMAIL, name: TEST_SENDER_NAME };

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

export type SignupResult = { ok: true } | { ok: false; reason: 'limited' | 'invalid' | 'unavailable' };
export type ConfirmResult = { status: 'confirmed' | 'expired' | 'invalid' | 'error' };
export type UnsubscribeResult = { status: 'unsubscribed' | 'invalid' | 'error' };

export async function performSignup(email: string, ip: string, origin: string): Promise<SignupResult> {
  const token = randomToken();
  const db = await admin();
  const { data: result, error } = await db.rpc('newsletter_signup', {
    p_email: email, p_consent_text: NEWSLETTER_CONSENT_TEXT, p_confirm_hash: await sha256Hex(token), p_client_hash: await clientFingerprint(ip),
  });
  if (error) { console.error('Newsletter signup failed'); return { ok: false, reason: 'unavailable' }; }
  const r = result as { ok: boolean; reason?: string; send?: boolean; email?: string };
  if (!r.ok) return { ok: false, reason: r.reason === 'limited' ? 'limited' : 'invalid' };
  if (r.send && r.email && subscriberEmailAllowed(r.email)) {
    await sendBrevoEmail(r.email, 'Please confirm your subscription', renderConfirmEmail(`${origin}/newsletter/confirm?token=${encodeURIComponent(token)}`), SENDER);
  }
  return { ok: true };
}

export async function performConfirm(token: string, origin: string): Promise<ConfirmResult> {
  const db = await admin();
  const { data: result, error } = await db.rpc('newsletter_confirm', { p_confirm_hash: await sha256Hex(token) });
  if (error) return { status: 'error' };
  const r = result as { status: 'confirmed' | 'expired' | 'invalid'; id?: string; email?: string; welcome?: boolean };
  if (r.status === 'confirmed' && r.welcome && r.id && r.email && subscriberEmailAllowed(r.email)) {
    const url = `${origin}/newsletter/unsubscribe?token=${encodeURIComponent(await unsubscribeToken(r.id))}`;
    const sent = await sendBrevoEmail(r.email, 'Welcome to Vegreville Bowling updates', renderWelcomeEmail(url), SENDER);
    if (sent.ok) await db.rpc('newsletter_mark_welcome', { p_id: r.id });
  }
  return { status: r.status };
}

export async function performUnsubscribe(token: string): Promise<UnsubscribeResult> {
  const id = await verifyUnsubscribeToken(token);
  if (!id) return { status: 'invalid' };
  const db = await admin();
  const { error } = await db.rpc('newsletter_unsubscribe', { p_id: id, p_source: 'link' });
  return { status: error ? 'error' : 'unsubscribed' };
}
