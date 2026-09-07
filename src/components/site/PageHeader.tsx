import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="grid-glow border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 text-4xl neon-text sm:text-6xl">{title}</h1>
        {intro ? (
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{intro}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

export function Section({
  title,
  description,
  children,
  id,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {title ? <h2 className="text-3xl sm:text-4xl">{title}</h2> : null}
      {description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      ) : null}
      <div className={title || description ? "mt-8" : ""}>{children}</div>
    </section>
  );
}
