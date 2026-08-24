import { createFileRoute } from "@tanstack/react-router";
import { Heart, MessageCircle, Flame } from "lucide-react";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { communityPosts, ranking } from "@/lib/nativo-data";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade e ranking — NATIVO" },
      {
        name: "description",
        content:
          "Compartilhe progresso, participe de desafios e acompanhe um ranking de consistência — competição leve, sem comparação prejudicial.",
      },
      { property: "og:title", content: "Comunidade e ranking — NATIVO" },
      {
        property: "og:description",
        content: "Consistência, sequência e participação: o ranking celebra hábito, não número.",
      },
    ],
  }),
  component: ComunidadePage,
});

function ComunidadePage() {
  return (
    <AppShell>
      <PageTitle
        title="Comunidade Nativo"
        subtitle="Grupo do Protocolo de 30 dias · 842 pessoas praticando junto."
      />

      <section className="surface p-5">
        <h2 className="text-lg">Ranking de consistência</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Baseado em sequência, missões concluídas e participação.
        </p>
        <ul className="mt-4 divide-y divide-border/60">
          {ranking.map((r) => (
            <li
              key={r.pos}
              className={`flex items-center gap-3 py-3 ${
                r.isUser ? "rounded-xl bg-secondary/70 px-3" : ""
              }`}
            >
              <span className="w-6 font-display text-sm text-muted-foreground">{r.pos}</span>
              <span className="flex-1 text-sm font-medium">{r.name}</span>
              <span className="flex items-center gap-1 text-xs text-terracotta">
                <Flame className="size-3.5" /> {r.streak}
              </span>
              <span className="w-16 text-right text-xs text-muted-foreground">
                {r.missions} missões
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-3">
        {communityPosts.map((p) => (
          <article key={p.id} className="surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-sm text-secondary-foreground">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.streak} dias de sequência · {p.time}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">{p.text}</p>
            <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Heart className="size-4 text-terracotta" strokeWidth={1.6} /> {p.reactions}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="size-4" strokeWidth={1.6} /> Comentar
              </span>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
