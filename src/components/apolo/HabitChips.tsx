export type HabitChip = { label: string; pillar: string; active: boolean };

type Props = {
  habits: HabitChip[];
  busy: boolean;
  onToggle: (habit: HabitChip) => void;
};

export function HabitChips({ habits, busy, onToggle }: Props) {
  return (
    <section className="rise mt-7" style={{ "--stagger": "280ms" } as React.CSSProperties}>
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[1.5rem]">Hábitos</h2>
        <span className="text-[13px] text-muted-foreground">Toque no que já rolou</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {habits.map((h) => (
          <button
            key={h.label}
            type="button"
            disabled={busy}
            onClick={() => onToggle(h)}
            aria-pressed={h.active}
            className={`press min-h-12 rounded-full px-6 text-[16px] font-medium transition-colors disabled:opacity-70 ${
              h.active
                ? "bg-chip-gold text-foreground"
                : "border border-sand-deep bg-card text-foreground"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>
    </section>
  );
}
