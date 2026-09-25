import { Calendar, LockOpen, ScanLine, Sparkles, Sun, X, type LucideIcon } from "lucide-react";
import { useEffect } from "react";

import { ApoloWordmark } from "@/components/apolo/ApoloMark";
import { ANNUAL_PRICE_LABEL, TRIAL_DAYS } from "@/lib/pro";

type Feature = { icon: LucideIcon; title: string; detail: string; soft?: boolean };

const FEATURES: Feature[] = [
  {
    icon: ScanLine,
    title: "Scanner ilimitado",
    detail: "Saiba o que tem de verdade em cada rótulo.",
  },
  {
    icon: Sparkles,
    title: "Pergunte ao Apolo",
    detail: "Dúvidas de comida e rotina, a qualquer hora.",
  },
  { icon: Calendar, title: "Desafio de 30 dias", detail: "Missões curtas que viram hábito." },
  { icon: Sun, title: "Seu sol, todo dia", detail: "Sono, sol, movimento e comida num lugar só." },
  {
    icon: LockOpen,
    title: "Cancele quando quiser",
    detail: `${TRIAL_DAYS} dias grátis. Depois, você decide.`,
    soft: true,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
  onRestore: () => void;
  trialActive: boolean;
  daysLeft: number | null;
};

export function Paywall({ open, onClose, onStart, onRestore, trialActive, daysLeft }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-8 pt-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="press flex size-11 items-center justify-center rounded-full text-foreground"
          >
            <X className="size-6" strokeWidth={1.8} />
          </button>
        </div>

        <div className="pop-in mt-4 flex justify-center">
          <ApoloWordmark />
        </div>
        <h1 id="paywall-title" className="mt-6 text-center text-[2.6rem] leading-[1.05]">
          Mais energia,
          <br />
          sem neura.
        </h1>

        <div className="mt-10 grid grid-cols-[3.5rem_1fr] gap-x-6">
          <div
            className="row-span-5 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, var(--primary) 0 79%, var(--secondary) 79% 100%)",
            }}
            aria-hidden
          />
          {FEATURES.map(({ icon: Icon, title, detail, soft }, i) => (
            <div
              key={title}
              className="relative flex min-h-[5.5rem] flex-col justify-center py-2"
              style={{ gridColumn: 2, gridRow: i + 1 }}
            >
              <span
                className={`absolute -left-[4.6rem] top-1/2 flex size-14 -translate-y-1/2 items-center justify-center ${
                  soft ? "text-primary" : "text-primary-foreground"
                }`}
              >
                <Icon className="size-6" strokeWidth={1.8} />
              </span>
              <p className="text-[1.35rem] font-semibold leading-tight text-foreground">{title}</p>
              <p className="mt-1 text-[16px] leading-snug text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-10">
          {trialActive ? (
            <div className="rounded-full bg-secondary px-6 py-4 text-center text-[16px] font-semibold text-primary">
              Seu teste grátis está ativo ·{" "}
              {daysLeft === 1 ? "1 dia restante" : `${daysLeft} dias restantes`}
            </div>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="press min-h-14 w-full rounded-full bg-ink text-[1.1rem] font-semibold text-primary-foreground"
            >
              Começar {TRIAL_DAYS} dias grátis
            </button>
          )}
          <p className="mt-4 text-center text-[16px] text-muted-foreground">
            Depois, {ANNUAL_PRICE_LABEL} por ano
          </p>
          <div className="mt-5 flex items-center justify-center gap-8 text-[16px]">
            <a href="/privacidade" className="text-muted-foreground hover:text-foreground">
              Privacidade
            </a>
            <button type="button" onClick={onRestore} className="font-medium text-primary">
              Restaurar
            </button>
            <a href="/termos" className="text-muted-foreground hover:text-foreground">
              Termos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
