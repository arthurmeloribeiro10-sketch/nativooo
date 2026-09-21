import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useProtocol, useToggleProtocolDay } from "@/lib/nativo-queries";
import { useCompleteChallengeDay } from "@/lib/gamification/queries";

export const Route = createFileRoute("/protocolo")({
  head: () => ({
    meta: [
      { title: "Protocolo Apolo de 30 dias" },
      {
        name: "description",
        content:
          "A jornada de 30 dias de lifestyle natural: missões diárias, conteúdos e acompanhamento de consistência.",
      },
      { property: "og:title", content: "Protocolo Apolo de 30 dias" },
      {
        property: "og:description",
        content: "Comida real, sol, movimento, sono e presença em uma jornada guiada de 30 dias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProtocoloPage,
});

const focos = [
  "Comida real",
  "Sol da manhã",
  "Movimento diário",
  "Sono regular",
  "Presença",
  "Natureza",
];

const acoesPorFoco: Record<string, string[]> = {
  "Comida real": [
    "Uma refeição só com comida de verdade",
    "Zero ultraprocessado no lanche",
    "Beba água antes das refeições",
  ],
  "Sol da manhã": [
    "Passe um tempo ao ar livre pela manhã",
    "Consulte o UV e use a proteção adequada",
    "Tome o café da manhã perto da janela",
  ],
  "Movimento diário": [
    "Caminhada de 20 minutos",
    "Subir escadas em vez de elevador",
    "Alongar 5 minutos",
  ],
  "Sono regular": [
    "Dormir e acordar no mesmo horário",
    "Luz baixa uma hora antes de dormir",
    "Sem tela na cama",
  ],
  Presença: ["30 minutos sem celular", "Uma refeição sem tela", "Cinco minutos de respiração"],
  Natureza: ["Pés descalços na grama", "Uma volta em área verde", "Ar livre por 30 minutos"],
};

function ProtocoloPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const protocol = useProtocol(userId);
  const toggleDay = useToggleProtocolDay(userId);
  const completeDay = useCompleteChallengeDay(userId);

  const completed = protocol.data ?? [];
  const concluidos = completed.length;
  const primeiroPendente = Array.from({ length: 30 }, (_, i) => i + 1).find(
    (day) => !completed.includes(day),
  );
  const hoje = primeiroPendente ?? 30;
  const focoHoje = focos[(hoje - 1) % focos.length] ?? focos[0]!;

  return (
    <AppShell>
      <PageTitle
        title="Protocolo Apolo · 30 dias"
        subtitle="Lifestyle natural em 30 dias — um guia simples, não um fiscal."
      />

      <section className="surface-deep p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-[0.24em] opacity-70">Seu progresso</p>
          <p className="font-display text-sm">{concluidos}/30 dias</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-700"
            style={{ width: `${(concluidos / 30) * 100}%` }}
          />
        </div>
        <p className="mt-5 font-editorial text-base leading-relaxed">
          "Você não precisa de um dia perfeito para continuar."
        </p>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Hoje · Dia {hoje}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Foco: {focoHoje.toLowerCase()}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {(acoesPorFoco[focoHoje] ?? []).map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3"
            >
              <span className="size-2 rounded-full bg-leaf" />
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={concluidos >= 30 || completeDay.isPending}
          onClick={() =>
            completeDay.mutate(hoje, {
              onSuccess: (result) => {
                if (result.coinsAwarded > 0) {
                  toast.success(`Dia ${hoje} concluído.`, {
                    description: `+${result.coinsAwarded} moedas`,
                  });
                } else {
                  toast.success(`Dia ${hoje} concluído.`);
                }
              },
              onError: () => toast.error("Não foi possível concluir o dia. Tente novamente."),
            })
          }
          className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {concluidos >= 30 ? "Protocolo concluído" : `Concluir o dia ${hoje}`}
        </button>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Jornada completa</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Toque em um dia concluído para desmarcá-lo. O primeiro dia pendente fica disponível para
          retomar.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
            const done = completed.includes(day);
            const isToday = day === hoje;
            return (
              <button
                key={day}
                type="button"
                title={focos[(day - 1) % focos.length]}
                onClick={() => {
                  if (done) toggleDay.mutate({ day, done: false });
                  else if (isToday) completeDay.mutate(day);
                }}
                className={`flex aspect-square flex-col items-center justify-center rounded-2xl border text-xs font-medium transition-colors ${
                  done
                    ? "border-success/40 bg-success/15 text-foreground"
                    : isToday
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/50 text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="size-3.5 text-success" />
                ) : !isToday ? (
                  <Lock className="size-3" strokeWidth={1.6} />
                ) : null}
                <span className="mt-1">{day}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Ao concluir, você recebe o selo simbólico do Método Apolo.
        </p>
      </section>
    </AppShell>
  );
}
