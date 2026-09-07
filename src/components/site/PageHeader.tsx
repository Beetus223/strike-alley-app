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
    <section className="soft-band border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="brand-title mt-3 text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
        {intro ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {intro}
          </p>
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
  tone = "light",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  id?: string;
  tone?: "light" | "neutral" | "dark";
}) {
  const toneClass =
    tone === "neutral"
      ? "bg-surface border-y border-border"
      : tone === "dark"
        ? "ink-section"
        : "bg-background";

  return (
    <section id={id} className={toneClass}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {title ? <h2 className="brand-title text-3xl sm:text-4xl">{title}</h2> : null}
        {description ? (
          <p
            className={`mt-3 max-w-2xl text-base leading-relaxed ${
              tone === "dark" ? "text-ink-muted" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        ) : null}
        <div className={title || description ? "mt-10" : ""}>{children}</div>
      </div>
    </section>
  );
}
