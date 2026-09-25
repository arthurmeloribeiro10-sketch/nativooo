export type WeekDay = {
  day: string;
  label: string;
  num: number;
  isToday: boolean;
  isFuture: boolean;
  hasRecord: boolean;
};

type Props = {
  days: WeekDay[];
  selected: string;
  onSelect: (day: string) => void;
};

/** Semana atual, segunda a domingo. Ponto azul = dia com registro; hoje em destaque. */
export function WeekStrip({ days, selected, onSelect }: Props) {
  return (
    <div className="rise mt-6 grid grid-cols-7 gap-1" role="tablist" aria-label="Dias da semana">
      {days.map((d) => {
        const active = d.day === selected;
        return (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={d.isFuture}
            onClick={() => onSelect(d.day)}
            className={`press flex flex-col items-center gap-1 rounded-2xl py-2 text-[13px] transition-colors disabled:cursor-default ${
              active
                ? "bg-primary text-primary-foreground"
                : d.isFuture
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground"
            }`}
          >
            <span>{d.label}</span>
            <span
              className={`font-display text-lg font-semibold ${active ? "" : d.isFuture ? "" : "text-foreground"}`}
            >
              {d.num}
            </span>
            <span
              className={`size-1.5 rounded-full ${
                d.isToday
                  ? active
                    ? "bg-gold"
                    : "bg-gold"
                  : d.hasRecord
                    ? "bg-primary"
                    : d.isFuture
                      ? "bg-transparent"
                      : "bg-sand-deep"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
