import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/site/PageHeader';

/** Requires a button press so email link scanners can't confirm or unsubscribe on someone's behalf. */
export function NewsletterLinkAction({ token, title, intro, action, run, messages }: {
  token: string; title: string; intro: string; action: string;
  run: (token: string) => Promise<{ status: string }>;
  messages: Record<string, string>;
}) {
  const [state, setState] = useState<'idle' | 'busy' | string>('idle');
  const valid = /^[A-Za-z0-9._-]{20,200}$/.test(token);
  async function go() {
    setState('busy');
    try { setState((await run(token)).status); } catch { setState('error'); }
  }
  const done = state !== 'idle' && state !== 'busy';
  return <Section>
    <div className="card-soft mx-auto max-w-lg rounded-2xl p-8 text-center">
      <h1 className="text-3xl">{title}</h1>
      {!valid ? <p role="alert" className="mt-3 text-muted-foreground">{messages['invalid']}</p>
        : done ? <p role="status" className="mt-3">{messages[state] ?? messages['error']}</p>
        : <><p className="mt-3 text-muted-foreground">{intro}</p><Button className="mt-5" onClick={() => void go()} disabled={state === 'busy'}>{state === 'busy' ? 'Please wait…' : action}</Button></>}
      <p className="mt-6 text-sm"><Link to="/" className="text-primary hover:underline">Back to the website</Link></p>
    </div>
  </Section>;
}
