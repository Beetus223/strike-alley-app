import { useHours } from "@/lib/content";
import { HOURS_NOTE } from "@/lib/site-data";

/** Detailed hours: open, public bowling, food service and glow per day. */
export function HoursTable({ className = "" }: { className?: string }) {
  const { data: hours } = useHours();

  return (
    <div className={className}>
      <dl className="card-soft divide-y divide-border rounded-xl">
        {(hours ?? []).map((h) => (
          <div key={h.id} className="px-5 py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <dt className="font-semibold">{h.day_label}</dt>
              <dd className="font-medium">{h.open_hours}</dd>
            </div>
            <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
              {h.public_bowling ? <li>Public bowling · {h.public_bowling}</li> : null}
              {h.food_service ? <li>Food service · {h.food_service}</li> : null}
              {h.glow_bowling ? (
                <li className="text-primary">Glow neon bowling · {h.glow_bowling}</li>
              ) : null}
              {h.note ? <li className="italic">{h.note}</li> : null}
            </ul>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">{HOURS_NOTE}</p>
    </div>
  );
}

/** Compact day + open hours list, for the footer. */
export function HoursCompact() {
  const { data: hours } = useHours();
  return (
    <dl className="mt-4 space-y-2 text-sm">
      {(hours ?? []).map((h) => (
        <div key={h.id} className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-ink-muted">{h.day_label}</dt>
          <dd className="text-ink-foreground">{h.open_hours}</dd>
        </div>
      ))}
    </dl>
  );
}
