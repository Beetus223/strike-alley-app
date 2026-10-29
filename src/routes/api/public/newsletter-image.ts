import { createFileRoute } from '@tanstack/react-router';
import { newsletterImagePathPattern } from '@/lib/newsletter';

export const Route = createFileRoute('/api/public/newsletter-image')({
  server: { handlers: { GET: async ({ request }) => {
    const path = new URL(request.url).searchParams.get('path') ?? '';
    if (!newsletterImagePathPattern.test(path)) return new Response('Not found', { status: 404 });
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) return new Response('Unavailable', { status: 503 });
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } } });
    // Anonymous Storage access admits only photos placed in a saved newsletter draft.
    const { data, error } = await client.storage.from('newsletter-images').download(path);
    if (error || !data) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=3600' } });
  } } },
});
