import { Sparkles } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { INTENTIONS, type Card, type Intention } from "@/lib/rituals";
import { PILLAR_LEAF_COLOR, PILLAR_SHORT_LABEL } from "@/lib/tree";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  intention: Intention | undefined;
  card: Card | null;
  revealed: boolean;
  accepting: boolean;
  onChooseIntention: (intention: Intention) => void;
  onReveal: () => void;
  onAccept: () => void;
};

function acceptLabel(card: Card) {
  switch (card.kind) {
    case "mission":
      return "Aceitar missão bônus";
    case "focus":
      return "Aceitar o foco";
    case "golden":
      return "Que venha o dia";
    default:
      return "Guardar carta";
  }
}

/** Ritual da manhã: uma intenção em uma palavra e a carta do dia virada. */
export function DayOpenRitual({
  open,
  onOpenChange,
  name,
  intention,
  card,
  revealed,
  accepting,
  onChooseIntention,
  onReveal,
  onAccept,
}: Props) {
  const step: "intention" | "card" = intention ? "card" : "intention";
  const accent = card?.pillar
    ? (PILLAR_LEAF_COLOR[card.pillar] ?? "var(--primary)")
    : "var(--primary)";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg rounded-t-3xl border-border/70 bg-background">
        <div className="max-h-[82dvh] overflow-y-auto pb-8">
          <DrawerHeader className="text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Abrir o dia
            </p>
            <DrawerTitle className="font-display text-2xl font-semibold text-foreground">
              {step === "intention" ? `Como você quer viver hoje, ${name}?` : "Sua carta do dia"}
            </DrawerTitle>
            <DrawerDescription>
              {step === "intention"
                ? "Escolha uma palavra. Ela fica com você o dia inteiro."
                : revealed
                  ? "Ela é sua. Leia com calma."
                  : "Toque para virar."}
            </DrawerDescription>
          </DrawerHeader>

          {step === "intention" ? (
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {INTENTIONS.map((item, i) => (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => onChooseIntention(item.word)}
                  className="lift rise flex min-h-20 flex-col items-start justify-center rounded-2xl border border-border bg-card px-4 py-3 text-left hover:border-primary/50"
                  style={{ "--stagger": `${i * 50}ms` } as React.CSSProperties}
                >
                  <span className="font-display text-lg font-semibold text-foreground">
                    {item.word}
                  </span>
                  <span className="mt-0.5 text-xs text-muted-foreground">{item.hint}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4">
              <div className="perspective-distant mx-auto w-full max-w-[17rem]">
                <button
                  type="button"
                  onClick={revealed ? undefined : onReveal}
                  aria-label={revealed ? "Carta do dia revelada" : "Virar a carta do dia"}
                  className={`transform-3d relative block aspect-[3/4] w-full transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] ${revealed ? "rotate-y-180" : "cursor-pointer"}`}
                >
                  {/* frente (virada para baixo) */}
                  <span
                    className="backface-hidden absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl text-primary-foreground shadow-lifted"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 50% 40%, transparent 0 26%, color-mix(in oklab, var(--primary-foreground) 35%, transparent) 27% 28%, transparent 29% 44%, color-mix(in oklab, var(--primary-foreground) 25%, transparent) 45% 46%, transparent 47% 64%, color-mix(in oklab, var(--primary-foreground) 18%, transparent) 65% 66%, transparent 67%)",
                      }}
                    />
                    <span aria-hidden className="card-shimmer absolute inset-0" />
                    <Sparkles className="relative size-8 text-gold" strokeWidth={1.6} />
                    <span className="relative mt-3 font-display text-xl font-semibold italic">
                      Carta do dia
                    </span>
                    <span className="relative mt-1 text-xs opacity-80">Toque para virar</span>
                  </span>

                  {/* verso (conteúdo) */}
                  <span
                    className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl border p-5 text-left shadow-lifted"
                    style={
                      card?.kind === "golden"
                        ? { background: "var(--gradient-solar)", borderColor: "var(--gold)" }
                        : {
                            background: `linear-gradient(165deg, color-mix(in oklab, ${accent} 16%, var(--card)), var(--card) 70%)`,
                            borderColor: `color-mix(in oklab, ${accent} 45%, var(--border))`,
                          }
                    }
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {card?.kind === "quote"
                          ? "Frase do dia"
                          : card?.kind === "mission"
                            ? "Missão bônus"
                            : card?.kind === "focus"
                              ? "Foco do dia"
                              : "Carta rara"}
                      </span>
                      {card?.pillar ? (
                        <span
                          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-foreground"
                          style={{
                            backgroundColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
                          }}
                        >
                          {PILLAR_SHORT_LABEL[card.pillar] ?? card.pillar}
                        </span>
                      ) : null}
                    </span>
                    <span>
                      <span className="block font-editorial text-xl italic leading-snug text-foreground">
                        {card?.title}
                      </span>
                      <span className="mt-3 block text-sm leading-relaxed text-muted-foreground">
                        {card?.body}
                      </span>
                    </span>
                    <span className="font-display text-xs italic text-muted-foreground">Apolo</span>
                  </span>
                </button>
              </div>

              {revealed && card ? (
                <button
                  type="button"
                  disabled={accepting}
                  onClick={onAccept}
                  className="lift rise mx-auto mt-5 flex min-h-12 w-full max-w-[17rem] items-center justify-center rounded-full text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  style={
                    {
                      background: "var(--gradient-primary)",
                      "--stagger": "350ms",
                    } as React.CSSProperties
                  }
                >
                  {acceptLabel(card)}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
