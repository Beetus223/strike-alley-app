import { describe, expect, it, vi } from 'vitest';
// Vitest stubs CSS imports by default; read the real template tokens instead.
vi.mock('./newsletter-email.css?raw', async () => {
  const { readFileSync } = await import('node:fs');
  return { default: readFileSync(new URL('./newsletter-email.css', import.meta.url), 'utf8') };
});
import { draftSchema, recipientSchema, renderNewsletter, safeNewsletterUrl, NEWSLETTER_TEST_SEND_APPROVED, TEST_EMAIL, TEST_SENDER_NAME } from './newsletter';

describe('newsletter test safeguards', () => {
  it('rejects every non-allowlisted recipient', () => {
    expect(recipientSchema.safeParse('customer@example.com').success).toBe(false);
    expect(recipientSchema.safeParse('jonah.beattie78@gmail.com,customer@example.com').success).toBe(false);
  });
  it('accepts only the specified test address', () => {
    expect(recipientSchema.parse('jonah.beattie78@gmail.com')).toBe('jonah.beattie78@gmail.com');
  });
  it('rejects an empty subject', () => {
    expect(draftSchema.safeParse({ subject: '   ', body: 'A newsletter' }).success).toBe(false);
  });
  it('escapes script tags in subject and content', () => {
    const html = renderNewsletter('<script>alert(1)</script>', '<script>alert(2)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
  });
  it('rejects executable and temporary image URLs', () => {
    expect(safeNewsletterUrl('javascript:alert(1)')).toBeNull();
    expect(safeNewsletterUrl('blob:https://example.com/test', true)).toBeNull();
    expect(safeNewsletterUrl('https://example.com/photo.jpg', true)).toBe('https://example.com/photo.jpg');
  });
  it('test sending is approved only for the fixed test address', () => {
    expect(NEWSLETTER_TEST_SEND_APPROVED).toBe(true);
    expect(recipientSchema.safeParse('someone@example.com').success).toBe(false);
    expect(recipientSchema.safeParse('JONAH.BEATTIE78@gmail.com').success).toBe(true);
  });
  it('uses the specified sender', () => {
    expect(TEST_EMAIL).toBe('jonah.beattie78@gmail.com');
    expect(TEST_SENDER_NAME).toBe('Vegreville Bowling Lanes');
  });
});
import { signupSchema, renderConfirmEmail, renderWelcomeEmail, imageMarkup, NEWSLETTER_IMAGE_PREFIX, NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED } from './newsletter';
describe('newsletter signup rules', () => {
  it('rejects an invalid email', () => expect(signupSchema.safeParse({ email: 'not-an-email', consent: true }).success).toBe(false));
  it('rejects a signup without consent', () => expect(signupSchema.safeParse({ email: 'a@example.com', consent: false }).success).toBe(false));
  it('accepts a valid signup and lowercases the email', () => {
    const r = signupSchema.safeParse({ email: ' A@Example.com ', consent: true });
    expect(r.success && r.data.email).toBe('a@example.com');
  });
  it('keeps subscriber confirmation and welcome emails switched off until launch', () => expect(NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED).toBe(false));
});
describe('newsletter email templates', () => {
  it('confirmation email carries the confirm link and 48-hour notice', () => {
    const html = renderConfirmEmail('https://example.com/newsletter/confirm?token=abc');
    expect(html).toContain('https://example.com/newsletter/confirm?token=abc');
    expect(html).toContain('48 hours');
  });
  it('welcome email carries an unsubscribe link', () => expect(renderWelcomeEmail('https://example.com/u?token=x')).toContain('https://example.com/u?token=x'));
  it('subscriber newsletters include the unsubscribe link', () => {
    expect(renderNewsletter('S', 'Hi', { footer: 'subscriber', unsubscribeUrl: 'https://example.com/u?t=1' })).toContain('https://example.com/u?t=1');
  });
});
describe('newsletter images', () => {
  const path = '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg';
  const body = imageMarkup('Lanes', NEWSLETTER_IMAGE_PREFIX + path, 'medium', 'left');
  it('uses a permanent site link in sent emails, never a temporary one', () => {
    const html = renderNewsletter('S', body, { baseUrl: 'https://bowl.example' });
    expect(html).toContain(`src="https://bowl.example/api/public/newsletter-image?path=${path}"`);
    expect(html).toContain('max-width:360px');
    expect(html).toContain('text-align:left');
  });
  it('preview can swap in a temporary staff link', () => {
    expect(renderNewsletter('S', body, { resolveImage: () => 'https://signed.example/x' })).toContain('https://signed.example/x');
  });
  it('rejects local device paths and temporary browser links', () => {
    expect(renderNewsletter('S', '![x](blob:https://a.example/1)')).not.toContain('<img');
    expect(renderNewsletter('S', '![x](file:///C:/photo.jpg)')).not.toContain('<img');
  });
});
