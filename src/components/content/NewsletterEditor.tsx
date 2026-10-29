import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsletterImagePicker, NEWSLETTER_BUCKET } from './NewsletterImagePicker';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bold, Italic, Heading2, Link, Image, Monitor, Smartphone, Plus, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { draftSchema, recipientSchema, renderNewsletter, safeNewsletterUrl, imageMarkup, NEWSLETTER_IMAGE_PREFIX, newsletterImagePathPattern, TEST_EMAIL, NEWSLETTER_TEST_SEND_APPROVED, type NewsletterDraft } from '@/lib/newsletter';
import { listNewsletterDrafts, saveNewsletterDraft, deleteNewsletterDraft, sendNewsletterTest } from '@/lib/newsletter.functions';

const formatDate = (date: string | null) => date ? new Date(date).toLocaleString() : '—';
function statusLabel(value: string | null) {
  if (!value) return 'Not tested';
  if (value === 'accepted') return 'Accepted by Brevo · Delivery unconfirmed';
  if (value === 'sending') return 'Sending · Check before retrying';
  if (value === 'delivery_unknown') return 'Delivery unknown · Check before retrying';
  return value.startsWith('failed_http_') ? `Rejected · HTTP ${value.replace('failed_http_', '')}` : 'Test failed';
}
export function NewsletterEditor() {
  const queryClient = useQueryClient();
  const list = useServerFn(listNewsletterDrafts);
  const save = useServerFn(saveNewsletterDraft);
  const remove = useServerFn(deleteNewsletterDraft);
  const send = useServerFn(sendNewsletterTest);
  const drafts = useQuery({ queryKey: ['staff', 'newsletter-drafts'], queryFn: () => list(), retry: false });
  const [selected, setSelected] = useState<NewsletterDraft | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState(TEST_EMAIL);
  const [mobile, setMobile] = useState(false);
  const [urlMode, setUrlMode] = useState<'link' | 'image' | null>(null);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});
  // Preview uploaded photos through temporary staff-only links; sent emails use permanent site links.
  useEffect(() => {
    const paths = [...body.matchAll(/\/api\/public\/newsletter-image\?path=([0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg)/g)].map(m => m[1]!).filter(p => newsletterImagePathPattern.test(p) && !signed[p]);
    if (!paths.length) return;
    void supabase.storage.from(NEWSLETTER_BUCKET).createSignedUrls(paths, 3600).then(({ data }) => {
      const next: Record<string, string> = {};
      data?.forEach((item, index) => { if (item.signedUrl) next[paths[index]!] = item.signedUrl; });
      if (Object.keys(next).length) setSigned(current => ({ ...current, ...next }));
    });
  }, [body, signed]);
  function insertImage(path: string, alt: string, size: Parameters<typeof imageMarkup>[2], align: Parameters<typeof imageMarkup>[3]) {
    const start = textRef.current?.selectionStart ?? body.length;
    const end = textRef.current?.selectionEnd ?? start;
    const before = body.slice(0, start).replace(/\s*$/, '');
    const after = body.slice(end).replace(/^\s*/, '');
    setBody(`${before}${before ? '\n\n' : ''}${imageMarkup(alt, NEWSLETTER_IMAGE_PREFIX + path, size, align)}\n\n${after}`);
  }
  const dirty = subject !== (selected?.subject ?? '') || body !== (selected?.body ?? '');
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['staff', 'newsletter-drafts'] });
  const saving = useMutation({
    mutationFn: async () => {
      const parsed = draftSchema.safeParse({ id: selected?.id, subject, body });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check your draft.');
      return save({ data: parsed.data });
    },
    onSuccess: draft => { setSelected(draft); setSubject(draft.subject); setBody(draft.body); refresh(); toast.success('Newsletter draft saved'); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleting = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { setSelected(null); setSubject(''); setBody(''); refresh(); toast.success('Newsletter draft deleted'); },
    onError: (error: Error) => toast.error(error.message),
  });
  const sending = useMutation({
    mutationFn: async () => {
      const parsed = recipientSchema.safeParse(recipient);
      if (!parsed.success) throw new Error(`Tests may only be sent to ${TEST_EMAIL}.`);
      if (!selected || dirty) throw new Error('Save the draft before sending a test.');
      return send({ data: { id: selected.id, recipient: parsed.data } });
    },
    onSuccess: result => { result.ok ? toast.success(result.message) : toast.error(result.message); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const busy = saving.isPending || deleting.isPending || sending.isPending;
  function open(draft: NewsletterDraft | null) {
    if (dirty && !window.confirm('Discard unsaved newsletter changes?')) return;
    setSelected(draft); setSubject(draft?.subject ?? ''); setBody(draft?.body ?? '');
  }
  function format(before: string, after = '', fallback = 'Text') {
    const input = textRef.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? start;
    const chosen = body.slice(start, end) || fallback;
    setBody(body.slice(0, start) + before + chosen + after + body.slice(end));
    input?.focus();
  }
  function insertUrl() {
    const parsed = safeNewsletterUrl(url, true) && !/[\s)"<>]/.test(url);
    if (!parsed || !caption.trim() || /[\]\n]/.test(caption)) { toast.error('Enter an HTTPS address and a short label.'); return; }
    if (urlMode === 'image') setBody(value => `${value}${value ? '\n\n' : ''}![${caption}](${url})\n\n`);
    else {
      const start = textRef.current?.selectionStart ?? body.length;
      const end = textRef.current?.selectionEnd ?? start;
      setBody(body.slice(0, start) + `[${caption}](${url})` + body.slice(end));
    }
    setUrlMode(null); setUrl(''); setCaption('');
  }
  const current = drafts.data?.find(draft => draft.id === selected?.id) ?? selected;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-display text-2xl">Newsletter</h2><p className="text-sm text-muted-foreground">Test version · No customer campaigns</p></div>
      <Button variant="outline" onClick={() => open(null)} disabled={busy}><Plus />New draft</Button>
    </div>
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3" aria-label="Newsletter drafts">
        <h3 className="font-display text-lg">Saved drafts</h3>
        {drafts.isPending && <p className="text-sm text-muted-foreground">Loading drafts…</p>}
        {drafts.isError && <div role="alert" className="space-y-2 text-sm"><p>Newsletter drafts could not be loaded.</p><Button variant="outline" onClick={() => void drafts.refetch()}>Try again</Button></div>}
        {drafts.data?.length === 0 && <p className="text-sm text-muted-foreground">No drafts yet</p>}
        {drafts.data?.map(draft => <Button key={draft.id} variant={selected?.id === draft.id ? 'secondary' : 'outline'} disabled={busy} onClick={() => open(draft)} className="h-auto w-full min-w-0 justify-start whitespace-normal p-3 text-left">
          <span className="min-w-0"><span className="block break-words font-semibold">{draft.subject}</span><span className="block text-xs text-muted-foreground">{statusLabel(draft.last_test_status)}</span><span className="block text-xs text-muted-foreground">{formatDate(draft.updated_at)}</span></span>
        </Button>)}
      </aside>
      <div className="min-w-0 space-y-6">
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); saving.mutate(); }}>
          <div className="space-y-2"><Label htmlFor="newsletter-subject">Subject</Label><Input id="newsletter-subject" value={subject} onChange={event => setSubject(event.target.value)} maxLength={200} required disabled={busy} /></div>
          <div className="space-y-2"><Label htmlFor="newsletter-body">Content</Label>
            <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Newsletter formatting">
              <Button type="button" variant="outline" size="icon" aria-label="Heading" title="Heading" disabled={busy} onClick={() => format('\n\n## ', '\n\n', 'Heading')}><Heading2 /></Button>
              <Button type="button" variant="outline" size="icon" aria-label="Bold" title="Bold" disabled={busy} onClick={() => format('**', '**')}><Bold /></Button>
              <Button type="button" variant="outline" size="icon" aria-label="Italic" title="Italic" disabled={busy} onClick={() => format('*', '*')}><Italic /></Button>
              <Button type="button" variant="outline" size="icon" aria-label="Insert link" title="Insert link" disabled={busy} onClick={() => setUrlMode('link')}><Link /></Button>
              <Button type="button" variant="outline" size="icon" aria-label="Insert image from link" title="Insert image from link" disabled={busy} onClick={() => setUrlMode('image')}><Image /></Button>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setImageOpen(true)}><Image />Add image</Button>
            </div>
            {urlMode && <div className="grid gap-2 sm:grid-cols-2"><Input aria-label={urlMode === 'image' ? 'Image description' : 'Link label'} placeholder={urlMode === 'image' ? 'Image description' : 'Link label'} value={caption} onChange={event => setCaption(event.target.value)} /><Input type="url" aria-label="HTTPS address" placeholder="https://" value={url} onChange={event => setUrl(event.target.value)} /><div className="flex gap-2"><Button type="button" variant="outline" onClick={insertUrl}>Insert</Button><Button type="button" variant="ghost" onClick={() => setUrlMode(null)}>Cancel</Button></div></div>}
            <Textarea ref={textRef} id="newsletter-body" value={body} onChange={event => setBody(event.target.value)} rows={10} maxLength={20000} required disabled={busy} />
          </div>
          <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy}><Save />{saving.isPending ? 'Saving…' : 'Save draft'}</Button>{selected && <Button type="button" variant="outline" disabled={busy} onClick={() => { if (window.confirm('Delete this newsletter draft?')) deleting.mutate(selected.id); }}><Trash2 />Delete draft</Button>}<span className="text-sm text-muted-foreground" aria-live="polite">{dirty ? 'Unsaved changes' : selected ? 'Saved' : ''}</span></div>
        </form>
        <section aria-label="Email preview" className="space-y-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-xl">Email preview</h3><div className="flex gap-1" role="group" aria-label="Preview width"><Button variant={mobile ? 'outline' : 'secondary'} size="icon" aria-label="Desktop preview" title="Desktop preview" aria-pressed={!mobile} onClick={() => setMobile(false)}><Monitor /></Button><Button variant={mobile ? 'secondary' : 'outline'} size="icon" aria-label="Mobile preview" title="Mobile preview" aria-pressed={mobile} onClick={() => setMobile(true)}><Smartphone /></Button></div></div>
          <iframe title="Newsletter email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={renderNewsletter(subject, body, { resolveImage: path => signed[path] ?? null })} className={`mx-auto h-[540px] w-full rounded-lg border border-border ${mobile ? 'max-w-[375px]' : 'max-w-[640px]'}`} />
        </section>
        <section className="space-y-3 border-t border-border pt-5" aria-label="Newsletter test send">
          <h3 className="font-display text-xl">Send a test</h3>
          <p className="break-words text-sm text-muted-foreground">From Vegreville Bowling Lanes · {TEST_EMAIL}</p>
          <Label htmlFor="newsletter-recipient">Test recipient</Label><Input id="newsletter-recipient" type="email" value={recipient} onChange={event => setRecipient(event.target.value)} aria-invalid={!recipientSchema.safeParse(recipient).success} />
          {!recipientSchema.safeParse(recipient).success && <p role="alert" className="break-words text-sm text-destructive">Tests may only be sent to {TEST_EMAIL}.</p>}
          {!NEWSLETTER_TEST_SEND_APPROVED && <p role="status" className="text-sm text-muted-foreground">Email sending awaits approval in chat. No email has been sent.</p>}
          <Button disabled={!NEWSLETTER_TEST_SEND_APPROVED || !selected || dirty || busy || !recipientSchema.safeParse(recipient).success} onClick={() => { if (window.confirm(`Send one test to ${TEST_EMAIL}?`)) sending.mutate(); }}><Send />{sending.isPending ? 'Sending…' : 'Send test email'}</Button>
          <p className="text-sm text-muted-foreground">{statusLabel(current?.last_test_status ?? null)}{current?.last_test_at ? ` · ${formatDate(current.last_test_at)}` : ''}</p>
          {current?.last_test_recipient && <p className="break-words text-sm text-muted-foreground">{current.last_test_recipient}</p>}
        </section>
      </div>
    </div>
    <NewsletterImagePicker open={imageOpen} onOpenChange={setImageOpen} onInsert={insertImage} />
  </div>;
}