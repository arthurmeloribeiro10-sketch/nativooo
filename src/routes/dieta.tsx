import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, UtensilsCrossed } from "lucide-react";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { dietPlan, dietTemplates } from "@/lib/nativo-data";

export const Route = createFileRoute("/dieta")({
  head: () => ({
    meta: [
      { title: "Sua dieta do dia — NATIVO" },
      {
        name: "description",
        content:
          "Veja o plano alimentar do dia, marque as refeições feitas e monte sua própria dieta com modelos de comida real.",
      },
      { property: "og:title", content: "Sua dieta do dia — NATIVO" },
      {
        property: "og:description",
        content: "Plano alimentar simples, com comida de verdade e sem contagem obsessiva.",
      },
    ],
  }),
  component: DietaPage,
});

function DietaPage() {
  const [meals, setMeals] = useState(dietPlan);
  const [template, setTemplate] = useState(dietTemplates[0]?.id ?? "");
  const [novaRefeicao, setNovaRefeicao] = useState("");

  const feitas = meals.filter((m) => m.done).length;
  const kcal = meals.filter((m) => m.done).reduce((s, m) => s + m.kcal, 0);
  const kcalTotal = meals.reduce((s, m) => s + m.kcal, 0);

  return (
    <AppShell>
      <PageTitle
        title="Sua dieta"
        subtitle="Um plano de comida real para o dia. Ajuste como quiser — ele orienta, não controla."
      />

      <section className="surface-deep rise p-6">
        <p className="text-xs uppercase tracking-[0.24em] opacity-70">Plano de hoje</p>
        <p className="mt-3 font-display text-3xl font-semibold">
          {feitas}/{meals.length} refeições
        </p>
        <p className="mt-2 text-sm opacity-80">
          {kcal} de aproximadamente {kcalTotal} kcal registradas — referência, não meta.
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-700"
            style={{ width: `${(feitas / meals.length) * 100}%` }}
          />
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Refeições do dia</h2>
        <ul className="mt-4 space-y-2">
          {meals.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() =>
                  setMeals((prev) =>
                    prev.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)),
                  )
                }
                className="flex w-full items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-4 text-left transition-colors hover:border-leaf"
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    m.done ? "border-success bg-success" : "border-border"
                  }`}
                >
                  {m.done ? <Check className="size-3 text-primary-foreground" strokeWidth={3} /> : null}
                </span>
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {m.time} · {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.kcal} kcal</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {m.items.join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <input
            value={novaRefeicao}
            onChange={(e) => setNovaRefeicao(e.target.value)}
            placeholder="Adicionar refeição (ex.: iogurte com fruta)"
            className="flex-1 rounded-full border border-input bg-background/70 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
          />
          <button
            type="button"
            onClick={() => {
              if (!novaRefeicao.trim()) return;
              setMeals((prev) => [
                ...prev,
                {
                  id: `n${prev.length + 1}`,
                  time: "Livre",
                  name: novaRefeicao.trim(),
                  items: ["Adicionado por você"],
                  kcal: 200,
                  done: false,
                },
              ]);
              setNovaRefeicao("");
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <UtensilsCrossed className="size-5 text-leaf" strokeWidth={1.6} />
          Montar uma dieta
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha um modelo de base. Você pode ajustar as refeições depois.
        </p>
        <div className="mt-4 space-y-2">
          {dietTemplates.map((t) => {
            const ativo = t.id === template;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  ativo ? "border-leaf bg-leaf/10" : "border-border/70 bg-background/50 hover:border-leaf"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.meals} refeições</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {t.detail}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 font-editorial text-sm text-accent">
          "Comida real na maior parte do tempo já muda o seu dia."
        </p>
      </section>
    </AppShell>
  );
}
