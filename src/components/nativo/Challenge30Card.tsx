import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export function Challenge30Card({
  completedDays,
  todayDay,
  pending,
  onCompleteToday,
}: {
  completedDays: number[];
  todayDay: number;
  pending: boolean;
  onCompleteToday: () => void;
}) {
  const todayDone = completedDays.includes(todayDay);
  const finished = completedDays.length >= 30;

  return (
    <section className="surface rise mt-5 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg">Desafio APOLO</h2>
        <span className="text-xs font-medium text-muted-foreground">
          Dia {Math.min(todayDay, 30)} de 30
        </span>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-1.5"
        role="img"
        aria-label={`${completedDays.length} de 30 dias concluídos`}
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
          const done = completedDays.includes(day);
          const isToday = day === todayDay && !done;
          return (
            <span
              key={day}
              className={`size-2.5 rounded-full transition-colors ${
                done ? "bg-primary" : isToday ? "bg-primary/40 ring-2 ring-primary/30" : "bg-border"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          to="/protocolo"
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          Ver jornada completa
        </Link>
        {finished ? (
          <span className="rounded-full bg-success/15 px-4 py-2 text-xs font-semibold text-foreground">
            Protocolo concluído
          </span>
        ) : todayDone ? (
          <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-4 py-2 text-xs font-semibold text-foreground">
            <Check className="size-3.5" /> Dia concluído
          </span>
        ) : (
          <button
            type="button"
            onClick={onCompleteToday}
            disabled={pending}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            Concluir hoje
          </button>
        )}
      </div>
    </section>
  );
}
