import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, ChevronLeft, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { ApoloMark } from "@/components/apolo/ApoloMark";
import { askApolo } from "@/lib/apolo-chat.functions";
import { useAuth } from "@/lib/auth-context";
import { CHAT_FOLLOW_UPS, CHAT_SUGGESTIONS, useChatHistory, type ChatMessage } from "@/lib/chat";
import { firstName } from "@/lib/format";
import { mealDescription } from "@/lib/meals";
import { today, useMeals, useMissions, useProfile } from "@/lib/nativo-queries";
import { useRitual } from "@/lib/rituals";

export const Route = createFileRoute("/perguntar")({
  head: () => ({
    meta: [
      { title: "Pergunte ao Apollo" },
      {
        name: "description",
        content: "Como podemos começar hoje? Pergunte qualquer coisa sobre comida e rotina.",
      },
      { property: "og:title", content: "Pergunte ao Apollo" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerguntarPage,
});

function PerguntarPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const ask = useServerFn(askApolo);
  const { messages, persist, clear, ready } = useChatHistory(userId);
  const profile = useProfile(userId);
  const missions = useMissions(userId);
  const meals = useMeals(userId);
  const { ritual } = useRitual(userId, today());

  const [text, setText] = useState("");
  const [answering, setAnswering] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, answering]);

  async function send(content: string) {
    const value = content.trim();
    if (!value || answering) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: value, at: new Date().toISOString() },
    ];
    persist(next);
    setText("");
    setAnswering(true);
    try {
      const { reply } = await ask({
        data: {
          messages: next.slice(-12).map(({ role, content }) => ({ role, content })),
          context: {
            name: firstName(profile.data?.display_name),
            intention: ritual.intention,
            pendingMissions: (missions.data ?? [])
              .filter((m) => m.status === "pending")
              .map((m) => m.title),
            mealsToday: (meals.data ?? [])
              .filter((m) => m.done)
              .map(mealDescription)
              .filter(Boolean),
          },
        },
      });
      persist([...next, { role: "assistant", content: reply, at: new Date().toISOString() }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui responder agora.");
    } finally {
      setAnswering(false);
      inputRef.current?.focus();
    }
  }

  const suggestions = messages.length === 0 ? CHAT_SUGGESTIONS : CHAT_FOLLOW_UPS;

  return (
    <AppShell nav={false} padded={false}>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/95 px-5 pb-3 pt-6 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            aria-label="Voltar"
            className="press flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
          >
            <ChevronLeft className="size-6" strokeWidth={2} />
          </button>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <ApoloMark className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.6rem] leading-tight">Pergunte ao Apollo</h1>
            <p className="text-[15px] text-muted-foreground">Como podemos começar hoje?</p>
          </div>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                clear();
                toast.success("Conversa limpa.");
              }}
              aria-label="Limpar conversa"
              className="press flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-terracotta"
            >
              <Trash2 className="size-4" strokeWidth={1.8} />
            </button>
          ) : null}
        </header>

        <div className="flex-1 px-5 pb-40 pt-3">
          {!ready ? null : messages.length === 0 ? (
            <div className="rise surface mt-2 p-5">
              <p className="text-lg font-medium leading-snug text-foreground">
                Oi. Pode perguntar sobre comida, sono, sol, movimento ou rotina.
              </p>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Respostas curtas, sem culpa e sem contar caloria.
              </p>
            </div>
          ) : null}

          <ul className="mt-3 space-y-3">
            {messages.map((m, i) => (
              <li
                key={`${m.at}-${i}`}
                className={`rise flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-[26px] rounded-br-lg bg-primary px-5 py-4 text-[17px] leading-snug text-primary-foreground"
                      : "max-w-[92%] rounded-[26px] rounded-bl-lg bg-card px-5 py-4 text-[17px] leading-relaxed text-foreground"
                  }
                >
                  {m.content.split(/\n{2,}/).map((paragraph, j, all) => (
                    <p
                      key={j}
                      className={`whitespace-pre-line ${j > 0 ? "mt-3" : ""} ${
                        m.role === "assistant" &&
                        j === all.length - 1 &&
                        all.length > 1 &&
                        paragraph.trim().endsWith("?")
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </li>
            ))}
            {answering ? (
              <li
                className="flex justify-start"
                aria-live="polite"
                aria-label="O Apollo está escrevendo"
              >
                <div className="flex items-center gap-1.5 rounded-[26px] rounded-bl-lg bg-card px-5 py-4">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="typing-dot size-2 rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </li>
            ) : null}
          </ul>

          {!answering && ready ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {suggestions.map((s, i) => {
                const highlighted = s === "Montar minha semana";
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className={`press rise min-h-12 rounded-full px-5 text-[16px] transition-colors ${
                      highlighted
                        ? "border border-primary/40 bg-secondary font-semibold text-primary"
                        : "border border-sand-deep bg-card text-foreground"
                    }`}
                    style={{ "--stagger": `${i * 60}ms` } as React.CSSProperties}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
          className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background to-transparent px-5 pb-5 pt-6"
        >
          <div className="mx-auto flex w-full max-w-lg items-center gap-3">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pergunte qualquer coisa"
              aria-label="Sua pergunta"
              autoComplete="off"
              className="min-h-14 min-w-0 flex-1 rounded-full bg-card px-6 text-[17px] text-foreground shadow-soft outline-none placeholder:text-muted-foreground/80 focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={answering || !text.trim()}
              aria-label="Enviar"
              className="press flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-nav disabled:opacity-50"
            >
              <ArrowUp className="size-6" strokeWidth={2.2} />
            </button>
          </div>
          <p className="mx-auto mt-3 max-w-lg text-center text-[13px] text-muted-foreground">
            O Apollo orienta. Não substitui um profissional de saúde.
          </p>
        </form>
      </div>
    </AppShell>
  );
}
