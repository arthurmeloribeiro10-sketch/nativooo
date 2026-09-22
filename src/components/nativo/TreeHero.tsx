import { ArrowRight, Moon, Sparkles, Sunrise } from "lucide-react";

import { LivingTree, type LeafDatum } from "@/components/nativo/LivingTree";
import { ScoreRing } from "@/components/nativo/ScoreRing";
import { plural } from "@/lib/format";
import type { DailyRitual } from "@/lib/rituals";
import { stageFor } from "@/lib/tree";

type Props = {
  seed: string;
  leaves: LeafDatum[];
  leavesToday: number;
  completed: number;
  total: number;
  pending: number;
  allDone: boolean;
  hasRecordToday: boolean;
  nextTitle: string | null;
  hour: number;
  minute: number;
  uv: number | null;
  score: number | null;
  ritual: DailyRitual;
  ritualReady: boolean;
  onOpenDay: () => void;
  onCloseDay: () => void;
  onGoToMissions: () => void;
};

/**
 * Herói da Home: a árvore viva à esquerda (ou em cima, no celular) e, ao
 * lado, o estado do dia com uma única próxima ação. O texto nunca julga —
 * descreve onde o dia está e o que falta.
 */
export function TreeHero({
  seed,
  leaves,
  leavesToday,
  completed,
  total,
  pending,
  allDone,
  hasRecordToday,
  nextTitle,
  hour,
  minute,
  uv,
  score,
  ritual,
  ritualReady,
  onOpenDay,
  onCloseDay,
  onGoToMissions,
}: Props) {
  const { stage, next, progress, remaining } = stageFor(leaves.length);
  const closed = Boolean(ritual.closedAt);
  const opened = Boolean(ritual.intention && ritual.cardAccepted);
  const waiting = !closed && hour >= 13 && hour < 19 && !hasRecordToday;
  const goldenDay =
    ritual.cardKey === "golden" && ritual.cardAccepted && leavesToday > 0
      ? (leaves[leaves.length - 1]?.day ?? null)
      : null;
  const eveningClose = !closed && !allDone && (hour >= 18 || hour < 4);

  let title: string;
  let subtitle: string;
  if (!ritualReady) {
    title = "Preparando o seu dia…";
    subtitle = "";
  } else if (closed) {
    title = "Dia fechado. Até amanhã.";
    subtitle =
      leavesToday > 0
        ? `Sua árvore ganhou ${plural(leavesToday, "folha")} hoje. A carta de amanhã já te espera.`
        : "Amanhã tem carta nova e uma folha esperando por você.";
  } else if (!opened) {
    title = ritual.intention ? "Sua carta está virada para baixo." : "Abra o seu dia";
    subtitle = ritual.intention
      ? `Intenção de hoje: ${ritual.intention}. Falta só virar a carta.`
      : "Escolha uma intenção e vire a carta de hoje.";
  } else if (allDone) {
    title = "Dia completo ☀️";
    subtitle = "Todas as ações de hoje, concluídas. Feche o dia e colha o que plantou.";
  } else if (pending > 0) {
    title =
      pending === 1
        ? "Falta 1 ação para fechar o dia."
        : `Faltam ${pending} ações para fechar o dia.`;
    subtitle = nextTitle ? `Próxima: ${nextTitle}` : "Uma de cada vez.";
  } else {
    title = "Seu dia está aberto.";
    subtitle = "Registre uma ação para plantar a primeira folha de hoje.";
  }

  return (
    <section className="surface rise overflow-hidden">
      <div className="grid sm:grid-cols-[1.15fr_1fr]">
        <div className="relative">
          <LivingTree
            className="block h-auto w-full"
            seed={seed}
            leaves={leaves}
            popCounter={leavesToday}
            pendingSlots={pending}
            hour={hour}
            minute={minute}
            closed={closed}
            waiting={waiting}
            goldenDay={goldenDay}
            uv={uv}
          />
          <span className="glass absolute left-3 top-3 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-foreground">
            Nível {stage.level} · {stage.name}
          </span>
          {ritual.intention ? (
            <span className="glass absolute right-3 top-3 flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-foreground">
              <Sparkles className="size-3 text-gold" strokeWidth={2} />
              Hoje: {ritual.intention}
            </span>
          ) : null}
          {waiting ? (
            <span className="glass absolute bottom-3 left-3 whitespace-nowrap rounded-full px-3 py-1 font-editorial text-[11px] italic text-foreground">
              Esperando o primeiro registro de hoje.
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} size={72} onLight />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Seu progresso hoje
              </p>
              <p className="mt-0.5 font-editorial text-base italic text-foreground">
                {plural(leavesToday, "folha")} hoje
              </p>
              <p className="text-xs text-muted-foreground">
                {completed} de {total || "—"} ações concluídas
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-editorial text-xl leading-snug text-foreground">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>

          {ritualReady ? (
            <div className="flex flex-wrap items-center gap-2">
              {closed ? null : !opened ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenDay}
                    className="lift inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Sunrise className="size-4" strokeWidth={2} />
                    {ritual.intention ? "Virar a carta" : "Abrir o dia"}
                  </button>
                  {eveningClose ? (
                    <button
                      type="button"
                      onClick={onCloseDay}
                      className="lift inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground"
                    >
                      <Moon className="size-4" strokeWidth={1.8} />
                      Fechar o dia
                    </button>
                  ) : null}
                </>
              ) : allDone ? (
                <button
                  type="button"
                  onClick={onCloseDay}
                  className="lift inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-foreground"
                  style={{ background: "var(--gradient-solar)" }}
                >
                  <Moon className="size-4" strokeWidth={2} />
                  Fechar o dia
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onGoToMissions}
                    className="lift inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    Continuar <ArrowRight className="size-4" />
                  </button>
                  {eveningClose ? (
                    <button
                      type="button"
                      onClick={onCloseDay}
                      className="lift inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground"
                    >
                      <Moon className="size-4" strokeWidth={1.8} />
                      Fechar o dia
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div className="mt-auto">
            <div className="flex items-baseline justify-between gap-3 whitespace-nowrap text-[11px] text-muted-foreground">
              <span>{plural(leaves.length, "folha")} no total</span>
              <span>
                {next
                  ? remaining === 1
                    ? `Falta 1 folha para ${next.name}`
                    : `Faltam ${remaining} folhas para ${next.name}`
                  : "Sua árvore está completa"}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: "var(--gradient-solar)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
