import { createFileRoute } from "@tanstack/react-router";
import { Lock, Check } from "lucide-react";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { protocolDays } from "@/lib/nativo-data";

export const Route = createFileRoute("/protocolo")({
  head: () => ({
    meta: [
      { title: "Protocolo Nativo de 30 dias — João Braga" },
      {
        name: "description",
        content:
          "A jornada de 30 dias de lifestyle natural do creator João Braga: missões diárias, conteúdos e acompanhamento de consistência.",
      },
      { property: "og:title", content: "Protocolo Nativo de 30 dias — João Braga" },
      {
        property: "og:description",
        content: "Comida real, sol, movimento, sono e presença em uma jornada guiada de 30 dias.",
      },
    ],
  }),
  component: ProtocoloPage,
});

function ProtocoloPage() {
  const concluidos = protocolDays.filter((d) => d.state === "done").length;

  return (
    <AppShell>
      <PageTitle
        title="Protocolo Nativo · 30 dias"
        subtitle="Lifestyle natural com João Braga — seu creator guia, não fiscal."
      />

      <section className="surface-deep p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-[0.24em] opacity-70">Seu progresso</p>
          <p className="font-display text-sm">{concluidos}/30 dias</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${(concluidos / 30) * 100}%` }}
          />
        </div>
        <p className="mt-5 font-editorial text-base leading-relaxed">
          "Você não precisa de um dia perfeito para continuar."
        </p>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Hoje · Dia 12</h2>
        <p className="mt-1 text-sm text-muted-foreground">Foco: sono regular</p>
        <ul className="mt-4 space-y-2 text-sm">
          {[
            "Dormir e acordar no mesmo horário",
            "Luz baixa uma hora antes de dormir",
            "Sem tela na cama",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3"
            >
              <span className="size-2 rounded-full bg-leaf" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Jornada completa</h2>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {protocolDays.map((d) => (
            <div
              key={d.day}
              title={d.focus}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl border text-xs font-medium ${
                d.state === "done"
                  ? "border-success/40 bg-success/15 text-foreground"
                  : d.state === "today"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/50 text-muted-foreground"
              }`}
            >
              {d.state === "done" ? (
                <Check className="size-3.5 text-success" />
              ) : d.state === "locked" ? (
                <Lock className="size-3" strokeWidth={1.6} />
              ) : null}
              <span className="mt-1">{d.day}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Ao concluir, você recebe o selo simbólico do Método Nativo.
        </p>
      </section>

      <section className="surface mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg">Protocolos premium</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jornadas completas, análises e histórico no Nativo Pro.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-gold px-5 py-3 text-sm font-medium text-gold-foreground transition-opacity hover:opacity-90"
        >
          Conhecer o Pro · R$ 29,90/mês
        </button>
      </section>
    </AppShell>
  );
}
