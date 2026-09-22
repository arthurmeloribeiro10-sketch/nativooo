import { CloudRain, CloudSun, Flame, Leaf, Moon, Sun, type LucideIcon } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { plural } from "@/lib/format";
import { MOODS, type Mood } from "@/lib/rituals";
import { PILLAR_LEAF_COLOR, PILLAR_SHORT_LABEL } from "@/lib/tree";

const MOOD_ICON: Record<Mood, LucideIcon> = { leve: Sun, ok: CloudSun, pesado: CloudRain };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  leavesToday: number;
  pillarsTouched: string[];
  allDone: boolean;
  pending: number;
  streak: number;
  challengeDay: number;
  challengeDone: boolean;
  mood: Mood | undefined;
  closing: boolean;
  onChooseMood: (mood: Mood) => void;
  onCloseDay: () => void;
};

/** Ritual da noite: como foi o dia, o que a árvore ganhou e a prévia de amanhã. */
export function DayCloseRitual({
  open,
  onOpenChange,
  name,
  leavesToday,
  pillarsTouched,
  allDone,
  pending,
  streak,
  challengeDay,
  challengeDone,
  mood,
  closing,
  onChooseMood,
  onCloseDay,
}: Props) {
  const reply = MOODS.find((m) => m.key === mood)?.reply;
  const streakAfter = leavesToday > 0 ? Math.max(streak, 1) : streak;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg rounded-t-3xl border-border/70 bg-background">
        <div className="max-h-[82dvh] overflow-y-auto pb-8">
          <DrawerHeader className="text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Fechar o dia
            </p>
            <DrawerTitle className="font-display text-2xl font-semibold text-foreground">
              {mood ? "Colheita de hoje" : `Como foi o seu dia, ${name}?`}
            </DrawerTitle>
            <DrawerDescription>
              {mood ? reply : "Sem nota, sem julgamento. Só um registro honesto."}
            </DrawerDescription>
          </DrawerHeader>

          {!mood ? (
            <div className="grid grid-cols-3 gap-2.5 px-4">
              {MOODS.map((item, i) => {
                const Icon = MOOD_ICON[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onChooseMood(item.key)}
                    className="lift rise flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium text-foreground hover:border-primary/50"
                    style={{ "--stagger": `${i * 60}ms` } as React.CSSProperties}
                  >
                    <Icon className="size-6 text-primary" strokeWidth={1.6} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div
                  className="rise rounded-2xl border border-border bg-card p-3 text-center"
                  style={{ "--stagger": "0ms" } as React.CSSProperties}
                >
                  <Leaf className="mx-auto size-5 text-success" strokeWidth={1.6} />
                  <p className="mt-2 font-display text-xl font-semibold text-foreground">
                    +{leavesToday}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {leavesToday === 1 ? "folha" : "folhas"}
                  </p>
                </div>
                <div
                  className="rise rounded-2xl border border-border bg-card p-3 text-center"
                  style={{ "--stagger": "70ms" } as React.CSSProperties}
                >
                  <Sun className="mx-auto size-5 text-gold" strokeWidth={1.6} />
                  <p className="mt-2 font-display text-xl font-semibold text-foreground">
                    {pillarsTouched.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {pillarsTouched.length === 1 ? "pilar" : "pilares"}
                  </p>
                </div>
                <div
                  className="rise rounded-2xl border border-border bg-card p-3 text-center"
                  style={{ "--stagger": "140ms" } as React.CSSProperties}
                >
                  <Flame className="mx-auto size-5 text-terracotta" strokeWidth={1.6} />
                  <p className="mt-2 font-display text-xl font-semibold text-foreground">
                    {streakAfter}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {streakAfter === 1 ? "dia seguido" : "dias seguidos"}
                  </p>
                </div>
              </div>

              {pillarsTouched.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pillarsTouched.map((p) => (
                    <span
                      key={p}
                      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${PILLAR_LEAF_COLOR[p] ?? "var(--primary)"} 28%, transparent)`,
                      }}
                    >
                      {PILLAR_SHORT_LABEL[p] ?? p}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-4 text-sm">
                {challengeDone ? (
                  <p className="text-foreground">
                    Dia {challengeDay} do Desafio Apolo já está marcado.
                  </p>
                ) : allDone ? (
                  <p className="text-foreground">
                    Ao fechar, o dia {challengeDay} do Desafio Apolo fica marcado.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {pending === 1
                      ? `Falta 1 ação para marcar o dia ${challengeDay} do desafio. Sem pressa: amanhã continua.`
                      : `Faltam ${plural(pending, "ação", "ações")} para marcar o dia ${challengeDay} do desafio. Sem pressa: amanhã continua.`}
                  </p>
                )}
                <p className="mt-2 font-editorial text-sm italic text-muted-foreground">
                  Amanhã: uma carta nova te espera ao abrir o dia.
                </p>
              </div>

              <button
                type="button"
                disabled={closing}
                onClick={onCloseDay}
                className="lift mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-foreground disabled:opacity-60"
                style={{ background: "var(--gradient-solar)" }}
              >
                <Moon className="size-4" strokeWidth={2} />
                Fechar o dia
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
