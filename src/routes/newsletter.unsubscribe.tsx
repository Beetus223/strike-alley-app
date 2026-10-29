import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { NewsletterLinkAction } from '@/components/site/NewsletterLinkAction';
import { unsubscribeNewsletter } from '@/lib/subscribers.functions';

export const Route = createFileRoute('/newsletter/unsubscribe')({
  validateSearch: z.object({ token: z.string().max(200).catch('') }),
  head: () => ({ meta: [
    { title: 'Unsubscribe | Vegreville Bowling Lanes' },
    { name: 'description', content: 'Stop email updates from Vegreville Bowling Lanes.' },
    { property: 'og:title', content: 'Unsubscribe | Vegreville Bowling Lanes' },
    { property: 'og:description', content: 'Stop email updates from Vegreville Bowling Lanes.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const unsubscribe = useServerFn(unsubscribeNewsletter);
  return <NewsletterLinkAction token={token} title="Unsubscribe" action="Unsubscribe"
    intro="Press the button to stop receiving email updates from Vegreville Bowling Lanes. No sign-in needed."
    run={value => unsubscribe({ data: { token: value } })}
    messages={{
      unsubscribed: "You've been unsubscribed and won’t receive further newsletter emails.",
      invalid: 'This unsubscribe link isn’t valid. Please call us at 780-632-2695 and we’ll remove you.',
      error: 'Something went wrong. Please try again later or call 780-632-2695.',
    }} />;
}
