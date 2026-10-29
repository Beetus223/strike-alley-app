import { useId, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NEWSLETTER_CONSENT_TEXT, signupSchema } from '@/lib/newsletter';
import { subscribeToNewsletter } from '@/lib/subscribers.functions';

export function NewsletterSignup() {
  const subscribe = useServerFn(subscribeToNewsletter);
  const id = useId();
  const started = useRef(Date.now());
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signupSchema.safeParse({ email, consent, website: trap, elapsedMs: Date.now() - started.current });
    if (!parsed.success) { setResult({ ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' }); return; }
    setBusy(true); setResult(null);
    try {
      const response = await subscribe({ data: parsed.data });
      setResult(response);
      if (response.ok) { setEmail(''); setConsent(false); }
    } catch { setResult({ ok: false, message: 'Signup is unavailable right now. Please try again later.' }); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby={`${id}-title`} className="card-soft mt-10 max-w-3xl rounded-2xl border-t-4 border-t-accent p-6 sm:p-8">
    <div className="flex items-start gap-3">
      <Mail className="mt-1 h-6 w-6 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0">
        <h2 id={`${id}-title`} className="text-2xl sm:text-3xl">Stay in the Loop!</h2>
        <p className="mt-1 text-muted-foreground">Get updates about bowling, upcoming events, league announcements, special occasions and news from Vegreville Bowling Lanes.</p>
      </div>
    </div>
    <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>Email address</Label>
        <Input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" value={email} maxLength={254} onChange={e => setEmail(e.target.value)} disabled={busy} required />
      </div>
      {/* Hidden from people; automated form fillers tend to complete it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={trap} onChange={e => setTrap(e.target.value)} />
      </div>
      <div className="flex items-start gap-3">
        <Checkbox id={`${id}-consent`} checked={consent} onCheckedChange={value => setConsent(value === true)} disabled={busy} className="mt-0.5" />
        <Label htmlFor={`${id}-consent`} className="font-normal leading-relaxed">{NEWSLETTER_CONSENT_TEXT}</Label>
      </div>
      <Button type="submit" disabled={busy}>{busy ? 'Subscribing…' : 'Subscribe'}</Button>
      {result && <p role={result.ok ? 'status' : 'alert'} className={result.ok ? 'text-sm text-foreground' : 'text-sm text-destructive'}>{result.message}</p>}
      <p className="text-xs text-muted-foreground">We’ll only use your email for Vegreville Bowling Lanes updates. Every email includes an unsubscribe link.</p>
    </form>
  </section>;
}
