import { useHours, useSeasonalHours } from "@/lib/content";
import { HOURS_NOTE } from "@/lib/site-data";

/** Detailed hours: open, public bowling, food service and glow per day. */
export function HoursTable({ className = "" }: { className?: string }) {
  const { data: hours } = useHours();
  const { data: seasonalSchedules } = useSeasonalHours();

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
      {(seasonalSchedules ?? []).map((schedule) => (
        <section key={schedule.id} className="mt-8" aria-labelledby={`seasonal-hours-${schedule.id}`}>
          <div className="mb-4 border-l-4 border-primary pl-4">
            <h3 id={`seasonal-hours-${schedule.id}`} className="text-2xl">
              {schedule.title}
            </h3>
            <p className="mt-1 font-semibold">{schedule.date_label}</p>
            <p className="mt-2 inline-flex bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
              {schedule.reservation_notice}
            </p>
          </div>
          <h4 className="mb-3 text-sm font-bold uppercase text-muted-foreground">Food Service Hours</h4>
          <dl className="card-soft divide-y divide-border rounded-xl">
            {schedule.seasonal_hours.map((day) => {
              const closed = day.food_service?.trim().toUpperCase() === "CLOSED";
              return (
                <div key={day.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <dt className="font-semibold">{day.day_label}</dt>
                    <dd className={closed ? "font-bold text-primary" : "font-medium"}>
                      {closed ? "CLOSED" : day.food_service}
                    </dd>
                  </div>
                  {!closed && (day.note || day.bowler_hours) ? (
                    <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
                      {day.note ? <li>{day.note}</li> : null}
                      {day.bowler_hours ? <li><span className="font-semibold text-foreground">Bowlers:</span> {day.bowler_hours}</li> : null}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </dl>
        </section>
      ))}
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
