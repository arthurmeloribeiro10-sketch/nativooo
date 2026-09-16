import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck, ChevronDown, Flame, Heart, ImagePlus, MessageCircle, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useCommunityNotificationsContext } from "@/lib/community-notifications-context";
import { usePostMutations, usePosts, useRanking } from "@/lib/nativo-queries";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade e ranking — APOLO" },
      {
        name: "description",
        content:
          "Compartilhe progresso, participe de desafios e acompanhe um ranking de consistência — competição leve, sem comparação prejudicial.",
      },
      { property: "og:title", content: "Comunidade e ranking — APOLO" },
      {
        property: "og:description",
        content: "Consistência, sequência e participação: o ranking celebra hábito, não número.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { create, remove, react, reply, removeReply } = usePostMutations(userId);
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useCommunityNotificationsContext();

  function escolherFoto(file: File | null) {
    if (previa) URL.revokeObjectURL(previa);
    setFoto(file);
    setPrevia(file ? URL.createObjectURL(file) : null);
  }

  return (
    <AppShell>
       <div className="flex items-start justify-between gap-4">
         <PageTitle
           title="Comunidade Apolo"
           subtitle="Pessoas praticando o mesmo método, no mesmo dia."
         />
         <Button
           type="button"
           variant="outline"
           size="icon"
           className="relative mt-1 shrink-0"
           aria-label={notifications.unreadCount > 0 ? `${notifications.unreadCount} notificações não lidas` : "Notificações"}
           aria-expanded={notificationsOpen}
           onClick={() => setNotificationsOpen((open) => !open)}
         >
           <Bell className="size-4" />
           {notifications.unreadCount > 0 ? (
             <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] leading-5 text-primary-foreground">
               {notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}
             </span>
           ) : null}
         </Button>
       </div>

       {notificationsOpen ? (
         <section className="surface mb-5 p-5" aria-label="Notificações da comunidade">
           <div className="flex items-center justify-between gap-3">
             <div>
               <h2 className="text-lg">Novidades</h2>
               <p className="text-xs text-muted-foreground">Mensagens e respostas da comunidade.</p>
             </div>
             {notifications.unreadCount > 0 ? (
               <Button
                 type="button"
                 variant="ghost"
                 size="sm"
                 disabled={notifications.markAllRead.isPending}
                 onClick={() => notifications.markAllRead.mutate()}
               >
                 <CheckCheck className="size-4" />
                 Marcar como lidas
               </Button>
             ) : null}
           </div>

           {notifications.isLoading ? (
             <p className="mt-4 text-sm text-muted-foreground">Carregando novidades…</p>
           ) : notifications.isError ? (
             <div className="mt-4">
               <p className="text-sm text-muted-foreground">Não foi possível carregar as notificações.</p>
               <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => notifications.refetch()}>
                 Tentar novamente
               </Button>
             </div>
           ) : (notifications.data ?? []).length === 0 ? (
             <p className="mt-4 text-sm text-muted-foreground">Nenhuma novidade por enquanto.</p>
           ) : (
             <ul className="mt-4 divide-y divide-border/60">
               {(notifications.data ?? []).map((item) => (
                 <li key={item.id}>
                   <button
                     type="button"
                     className="flex w-full items-start gap-3 py-3 text-left"
                     onClick={() => {
                       setNotificationsOpen(false);
                       if (!item.read_at) notifications.markAllRead.mutate();
                       document.getElementById(`post-${item.post_id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                     }}
                   >
                     <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read_at ? "bg-border" : "bg-terracotta"}`} />
                     <span className="min-w-0 flex-1">
                       <span className="block text-sm">
                         <strong>{item.actor}</strong>{item.kind === "reply" ? " respondeu à sua publicação." : " compartilhou uma nova mensagem."}
                       </span>
                       {item.preview ? <span className="mt-1 block truncate text-xs text-muted-foreground">{item.preview}</span> : null}
                       <span className="mt-1 block text-xs text-muted-foreground">{tempoRelativo(item.created_at)}</span>
                     </span>
                   </button>
                 </li>
               ))}
             </ul>
           )}
         </section>
       ) : null}

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
            accept="image/jpeg,image/png,image/webp"
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
             <article key={p.id} id={`post-${p.id}`} className="surface scroll-mt-6 p-5">
              <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-sm">{p.author.charAt(0).toUpperCase()}</div><div className="flex-1"><p className="text-sm font-medium">{p.author}</p><p className="text-xs text-muted-foreground">{tempoRelativo(p.created_at)}</p></div>{p.user_id === userId ? <button aria-label="Apagar publicação" onClick={() => remove.mutate(p.id)} className="p-2 text-muted-foreground hover:text-terracotta"><Trash2 className="size-4"/></button> : null}</div>
               {p.body ? <p className="mt-4 text-sm leading-relaxed">{p.body}</p> : null}
               {p.image_url ? <img src={p.image_url} alt={`Foto publicada por ${p.author}`} loading="lazy" className="mt-4 w-full rounded-lg object-cover"/> : null}
               <div className="mt-4 flex items-center gap-5">
                 <button onClick={() => react.mutate({ postId: p.id, reacted: p.reacted })} className="flex min-h-10 items-center gap-2 text-xs text-muted-foreground" aria-label={p.reacted ? "Remover apoio" : "Apoiar publicação"}><Heart className={`size-4 ${p.reacted ? "fill-terracotta text-terracotta" : ""}`}/>{p.reactions}</button>
                 <button
                   type="button"
                   onClick={() => {
                     setReplyingTo((current) => current === p.id ? null : p.id);
                     setReplyText("");
                   }}
                   className="flex min-h-10 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                   aria-expanded={replyingTo === p.id}
                 >
                   <MessageCircle className="size-4" />
                   {p.replies.length === 1 ? "1 resposta" : `${p.replies.length} respostas`}
                 </button>
               </div>

               {p.replies.length > 0 ? (
                 <div className="mt-3 space-y-3 border-l border-border pl-4">
                   {p.replies.map((item) => (
                     <div key={item.id} className="flex gap-3">
                       <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xs">
                         {item.author.charAt(0).toUpperCase()}
                       </div>
                       <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2">
                           <p className="text-xs font-medium">{item.author}</p>
                           <span className="text-xs text-muted-foreground">{tempoRelativo(item.created_at)}</span>
                         </div>
                         <p className="mt-1 break-words text-sm leading-relaxed">{item.body}</p>
                       </div>
                       {item.user_id === userId ? (
                         <button
                           type="button"
                           aria-label="Apagar resposta"
                           onClick={() => removeReply.mutate(item.id, { onError: () => toast.error("Não consegui apagar a resposta.") })}
                           className="self-start p-2 text-muted-foreground hover:text-terracotta"
                         >
                           <Trash2 className="size-3.5" />
                         </button>
                       ) : null}
                     </div>
                   ))}
                 </div>
               ) : null}

               {replyingTo === p.id ? (
                 <form
                   className="mt-3 flex items-end gap-2"
                   onSubmit={(event) => {
                     event.preventDefault();
                     const body = replyText.trim();
                     if (!body) return;
                     reply.mutate(
                       { postId: p.id, body },
                       {
                         onSuccess: () => {
                           setReplyText("");
                           setReplyingTo(null);
                         },
                         onError: () => toast.error("Não consegui enviar a resposta."),
                       },
                     );
                   }}
                 >
                   <label className="sr-only" htmlFor={`reply-${p.id}`}>Escreva uma resposta</label>
                   <textarea
                     id={`reply-${p.id}`}
                     value={replyText}
                     onChange={(event) => setReplyText(event.target.value.slice(0, 500))}
                     rows={2}
                     maxLength={500}
                     autoFocus
                     placeholder={`Responder a ${p.author}`}
                     className="min-h-11 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
                   />
                   <Button type="submit" size="icon" disabled={!replyText.trim() || reply.isPending} aria-label="Enviar resposta">
                     <Send className="size-4" />
                   </Button>
                 </form>
               ) : null}
            </article>
         ))}
       </section>

       <section className="surface mt-6 p-5">
         <h2 className="text-lg">Ranking de consistência</h2>
         <p className="mt-1 text-xs text-muted-foreground">Histórico acumulado. Ordem: dias do protocolo; em empate, missões concluídas.</p>
         {ranking.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Carregando ranking…</p> : ranking.isError ? <div className="mt-4"><p className="text-sm text-muted-foreground">Não foi possível carregar o ranking.</p><button onClick={() => ranking.refetch()} className="mt-2 text-sm font-medium text-primary">Tentar novamente</button></div> : <ul className="mt-4 divide-y divide-border/60">
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
         </ul>}
      </section>

    </AppShell>
  );
}
