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