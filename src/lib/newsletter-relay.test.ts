import { describe, expect, it } from 'vitest';
import { relayPayloadSchema, signRelayRequest, verifyRelayRequest, RELAY_MAX_AGE_SECONDS } from './newsletter-relay.server';

const secret = 'a'.repeat(48);
const body = JSON.stringify({ op: 'unsubscribe', token: 'x'.repeat(40) });
const now = 1_800_000_000;

describe('newsletter relay authentication', () => {
  it('accepts a fresh request signed with the shared secret', async () => {
    const { timestamp, signature } = await signRelayRequest(secret, body, now);
    expect(await verifyRelayRequest(secret, body, timestamp, signature, now)).toBe(true);
  });
  it('rejects a request signed with a different secret', async () => {
    const { timestamp, signature } = await signRelayRequest('b'.repeat(48), body, now);
    expect(await verifyRelayRequest(secret, body, timestamp, signature, now)).toBe(false);
  });
  it('rejects a tampered body (e.g. a swapped visitor address)', async () => {
    const { timestamp, signature } = await signRelayRequest(secret, body, now);
    expect(await verifyRelayRequest(secret, body.replace('x', 'y'), timestamp, signature, now)).toBe(false);
  });
  it('rejects requests older than five minutes', async () => {
    const { timestamp, signature } = await signRelayRequest(secret, body, now);
    expect(await verifyRelayRequest(secret, body, timestamp, signature, now + RELAY_MAX_AGE_SECONDS + 1)).toBe(false);
  });
  it('rejects unsigned requests', async () => {
    expect(await verifyRelayRequest(secret, body, null, null, now)).toBe(false);
  });
  it('only accepts https site addresses for email links', () => {
    expect(relayPayloadSchema.safeParse({ op: 'confirm', token: 'x'.repeat(40), origin: 'http://evil.test' }).success).toBe(false);
    expect(relayPayloadSchema.safeParse({ op: 'confirm', token: 'x'.repeat(40), origin: 'https://site.workers.dev' }).success).toBe(true);
  });
});
