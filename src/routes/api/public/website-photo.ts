import { createFileRoute } from '@tanstack/react-router';
import { photoPathPattern, PHOTO_BUCKET } from '@/lib/website-photos';

export const Route = createFileRoute('/api/public/website-photo')({
  server: { handlers: { GET: async ({ request }) => {
    const path = new URL(request.url).searchParams.get('path') ?? '';
    if (!photoPathPattern.test(path)) return new Response('Not found', { status: 404 });
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
    // Anonymous Storage RLS admits only photos currently referenced by public content.
    const { data, error } = await client.storage.from(PHOTO_BUCKET).download(path);
    if (error || !data) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
  } } },
});