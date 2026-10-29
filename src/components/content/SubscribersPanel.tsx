import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renderConfirmEmail, renderWelcomeEmail, NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED } from '@/lib/newsletter';

const fmt = (value: string | null) => value ? new Date(value).toLocaleString() : '—';
const STATUS: Record<string, string> = { pending: 'Waiting for confirmation', active: 'Active', unsubscribed: 'Unsubscribed' };

export function SubscribersPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const list = useQuery({
    queryKey: ['admin', 'newsletter-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('newsletter_subscribers')
        .select('id,email,status,consent_text,consent_at,consent_source,confirmed_at,unsubscribed_at,unsubscribe_source,created_at')
        .order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });
  const unsubscribe = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.rpc('newsletter_admin_unsubscribe', { p_id: id }); if (error) throw new Error('Could not unsubscribe this person.'); },
    onSuccess: () => { toast.success('Unsubscribed'); void queryClient.invalidateQueries({ queryKey: ['admin', 'newsletter-subscribers'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rows = useMemo(() => (list.data ?? []).filter(r => (status === 'all' || r.status === status) && r.email.includes(search.trim().toLowerCase())), [list.data, search, status]);
  const counts = useMemo(() => (list.data ?? []).reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {}), [list.data]);
  return <div className="space-y-6">
    <div><h2 className="font-display text-2xl">Subscribers</h2>
      <p className="text-sm text-muted-foreground">Administrators only. Only Active (confirmed) subscribers can ever receive newsletters. {NEWSLETTER_SUBSCRIBER_EMAILS_ENABLED ? '' : 'Confirmation and welcome emails are switched off until launch.'}</p></div>
    <div className="flex flex-wrap gap-3 text-sm">{['active', 'pending', 'unsubscribed'].map(key => <span key={key} className="rounded-full border border-border px-3 py-1">{STATUS[key]}: {counts[key] ?? 0}</span>)}</div>
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <div className="space-y-1"><Label htmlFor="subscriber-search">Search by email</Label><Input id="subscriber-search" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor="subscriber-status">Status</Label>
        <select id="subscriber-status" value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">All</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></div>
    </div>
    {list.isPending ? <p className="text-sm text-muted-foreground">Loading…</p>
      : list.isError ? <p role="alert" className="text-sm text-destructive">Subscribers could not be loaded.</p>
      : rows.length === 0 ? <p className="text-sm text-muted-foreground">No subscribers{list.data?.length ? ' match your search' : ' yet'}.</p>
      : <ul className="space-y-3">{rows.map(r => <li key={r.id} className="rounded-xl border border-border p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-all font-semibold">{r.email}</p><p className="text-muted-foreground">{STATUS[r.status] ?? r.status}</p></div>
            {r.status !== 'unsubscribed' && <Button size="sm" variant="outline" disabled={unsubscribe.isPending} onClick={() => { if (window.confirm(`Unsubscribe ${r.email}?`)) unsubscribe.mutate(r.id); }}>Unsubscribe</Button>}</div>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-2">
            <div><dt className="inline">Consent given: </dt><dd className="inline">{fmt(r.consent_at)}</dd></div>
            <div><dt className="inline">Confirmed: </dt><dd className="inline">{fmt(r.confirmed_at)}</dd></div>
            <div><dt className="inline">Unsubscribed: </dt><dd className="inline">{fmt(r.unsubscribed_at)}{r.unsubscribe_source ? ` (${r.unsubscribe_source === 'admin' ? 'by staff' : 'by link'})` : ''}</dd></div>
            <div><dt className="inline">Signed up via: </dt><dd className="inline">{r.consent_source === 'announcements_page' ? 'Announcements page' : r.consent_source}</dd></div>
            <div className="sm:col-span-2"><dt className="inline">Consent wording: </dt><dd className="inline">“{r.consent_text}”</dd></div>
          </dl>
        </li>)}</ul>}
    <section className="space-y-3 border-t border-border pt-5" aria-label="Subscriber email previews">
      <h3 className="font-display text-xl">Subscriber email previews</h3>
      <p className="text-sm text-muted-foreground">Previews only, with sample links. Nothing is sent from here.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <iframe title="Confirmation email preview" sandbox="" srcDoc={renderConfirmEmail('https://example.com/newsletter/confirm?token=sample')} className="h-[480px] w-full rounded-lg border border-border" />
        <iframe title="Welcome email preview" sandbox="" srcDoc={renderWelcomeEmail('https://example.com/newsletter/unsubscribe?token=sample')} className="h-[480px] w-full rounded-lg border border-border" />
      </div>
    </section>
  </div>;
}
