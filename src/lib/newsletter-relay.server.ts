// Server-only: authenticated server-to-server relay for newsletter signup/confirm/unsubscribe.
// A copy of the site without the database master key (e.g. Cloudflare Workers) forwards these
// three operations to the Lovable-hosted copy, which holds the key. Never import from browser code.
import { z } from 'zod';

const encoder = new TextEncoder();
export const RELAY_PATH = '/api/public/newsletter-relay';
export const RELAY_MAX_AGE_SECONDS = 300;

export const relayPayloadSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('signup'), email: z.string().trim().email().max(254), ip: z.string().min(1).max(64), origin: z.string().regex(/^https:\/\/[^/\s]+$/) }),
  z.object({ op: z.literal('confirm'), token: z.string().min(16).max(200), origin: z.string().regex(/^https:\/\/[^/\s]+$/) }),
  z.object({ op: z.literal('unsubscribe'), token: z.string().min(16).max(200) }),
]);
export type RelayPayload = z.infer<typeof relayPayloadSchema>;

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function sign(secret: string, timestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`)));
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function relaySecret(): string | null {
  const s = process.env['NEWSLETTER_RELAY_SECRET'];
  return s && s.length >= 32 ? s : null;
}

export async function signRelayRequest(secret: string, body: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const timestamp = String(nowSeconds);
  return { timestamp, signature: await sign(secret, timestamp, body) };
}

/** True only for a fresh, untampered request signed with the shared secret. */
export async function verifyRelayRequest(secret: string, body: string, timestamp: string | null, signature: string | null, nowSeconds = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!timestamp || !signature || !/^\d{1,12}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > RELAY_MAX_AGE_SECONDS) return false;
  return safeEqual(signature, await sign(secret, timestamp, body));
}

/** Whether this server holds the database master key and should run newsletter operations itself. */
export function hasDatabaseMasterKey(): boolean {
  return !!process.env['SUPABASE_SERVICE_ROLE_KEY'];
}

/** Forwards one operation to the key-holding server. Returns the parsed result or null on any failure. */
export async function relayNewsletter<T>(payload: RelayPayload): Promise<T | null> {
  const secret = relaySecret();
  const target = process.env['NEWSLETTER_RELAY_URL'];
  if (!secret || !target || !/^https:\/\/[^/\s]+$/.test(target)) { console.error('Newsletter relay is not configured'); return null; }
  const body = JSON.stringify(payload);
  const { timestamp, signature } = await signRelayRequest(secret, body);
  try {
    const res = await fetch(`${target}${RELAY_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Relay-Timestamp': timestamp, 'X-Relay-Signature': signature },
      body, signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.error(`Newsletter relay failed [${res.status}]`); await res.body?.cancel(); return null; }
    return (await res.json()) as T;
  } catch { console.error('Newsletter relay unreachable'); return null; }
}
