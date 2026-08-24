import { createFileRoute } from "@tanstack/react-router";
import { Award, Flame, Leaf } from "lucide-react";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { PillarBar } from "@/components/nativo/PillarBar";
import { nativoScore, pillars } from "@/lib/nativo-data";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seu perfil e evolução — NATIVO" },
      {
        name: "description",
        content:
          "Histórico do Nativo Score, protocolos concluídos, sequência e evolução dos pilares do seu estilo de vida.",
      },
      { property: "og:title", content: "Seu perfil e evolução — NATIVO" },
      {
        property: "og:description",
        content: "Menos controle ansioso. Mais vida bem vivida — acompanhe sua evolução real.",
      },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <AppShell>
      <PageTitle title="Arthur" subtitle="Acompanhando o método de João Braga desde julho." />

      <section className="surface grid grid-cols-3 divide-x divide-border/60 p-5 text-center">
        <div>
          <Leaf className="mx-auto size-5 text-leaf" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">{nativoScore}</p>
          <p className="text-[11px] text-muted-foreground">Nativo Score</p>
        </div>
        <div>
          <Flame className="mx-auto size-5 text-terracotta" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">12</p>
          <p className="text-[11px] text-muted-foreground">Sequência</p>
        </div>
        <div>
          <Award className="mx-auto size-5 text-gold" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">2</p>
          <p className="text-[11px] text-muted-foreground">Protocolos</p>
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Evolução dos pilares</h2>
        <div className="mt-2 divide-y divide-border/60">
          {pillars.map((p) => (
            <PillarBar key={p.key} label={p.label} score={p.score} />
          ))}
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Conquistas</h2>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[
            "Primeiros 7 dias",
            "Comida real por 21 dias",
            "Sol da manhã · 10 dias",
            "Semana sem desistir",
          ].map((c) => (
            <span
              key={c}
              className="rounded-full border border-gold/50 bg-gold/15 px-4 py-2 font-medium text-foreground"
            >
              {c}
            </span>
          ))}
        </div>
        <p className="mt-5 font-editorial text-sm text-accent">"Menos controle. Mais consciência."</p>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Seu plano</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plano gratuito · score básico, registros limitados e protocolo introdutório.
        </p>
        <button
          type="button"
          className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Assinar o Nativo Pro · R$ 29,90/mês
        </button>
      </section>
    </AppShell>
  );
}
