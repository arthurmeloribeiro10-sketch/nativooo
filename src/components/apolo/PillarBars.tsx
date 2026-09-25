import type { WeeklyPillar } from "@/lib/nativo-queries";

export function PillarBars({ pillars }: { pillars: WeeklyPillar[] }) {
  const best = pillars
    .filter((p): p is WeeklyPillar & { score: number } => p.score !== null)
    .sort((a, b) => b.score - a.score)[0];

  return (
    <section
      className="surface rise mt-5 p-6"
      style={{ "--stagger": "210ms" } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.5rem]">Seus pilares</h2>
        <span className="text-[15px] text-muted-foreground">Esta semana</span>
      </div>
      <ul className="mt-2">
        {pillars.map((p) => {
          const strongest = best && p.key === best.key && p.score !== null;
          return (
            <li key={p.key} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[16px] text-foreground">{p.label}</span>
                <span className="text-[15px] text-muted-foreground">
                  {p.score === null ? "—" : `${p.score}%`}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                    strongest ? "bg-gold" : "bg-primary"
                  }`}
                  style={{ width: `${p.score ?? 0}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {pillars.every((p) => p.score === null) ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Registre refeições, passos e sono para ver seus pilares aqui.
        </p>
      ) : null}
    </section>
  );
}
