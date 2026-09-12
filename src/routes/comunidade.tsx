import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Flame, Heart, ImagePlus, Plus, Trash2, X } from "lucide-react";
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
  const ranking = useRanking(userId);
  const { create, remove, react } = usePostMutations(userId);
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  function escolherFoto(file: File | null) {
    if (previa) URL.revokeObjectURL(previa);
    setFoto(file);
    setPrevia(file ? URL.createObjectURL(file) : null);
  }

  return (
    <AppShell>
      <PageTitle
        title="Comunidade Nativo"
        subtitle="Pessoas praticando o mesmo método, no mesmo dia."
      />

       <section className="mb-5 flex items-center justify-between"><div><h2 className="text-xl">Publicações recentes</h2><p className="text-xs text-muted-foreground">Experiências reais da comunidade.</p></div><button onClick={() => setComposerOpen((v) => !v)} className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">{composerOpen ? <ChevronDown className="size-4"/> : <Plus className="size-4"/>}{composerOpen ? "Fechar" : "Compartilhar"}</button></section>
       {composerOpen ? <section className="surface p-5">
         <h2 className="text-lg">Compartilhe seu dia</h2>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Como foi o seu dia no protocolo?"
          className="mt-3 w-full resize-none rounded-2xl border border-input bg-background/70 p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
        />

        {previa ? (
          <div className="relative mt-3 overflow-hidden rounded-2xl">
            <img src={previa} alt="Prévia da foto escolhida" className="w-full object-cover" />
            <button
              type="button"
              onClick={() => escolherFoto(null)}
              className="absolute right-3 top-3 rounded-full bg-background/85 p-2 text-foreground"
              aria-label="Remover foto"
            >
              <X className="size-4" strokeWidth={1.8} />
            </button>
          </div>
        ) : null}

        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-leaf hover:text-foreground">
          <ImagePlus className="size-4" strokeWidth={1.6} />
          {foto ? "Trocar foto" : "Adicionar foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 10 * 1024 * 1024) {
                toast.error("A foto precisa ter até 10 MB.");
                return;
              }
              escolherFoto(f);
            }}
          />
        </label>

        <button
          type="button"
          disabled={create.isPending}
          onClick={() => {
            const value = texto.trim();
            if (!value && !foto) return;
            create.mutate(
              { body: value, file: foto },
              {
                onSuccess: () => {
                  setTexto("");
                  escolherFoto(null);
                   setComposerOpen(false);
                  toast.success("Publicado na comunidade.");
                },
                onError: () => toast.error("Não consegui publicar agora."),
              },
            );
          }}
          className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {create.isPending ? "Publicando…" : "Publicar"}
        </button>
       </section> : null}


       <section className="mt-5 space-y-3">
         {posts.isLoading ? (
           <p className="text-sm text-muted-foreground">Carregando publicações…</p>
         ) : posts.isError ? <div className="surface p-5"><p className="text-sm">Não foi possível carregar as publicações.</p><button onClick={() => posts.refetch()} className="mt-3 text-sm font-medium text-primary">Tentar novamente</button></div> : (posts.data ?? []).length === 0 ? (
           <div className="surface p-5"><p className="text-sm font-medium">A comunidade ainda está vazia.</p><p className="mt-1 text-xs text-muted-foreground">Compartilhe uma experiência quando quiser inaugurar este espaço.</p></div>
         ) : (posts.data ?? []).map((p) => (
            <article key={p.id} className="surface p-5">
              <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-sm">{p.author.charAt(0).toUpperCase()}</div><div className="flex-1"><p className="text-sm font-medium">{p.author}</p><p className="text-xs text-muted-foreground">{tempoRelativo(p.created_at)}</p></div>{p.user_id === userId ? <button aria-label="Apagar publicação" onClick={() => remove.mutate(p.id)} className="p-2 text-muted-foreground hover:text-terracotta"><Trash2 className="size-4"/></button> : null}</div>
              {p.body ? <p className="mt-4 text-sm leading-relaxed">{p.body}</p> : null}{p.image_url ? <img src={p.image_url} alt={`Foto publicada por ${p.author}`} loading="lazy" className="mt-4 w-full rounded-lg object-cover"/> : null}<button onClick={() => react.mutate({ postId: p.id, reacted: p.reacted })} className="mt-4 flex min-h-10 items-center gap-2 text-xs text-muted-foreground" aria-label={p.reacted ? "Remover apoio" : "Apoiar publicação"}><Heart className={`size-4 ${p.reacted ? "fill-terracotta text-terracotta" : ""}`}/>{p.reactions}</button>
            </article>
         ))}
       </section>

       <section className="surface mt-6 p-5">
         <h2 className="text-lg">Ranking de consistência</h2>
         <p className="mt-1 text-xs text-muted-foreground">Histórico acumulado. Ordem: dias do protocolo; em empate, missões concluídas.</p>
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
                 {r.missions_done} {r.missions_done === 1 ? "missão" : "missões"}
              </span>
            </li>
          ))}
          {!ranking.isLoading && (ranking.data ?? []).length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">Ainda sem participantes.</li>
          ) : null}
        </ul>
      </section>

    </AppShell>
  );
}
