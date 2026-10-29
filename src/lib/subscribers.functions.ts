import { createServerFn } from '@tanstack/react-start';
import { getRequest, getRequestHeader } from '@tanstack/react-start/server';
import { linkTokenSchema, NEWSLETTER_CONSENT_TEXT, NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED, renderConfirmEmail, renderWelcomeEmail, signupSchema, TEST_EMAIL, TEST_SENDER_NAME } from './newsletter';
import { clientFingerprint, randomToken, sendBrevoEmail, sha256Hex, siteOrigin, unsubscribeToken, verifyUnsubscribeToken } from './newsletter.server';

const SENDER = { email: TEST_EMAIL, name: TEST_SENDER_NAME };
const UNAVAILABLE = 'Newsletter signup is unavailable right now. Please try again later.';
const thanks = () => NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED
  ? 'Thanks! Check your inbox for a link to confirm your subscription.'
  : "Thanks! We've recorded your request. Confirmation emails will start when our newsletter launches.";

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

/** Public signup. Same response whether or not the address already exists, so other people's status is never revealed. */
export const subscribeToNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    // Hidden trap field and too-fast submissions are treated as bots but answered like a normal signup.
    if (data.website || (data.elapsedMs !== undefined && data.elapsedMs < 1500)) return { ok: true, message: thanks() };
    const ip = getRequestHeader('cf-connecting-ip') ?? getRequestHeader('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const token = randomToken();
    const db = await admin();
    const { data: result, error } = await db.rpc('newsletter_signup', {
      p_email: data.email, p_consent_text: NEWSLETTER_CONSENT_TEXT, p_confirm_hash: await sha256Hex(token), p_client_hash: await clientFingerprint(ip),
    });
    if (error) { console.error('Newsletter signup failed'); return { ok: false, message: UNAVAILABLE }; }
    const r = result as { ok: boolean; reason?: string; send?: boolean; email?: string };
    if (!r.ok) return { ok: false, message: r.reason === 'limited' ? 'Too many signup attempts. Please try again later.' : 'Enter a valid email address.' };
    if (r.send && r.email && NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED) {
      const url = `${siteOrigin(getRequest().url)}/newsletter/confirm?token=${encodeURIComponent(token)}`;
      await sendBrevoEmail(r.email, 'Please confirm your subscription', renderConfirmEmail(url), SENDER);
    }
    return { ok: true, message: thanks() };
  });

export const confirmNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => linkTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: result, error } = await db.rpc('newsletter_confirm', { p_confirm_hash: await sha256Hex(data.token) });
    if (error) return { status: 'error' as const };
    const r = result as { status: 'confirmed' | 'expired' | 'invalid'; id?: string; email?: string; welcome?: boolean };
    if (r.status === 'confirmed' && r.welcome && r.id && r.email && NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED) {
      const url = `${siteOrigin(getRequest().url)}/newsletter/unsubscribe?token=${encodeURIComponent(await unsubscribeToken(r.id))}`;
      const sent = await sendBrevoEmail(r.email, 'Welcome to Vegreville Bowling updates', renderWelcomeEmail(url), SENDER);
      if (sent.ok) await db.rpc('newsletter_mark_welcome', { p_id: r.id });
    }
    return { status: r.status };
  });

export const unsubscribeNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => linkTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const id = await verifyUnsubscribeToken(data.token);
    if (!id) return { status: 'invalid' as const };
    const db = await admin();
    const { error } = await db.rpc('newsletter_unsubscribe', { p_id: id, p_source: 'link' });
    return { status: error ? 'error' as const : 'unsubscribed' as const };
  });
