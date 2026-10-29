import { z } from 'zod';
import emailCss from './newsletter-email.css?raw';

export const TEST_EMAIL = 'jonah.beattie78@gmail.com';
export const TEST_SENDER_NAME = 'Vegreville Bowling Lanes';
// Change only after explicit chat approval; no settings or UI can bypass this gate.
export const NEWSLETTER_TEST_SEND_APPROVED = false;
export const recipientSchema = z.string().trim().email().transform(value => value.toLowerCase())
  .refine(value => value === TEST_EMAIL, `Tests may only be sent to ${TEST_EMAIL}.`);
export const draftSchema = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().trim().min(1, 'Enter a subject.').max(200, 'Subject must be 200 characters or fewer.'),
  body: z.string().trim().min(1, 'Enter newsletter content.').max(20000, 'Content is too long.'),
});
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
export function renderNewsletter(subject: string, body: string): string {
  const content = body.split(/\n\s*\n/).map(block => {
    const image = /^!\[([^\]\n]*)\]\(([^\s)]+)\)$/.exec(block.trim());
    if (image?.[1] !== undefined && image[2]) {
      const url = safeNewsletterUrl(image[2], true);
      return url ? `<p><img src="${escapeHtml(url)}" alt="${escapeHtml(image[1])}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0" /></p>` : `<p>${escapeHtml(block)}</p>`;
    }
    const heading = /^(#{1,3})\s+([\s\S]*)$/.exec(block);
    if (heading?.[2]) return `<h2 style="color:${emailToken('primary')};font-size:22px;line-height:1.4;margin:24px 0 12px">${inlineText(heading[2]).replace(/\n/g, '<br />')}</h2>`;
    return `<p style="margin:0 0 18px;line-height:1.7">${inlineText(block).replace(/\n/g, '<br />')}</p>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:${emailToken('background')};color:${emailToken('text')};font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${emailToken('surface')}"><tr><td style="padding:24px;border-top:4px solid ${emailToken('primary')}"><p style="color:${emailToken('accent')};font-size:14px;margin:0 0 18px">Vegreville Bowling Lanes</p><h1 style="font-size:28px;line-height:1.3;margin:0 0 24px;overflow-wrap:anywhere">${escapeHtml(subject)}</h1><div style="overflow-wrap:anywhere">${content}</div><p style="font-size:12px;color:${emailToken('muted')};margin-top:32px">Test newsletter · Not a customer campaign</p></td></tr></table></td></tr></table></body></html>`;
}