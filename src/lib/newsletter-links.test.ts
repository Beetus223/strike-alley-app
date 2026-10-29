import { beforeAll, describe, expect, it } from 'vitest';
import { unsubscribeToken, verifyUnsubscribeToken, sha256Hex, randomToken } from './newsletter.server';

beforeAll(() => { process.env['NEWSLETTER_LINK_SECRET'] = 'x'.repeat(64); });
const id = '33333333-3333-4333-8333-333333333333';
describe('newsletter links', () => {
  it('a genuine unsubscribe link verifies', async () => expect(await verifyUnsubscribeToken(await unsubscribeToken(id))).toBe(id));
  it('a tampered unsubscribe link is rejected', async () => {
    const token = await unsubscribeToken(id);
    expect(await verifyUnsubscribeToken(token.replace(id, '44444444-4444-4444-8444-444444444444'))).toBeNull();
    expect(await verifyUnsubscribeToken(`${id}.forged`)).toBeNull();
  });
  it('confirmation tokens are random and stored only as hashes', async () => {
    const a = randomToken(); const b = randomToken();
    expect(a).not.toBe(b);
    expect(await sha256Hex(a)).toMatch(/^[0-9a-f]{64}$/);
  });
});
