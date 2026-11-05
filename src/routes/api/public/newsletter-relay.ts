import { createFileRoute } from '@tanstack/react-router';

// Signed server-to-server endpoint. Only callers holding NEWSLETTER_RELAY_SECRET (our own
// Cloudflare deployment) are accepted; it returns the same minimal results as the public forms.
export const Route = createFileRoute('/api/public/newsletter-relay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const relay = await import('@/lib/newsletter-relay.server');
        const secret = relay.relaySecret();
        if (!secret || !relay.hasDatabaseMasterKey()) return new Response('Not found', { status: 404 });
        const body = await request.text();
        if (body.length > 4000) return new Response('Too large', { status: 413 });
        const ok = await relay.verifyRelayRequest(secret, body, request.headers.get('x-relay-timestamp'), request.headers.get('x-relay-signature'));
        if (!ok) return new Response('Unauthorized', { status: 401 });
        let payload;
        try { payload = relay.relayPayloadSchema.parse(JSON.parse(body)); } catch { return new Response('Bad request', { status: 400 }); }
        const ops = await import('@/lib/newsletter-subscribers.server');
        if (payload.op === 'signup') return Response.json(await ops.performSignup(payload.email, payload.ip, payload.origin));
        if (payload.op === 'confirm') return Response.json(await ops.performConfirm(payload.token, payload.origin));
        return Response.json(await ops.performUnsubscribe(payload.token));
      },
    },
  },
});
