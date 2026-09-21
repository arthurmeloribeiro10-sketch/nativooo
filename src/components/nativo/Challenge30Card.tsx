import { Link } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";

const MILESTONES = [10, 20, 30];

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
  const nextMilestone = MILESTONES.find((m) => completedDays.length < m);
  const daysToMilestone = nextMilestone ? nextMilestone - completedDays.length : 0;

  return (
    <section className="surface rise mt-5 overflow-hidden p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg">Desafio Apolo</h2>
        <span className="text-xs font-medium text-muted-foreground">
          Dia {Math.min(todayDay, 30)} de 30
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${(completedDays.length / 30) * 100}%`,
            background: "var(--gradient-solar)",
          }}
        />
      </div>

      <div
        className="mt-4 grid grid-cols-10 gap-1.5"
        role="img"
        aria-label={`${completedDays.length} de 30 dias concluídos`}
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
          const done = completedDays.includes(day);
          const isToday = day === todayDay && !done;
          const isMilestone = MILESTONES.includes(day);
          return (
            <span
              key={day}
              className={`relative flex size-3 items-center justify-center rounded-full transition-colors duration-300 ${
                done
                  ? "bg-primary"
                  : isToday
                    ? "bg-primary/40 ring-2 ring-primary/30"
                    : isMilestone
                      ? "bg-gold/30 ring-1 ring-gold/50"
                      : "bg-border"
              }`}
            >
              {isMilestone && !done ? (
                <Star className="absolute size-2 text-gold" fill="currentColor" strokeWidth={0} />
              ) : null}
            </span>
          );
        })}
      </div>

      {!finished && nextMilestone ? (
        <p className="mt-3 font-editorial text-xs italic text-muted-foreground">
          {daysToMilestone === 1
            ? `Falta 1 dia para seu marco do dia ${nextMilestone}.`
            : `Faltam ${daysToMilestone} dias para seu marco do dia ${nextMilestone}.`}
        </p>
      ) : null}

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
            className="lift rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            Concluir hoje
          </button>
        )}
      </div>
    </section>
  );
}
