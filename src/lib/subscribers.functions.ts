import { createServerFn } from '@tanstack/react-start';
import { getRequest, getRequestHeader } from '@tanstack/react-start/server';
import { linkTokenSchema, NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED, signupSchema } from './newsletter';
import type { ConfirmResult, SignupResult, UnsubscribeResult } from './newsletter-subscribers.server';

const UNAVAILABLE = 'Newsletter signup is unavailable right now. Please try again later.';
const thanks = () => NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED
  ? 'Thanks! Check your inbox for a link to confirm your subscription.'
  : "Thanks! We've recorded your request. Confirmation emails will start when our newsletter launches.";

// Copies of the site that hold the database master key (Lovable hosting) run these operations
// directly; copies without it (Cloudflare Workers) forward them over the signed relay.

/** Public signup. Same response whether or not the address already exists, so other people's status is never revealed. */
export const subscribeToNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    // Hidden trap field and too-fast submissions are treated as bots but answered like a normal signup.
    if (data.website || (data.elapsedMs !== undefined && data.elapsedMs < 1500)) return { ok: true, message: thanks() };
    const { siteOrigin } = await import('./newsletter.server');
    const relay = await import('./newsletter-relay.server');
    const origin = siteOrigin(getRequest().url);
    let r: SignupResult | null;
    if (relay.hasDatabaseMasterKey()) {
      const ip = getRequestHeader('cf-connecting-ip') ?? getRequestHeader('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
      const { performSignup } = await import('./newsletter-subscribers.server');
      r = await performSignup(data.email, ip, origin);
    } else {
      // On Cloudflare Workers, cf-connecting-ip is set by Cloudflare's edge and cannot be supplied by the visitor.
      const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown';
      r = await relay.relayNewsletter<SignupResult>({ op: 'signup', email: data.email, ip, origin });
    }
    if (!r || (!r.ok && r.reason === 'unavailable')) return { ok: false, message: UNAVAILABLE };
    if (!r.ok) return { ok: false, message: r.reason === 'limited' ? 'Too many signup attempts. Please try again later.' : 'Enter a valid email address.' };
    return { ok: true, message: thanks() };
  });

export const confirmNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => linkTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { siteOrigin } = await import('./newsletter.server');
    const relay = await import('./newsletter-relay.server');
    const origin = siteOrigin(getRequest().url);
    if (relay.hasDatabaseMasterKey()) {
      const { performConfirm } = await import('./newsletter-subscribers.server');
      return performConfirm(data.token, origin);
    }
    return (await relay.relayNewsletter<ConfirmResult>({ op: 'confirm', token: data.token, origin })) ?? { status: 'error' as const };
  });

export const unsubscribeNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => linkTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const relay = await import('./newsletter-relay.server');
    if (relay.hasDatabaseMasterKey()) {
      const { performUnsubscribe } = await import('./newsletter-subscribers.server');
      return performUnsubscribe(data.token);
    }
    return (await relay.relayNewsletter<UnsubscribeResult>({ op: 'unsubscribe', token: data.token })) ?? { status: 'error' as const };
  });
