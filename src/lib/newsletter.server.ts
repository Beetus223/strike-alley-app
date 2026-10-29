// Server-only helpers for newsletter links and Brevo delivery. Never import from browser code.
const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function randomToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function linkSecret(): string {
  const secret = process.env['NEWSLETTER_LINK_SECRET'];
  if (!secret || secret.length < 32) throw new Error('Newsletter links are not configured.');
  return secret;
}
async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(linkSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
/** Signed, non-expiring unsubscribe token so every marketing email can carry a working link. */
export async function unsubscribeToken(subscriberId: string): Promise<string> {
  return `${subscriberId}.${await hmac(`unsubscribe:${subscriberId}`)}`;
}
export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  const [id, signature] = token.split('.');
  if (!id || !signature || !/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeEqual(signature, await hmac(`unsubscribe:${id}`)) ? id : null;
}
export async function clientFingerprint(ip: string): Promise<string> {
  return sha256Hex(`${linkSecret()}:${ip}`);
}
export function siteOrigin(requestUrl: string): string {
  const configured = process.env['PUBLIC_SITE_URL'];
  if (configured && /^https:\/\/[^/\s]+$/.test(configured)) return configured;
  return new URL(requestUrl).origin;
}
/** Sends one transactional email. The provider response body is never parsed, logged or returned. */
export async function sendBrevoEmail(to: string, subject: string, html: string, sender: { email: string; name: string }): Promise<{ ok: boolean; status: number }> {
  const key = process.env['BREVO_API_KEY'];
  if (!key) return { ok: false, status: 0 };
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': key },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
      signal: AbortSignal.timeout(20000),
    });
    await response.body?.cancel();
    return { ok: response.ok, status: response.status };
  } catch { return { ok: false, status: 0 }; }
}
