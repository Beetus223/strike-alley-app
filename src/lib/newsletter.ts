import { z } from 'zod';
import emailCss from './newsletter-email.css?raw';

export const TEST_EMAIL = 'jonah.beattie78@gmail.com';
export const TEST_SENDER_NAME = 'Vegreville Bowling Lanes';
// Change only after explicit chat approval; no settings or UI can bypass this gate.
export const NEWSLETTER_TEST_SEND_APPROVED = true; // Approved in chat 2026-10-29 for single test sends to TEST_EMAIL only.
export const recipientSchema = z.string().trim().email().transform(value => value.toLowerCase())
  .refine(value => value === TEST_EMAIL, `Tests may only be sent to ${TEST_EMAIL}.`);
export const draftSchema = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().trim().min(1, 'Enter a subject.').max(200, 'Subject must be 200 characters or fewer.'),
  body: z.string().trim().min(1, 'Enter newsletter content.').max(20000, 'Content is too long.'),
});
// Subscriber confirmation/welcome emails stay off until the owner approves public launch and sender authentication.
export const NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED = false;
export const NEWSLETTER_CONSENT_TEXT = 'I agree to receive email updates from Vegreville Bowling Lanes. I understand I can unsubscribe at any time.';
export const NEWSLETTER_IMAGE_PREFIX = '/api/public/newsletter-image?path=';
export const newsletterImagePathPattern = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254, 'Enter a valid email address.'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please tick the consent box to subscribe.' }) }),
  website: z.string().max(200).optional(),
  elapsedMs: z.number().int().nonnegative().max(86_400_000).optional(),
});
export const linkTokenSchema = z.object({ token: z.string().trim().min(20).max(200).regex(/^[A-Za-z0-9._-]+$/) });
export const IMAGE_SIZES = { small: 200, medium: 360, full: 552 } as const;
export type ImageSize = keyof typeof IMAGE_SIZES;
export type ImageAlign = 'left' | 'center' | 'right';
export function imageMarkup(alt: string, src: string, size: ImageSize = 'full', align: ImageAlign = 'center') {
  return `![${alt.replace(/[\]\n]/g, ' ').trim() || 'Newsletter photo'}](${src} "${size} ${align}")`;
}
export const sendSchema = z.object({ id: z.string().uuid(), recipient: recipientSchema });
export type NewsletterDraft = {
  id: string; subject: string; body: string; created_by: string; created_at: string; updated_at: string;
  last_test_status: string | null; last_test_at: string | null; last_test_recipient: string | null;
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
export function safeNewsletterUrl(value: string, image = false): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:' || (!image && url.protocol === 'mailto:')) return url.href;
  } catch { /* Invalid URLs remain inert text. */ }
  return null;
}
function emailToken(name: string): string {
  const value = emailCss.match(new RegExp(`--newsletter-email-${name}:\\s*([^;]+);`))?.[1];
  if (!value) throw new Error('Email theme is unavailable.');
  return value.trim();
}
function inlineText(value: string): string {
  // Escape before formatting. Only our fixed tags can become markup.
  const escaped = escapeHtml(value);
  return escaped.split(/(\[[^\]\n]+\]\([^\s)]+\))/g).map(part => {
    const link = /^\[([^\]\n]+)\]\(([^\s)]+)\)$/.exec(part);
    if (link?.[1] && link[2]) {
      const url = safeNewsletterUrl(link[2].replace(/&amp;/g, '&'));
      return url ? `<a href="${escapeHtml(url)}" style="color:${emailToken('accent')};text-decoration:underline">${link[1]}</a>` : link[1];
    }
    return part.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  }).join('');
}
export type RenderOptions = {
  /** Absolute site origin used for uploaded newsletter photos in sent emails. */
  baseUrl?: string;
  /** Preview-only override (e.g. temporary signed links); never used for sending. */
  resolveImage?: (path: string) => string | null;
  footer?: 'test' | 'subscriber';
  unsubscribeUrl?: string;
};
function imageSource(src: string, options: RenderOptions): string | null {
  if (src.startsWith(NEWSLETTER_IMAGE_PREFIX)) {
    const path = src.slice(NEWSLETTER_IMAGE_PREFIX.length);
    if (!newsletterImagePathPattern.test(path)) return null;
    const resolved = options.resolveImage?.(path);
    if (resolved) return resolved;
    return options.baseUrl ? safeNewsletterUrl(options.baseUrl.replace(/\/$/, '') + src, true) : null;
  }
  return safeNewsletterUrl(src, true);
}
function emailShell(subject: string, content: string, footer: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:${emailToken('background')};color:${emailToken('text')};font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${emailToken('surface')}"><tr><td style="padding:24px;border-top:4px solid ${emailToken('primary')}"><p style="color:${emailToken('accent')};font-size:14px;margin:0 0 18px">Vegreville Bowling Lanes</p><h1 style="font-size:28px;line-height:1.3;margin:0 0 24px;overflow-wrap:anywhere">${escapeHtml(subject)}</h1><div style="overflow-wrap:anywhere">${content}</div><p style="font-size:12px;line-height:1.6;color:${emailToken('muted')};margin-top:32px">${footer}</p></td></tr></table></td></tr></table></body></html>`;
}
const CENTRE_FOOTER = 'Vegreville Bowling Lanes · 5026 50 Street, Vegreville, AB · 780-632-2695';
function button(url: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:${emailToken('primary')};color:${emailToken('surface')};padding:12px 20px;border-radius:6px;font-weight:bold;text-decoration:none">${escapeHtml(label)}</a></p><p style="font-size:13px;line-height:1.6;color:${emailToken('muted')};overflow-wrap:anywhere">If the button doesn't work, copy this link into your browser:<br />${escapeHtml(url)}</p>`;
}
export function renderConfirmEmail(confirmUrl: string): string {
  return emailShell('Please confirm your subscription',
    `<p style="margin:0 0 18px;line-height:1.7">Thanks for signing up for email updates from Vegreville Bowling Lanes. Please confirm that you want to receive them.</p>${button(confirmUrl, 'Confirm subscription')}<p style="margin:0 0 18px;line-height:1.7">This link expires in 48 hours and can be used once. If you didn't sign up, you can ignore this email and you won't be subscribed.</p>`,
    CENTRE_FOOTER);
}
export function renderWelcomeEmail(unsubscribeUrl: string): string {
  return emailShell('Welcome to Vegreville Bowling updates',
    `<p style="margin:0 0 18px;line-height:1.7">You're subscribed! We'll email you about bowling, upcoming events, league announcements, special occasions and news from the centre.</p>`,
    `${CENTRE_FOOTER}<br /><a href="${escapeHtml(unsubscribeUrl)}" style="color:${emailToken('muted')}">Unsubscribe</a>`);
}
export function renderNewsletter(subject: string, body: string, options: RenderOptions = {}): string {
  const content = body.split(/\n\s*\n/).map(block => {
    const image = /^!\[([^\]\n]*)\]\(([^\s)]+)(?:\s+"([a-z ]{0,30})")?\)$/.exec(block.trim());
    if (image?.[1] !== undefined && image[2]) {
      const url = imageSource(image[2], options);
      const opts = (image[3] ?? '').split(' ');
      const size = (Object.keys(IMAGE_SIZES) as ImageSize[]).find(key => opts.includes(key)) ?? 'full';
      const align: ImageAlign = opts.includes('left') ? 'left' : opts.includes('right') ? 'right' : 'center';
      const width = IMAGE_SIZES[size];
      return url ? `<p style="margin:0 0 18px;text-align:${align}"><img src="${escapeHtml(url)}" alt="${escapeHtml(image[1])}" width="${width}" style="display:inline-block;width:100%;max-width:${width}px;height:auto;border:0" /></p>` : `<p style="margin:0 0 18px;color:${emailToken('muted')}">[Photo: ${escapeHtml(image[1])}]</p>`;
    }
    const heading = /^(#{1,3})\s+([\s\S]*)$/.exec(block);
    if (heading?.[2]) return `<h2 style="color:${emailToken('primary')};font-size:22px;line-height:1.4;margin:24px 0 12px">${inlineText(heading[2]).replace(/\n/g, '<br />')}</h2>`;
    return `<p style="margin:0 0 18px;line-height:1.7">${inlineText(block).replace(/\n/g, '<br />')}</p>`;
  }).join('');
  const footer = options.footer === 'subscriber'
    ? `${CENTRE_FOOTER}<br />You're receiving this because you subscribed to Vegreville Bowling updates.${options.unsubscribeUrl ? ` <a href="${escapeHtml(options.unsubscribeUrl)}" style="color:${emailToken('muted')}">Unsubscribe</a>` : ''}`
    : 'Test newsletter · Not a customer campaign';
  return emailShell(subject, content, footer);
}