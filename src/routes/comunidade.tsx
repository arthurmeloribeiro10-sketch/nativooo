import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { useAuth } from "@/lib/auth-context";
import { usePostMutations, usePosts, useRanking } from "@/lib/nativo-queries";

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

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

function ComunidadePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const posts = usePosts(userId);
  const ranking = useRanking();
  const { create, remove, react } = usePostMutations(userId);
  const [texto, setTexto] = useState("");

  return (
    <AppShell>
      <PageTitle
        title="Comunidade Nativo"
        subtitle="Pessoas praticando o mesmo método, no mesmo dia."
      />

      <section className="surface p-5">
        <h2 className="text-lg">Compartilhe seu dia</h2>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Como foi o seu dia no protocolo?"
          className="mt-3 w-full resize-none rounded-2xl border border-input bg-background/70 p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
        />
        <button
          type="button"
          onClick={() => {
            const value = texto.trim();
            if (!value) return;
            create.mutate(value, {
              onSuccess: () => {
                setTexto("");
                toast.success("Publicado na comunidade.");
              },
            });
          }}
          className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Publicar
        </button>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Ranking de consistência</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Baseado em dias do protocolo e missões concluídas.
        </p>
        <ul className="mt-4 divide-y divide-border/60">
          {(ranking.data ?? []).map((r, i) => (
            <li
              key={r.user_id}
              className={`flex items-center gap-3 py-3 ${
                r.user_id === userId ? "rounded-xl bg-secondary/70 px-3" : ""
              }`}
            >
              <span className="w-6 font-display text-sm text-muted-foreground">{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{r.display_name}</span>
              <span className="flex items-center gap-1 text-xs text-terracotta">
                <Flame className="size-3.5" /> {r.protocol_days}
              </span>
              <span className="w-16 text-right text-xs text-muted-foreground">
                {r.missions_done} missões
              </span>
            </li>
          ))}
          {!ranking.isLoading && (ranking.data ?? []).length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">Ainda sem participantes.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-6 space-y-3">
        {posts.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando o feed…</p>
        ) : (posts.data ?? []).length === 0 ? (
          <p className="surface p-5 text-sm text-muted-foreground">
            Ninguém publicou ainda. Seja o primeiro a contar como foi seu dia.
          </p>
        ) : (
          (posts.data ?? []).map((p) => (
            <article key={p.id} className="surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-sm text-secondary-foreground">
                  {p.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.author}</p>
                  <p className="text-xs text-muted-foreground">{tempoRelativo(p.created_at)}</p>
                </div>
                {p.user_id === userId ? (
                  <button
                    type="button"
                    aria-label="Apagar post"
                    onClick={() => remove.mutate(p.id)}
                    className="text-muted-foreground transition-colors hover:text-terracotta"
                  >
                    <Trash2 className="size-4" strokeWidth={1.6} />
                  </button>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground">{p.body}</p>
              <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => react.mutate({ postId: p.id, reacted: p.reacted })}
                  className="flex items-center gap-1.5 transition-colors hover:text-terracotta"
                >
                  <Heart
                    className={`size-4 ${p.reacted ? "fill-terracotta text-terracotta" : ""}`}
                    strokeWidth={1.6}
                  />
                  {p.reactions}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
