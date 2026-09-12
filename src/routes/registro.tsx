import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MoreHorizontal, PenLine, RotateCcw } from "lucide-react";
import { toast } from "sonner";


import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { useAuth } from "@/lib/auth-context";
import {
  useAddMission,
  useDeleteMission,
  useMealMutations,
  useMeals,
  useRecentMeals,
  useMissions,
  useToggleMission,
} from "@/lib/nativo-queries";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registrar refeição e hábitos — NATIVO" },
      {
        name: "description",
        content:
          "Registre refeições em texto e marque hábitos do dia. Feedback leve, sem contagem obsessiva de calorias.",
      },
      { property: "og:title", content: "Registrar refeição e hábitos — NATIVO" },
      {
        property: "og:description",
        content: "Poucos toques para registrar seu dia e ver o Nativo Score se atualizar.",
      },
    ],
  }),
  component: RegistroPage,
});

const habitos: { label: string; pillar: string }[] = [
  { label: "Exercício", pillar: "movimento" },
  { label: "Caminhada", pillar: "movimento" },
  { label: "Sono", pillar: "sono" },
  { label: "Ar livre", pillar: "sol" },
  { label: "Sol", pillar: "sol" },
  { label: "Hidratação", pillar: "habitos" },
  { label: "Menos telas", pillar: "presenca" },
  { label: "Leitura", pillar: "presenca" },
  { label: "Respiração", pillar: "presenca" },
];

function RegistroPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const meals = useMeals(userId);
  const { add } = useMealMutations(userId);
  const recent = useRecentMeals(userId);
  const { repeat } = useMealMutations(userId);
  const missions = useMissions(userId);
  const addMission = useAddMission(userId);
  const toggleMission = useToggleMission(userId);
  const deleteMission = useDeleteMission(userId);

  const [texto, setTexto] = useState("");
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [conquista, setConquista] = useState<string | null>(null);

  const missionList = missions.data ?? [];
  const registradasHoje = (meals.data ?? []).filter((m) => m.done).length;

  return (
    <AppShell>
      <PageTitle
        title="O que entrou no seu dia?"
        subtitle="Registrar deve levar segundos. Descreva a refeição e marque os hábitos que já aconteceram."
      />

      <section className="surface p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <PenLine className="size-5 text-leaf" strokeWidth={1.6} />
          Registrar refeição
        </h2>
         <p className="mt-1 text-xs text-muted-foreground">
          {registradasHoje} refeições marcadas como feitas hoje.
        </p>
        {(recent.data ?? []).length ? <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">Repetir uma recente</p><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{(recent.data ?? []).map((meal) => <button key={meal.id} disabled={repeat.isPending} onClick={() => repeat.mutate(meal, { onSuccess: () => toast.success("Refeição repetida."), onError: () => toast.error("Não foi possível repetir. Tente novamente.") })} className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"><RotateCcw className="size-3"/>{meal.name}</button>)}</div></div> : null}

        <textarea
          id="refeicao"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Ovos com abacate, café e uma fruta"
          className="mt-4 w-full resize-none rounded-2xl border border-input bg-background/70 p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
        />
        <button
          type="button"
          onClick={() => {
            const value = texto.trim();
            if (!value) return;
            add.mutate(
              { name: value, done: true, time_label: "Registro", kcal: 0, note: "Registrado por você" },
              {
                onSuccess: () => {
                  setUltimo(value);
                  setTexto("");
                  setConquista(value);
                },
              },
            );
          }}
          className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Registrar refeição
        </button>

        {ultimo ? (
          <div className="rise mt-4 rounded-2xl border border-success/40 bg-success/10 p-4">
            <p className="text-sm font-medium text-foreground">Registrado: {ultimo}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Ela já aparece na sua dieta do dia e conta no seu pilar de alimentação.
            </p>
          </div>
        ) : null}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Hábitos de hoje</h2>
        <p className="mt-1 text-xs text-muted-foreground">Toque no que já aconteceu.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {habitos.map((h) => {
            const existente = missionList.find((m) => m.title === h.label);
            const ativo = !!existente?.done;
            return (
              <button
                key={h.label}
                type="button"
                 disabled={toggleMission.isPending || addMission.isPending}
                 onClick={() => {
                  if (existente) toggleMission.mutate({ id: existente.id, done: !existente.done });
                  else addMission.mutate({ title: h.label, pillar: h.pillar, done: true });
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  ativo
                    ? "border-leaf bg-leaf text-leaf-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:border-leaf"
                }`}
              >
                {ativo ? <Check className="size-3.5" /> : null}
                {h.label}
              </button>
            );
          })}
        </div>
      </section>

       <section className="surface mt-6 p-5">
        <h2 className="text-lg">Missões do dia</h2>
         <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pendentes</h3><ul className="mt-2 space-y-2">
           {missionList.filter((m) => !m.done).map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3">
              <button
                type="button"
                onClick={() => toggleMission.mutate({ id: m.id, done: !m.done })}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    m.done ? "border-success bg-success" : "border-border"
                  }`}
                >
                  {m.done ? <Check className="size-3 text-primary-foreground" strokeWidth={3} /> : null}
                </span>
                <span className={`text-sm ${m.done ? "text-muted-foreground line-through" : ""}`}>
                  {m.title}
                </span>
              </button>
               <details className="relative"><summary aria-label={`Opções de ${m.title}`} className="cursor-pointer list-none rounded-lg p-2 text-muted-foreground"><MoreHorizontal className="size-4"/></summary><button type="button" onClick={() => deleteMission.mutate(m.id, { onError: () => toast.error("Não foi possível remover.") })} className="absolute right-0 z-10 mt-1 rounded-lg border border-border bg-card px-3 py-2 text-xs text-terracotta shadow">Remover missão</button></details>
            </li>
          ))}
        </ul>
         {missionList.some((m) => m.done) ? <details className="mt-4"><summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Concluídas ({missionList.filter((m) => m.done).length})</summary><ul className="mt-2 space-y-2">{missionList.filter((m) => m.done).map((m) => <li key={m.id}><button onClick={() => toggleMission.mutate({ id: m.id, done: false })} className="flex w-full items-center gap-3 rounded-lg border border-success/40 bg-success/10 p-3 text-left text-sm"><Check className="size-4"/><span className="line-through">{m.title}</span></button></li>)}</ul></details> : null}
      </section>
      <AchievementBurst
        open={!!conquista}
        title="Refeição registrada!"
        subtitle={conquista ? `"${conquista}" entrou no seu dia e conta no seu Nativo Score.` : ""}
        onDone={() => setConquista(null)}
      />
    </AppShell>
  );
}
