import { Check } from "lucide-react";

import type { MissionRow } from "@/lib/nativo-queries";

type Props = {
  missions: MissionRow[];
  loading: boolean;
  busy: boolean;
  onToggle: (mission: MissionRow) => void;
};

export function MissionList({ missions, loading, busy, onToggle }: Props) {
  return (
    <section className="rise mt-7" style={{ "--stagger": "210ms" } as React.CSSProperties}>
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[1.5rem]">Missões de hoje</h2>
        <span className="text-[13px] text-muted-foreground">Toque para marcar</span>
      </div>
      <div className="surface mt-3 px-5">
        {loading ? (
          <p className="py-5 text-sm text-muted-foreground">Carregando…</p>
        ) : missions.length === 0 ? (
          <p className="py-5 text-sm text-muted-foreground">Nenhuma missão para hoje ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {missions.map((m) => {
              const done = m.status === "done";
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggle(m)}
                    aria-pressed={done}
                    className="press flex min-h-[4.25rem] w-full items-center gap-4 py-3 text-left disabled:opacity-70"
                  >
                    <span
                      key={done ? "on" : "off"}
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        done
                          ? "pop-in bg-primary text-primary-foreground"
                          : "border-2 border-sand-deep bg-card"
                      }`}
                    >
                      {done ? <Check className="size-4" strokeWidth={3} /> : null}
                    </span>
                    <span
                      className={`text-[16px] leading-snug transition-colors ${
                        done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {m.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
