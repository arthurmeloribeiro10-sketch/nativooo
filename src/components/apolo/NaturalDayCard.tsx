import type { NaturalDaySummary } from "@/lib/meals";

export function NaturalDayCard({ summary }: { summary: NaturalDaySummary }) {
  return (
    <section
      className="surface-sand rise mt-5 flex items-center gap-5 p-5"
      style={{ "--stagger": "140ms" } as React.CSSProperties}
    >
      <span className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-full bg-card font-display text-2xl font-bold text-gold-deep">
        {summary.total > 0 ? `${summary.real}/${summary.total}` : "—"}
      </span>
      <div className="min-w-0">
        <h2 className="text-[1.3rem] leading-tight">{summary.headline}</h2>
        <p className="mt-1 text-[15px] leading-snug text-foreground/80">{summary.detail}</p>
      </div>
    </section>
  );
}
