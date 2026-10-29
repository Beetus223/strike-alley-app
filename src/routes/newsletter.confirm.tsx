import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { NewsletterLinkAction } from '@/components/site/NewsletterLinkAction';
import { confirmNewsletter } from '@/lib/subscribers.functions';

export const Route = createFileRoute('/newsletter/confirm')({
  validateSearch: z.object({ token: z.string().max(200).catch('') }),
  head: () => ({ meta: [
    { title: 'Confirm your subscription | Vegreville Bowling Lanes' },
    { name: 'description', content: 'Confirm your email updates from Vegreville Bowling Lanes.' },
    { property: 'og:title', content: 'Confirm your subscription | Vegreville Bowling Lanes' },
    { property: 'og:description', content: 'Confirm your email updates from Vegreville Bowling Lanes.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const { token } = Route.useSearch();
  const confirm = useServerFn(confirmNewsletter);
  return <NewsletterLinkAction token={token} title="Confirm your subscription" action="Confirm subscription"
    intro="Press the button to start receiving email updates from Vegreville Bowling Lanes."
    run={value => confirm({ data: { token: value } })}
    messages={{
      confirmed: "You're subscribed. Thanks for joining Vegreville Bowling updates!",
      expired: 'This confirmation link has expired. Please sign up again on our Announcements page.',
      invalid: 'This confirmation link isn’t valid or has already been used.',
      error: 'Something went wrong. Please try the link again later.',
    }} />;
}
