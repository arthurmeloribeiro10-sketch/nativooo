import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Leaf, Loader2, Plus, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { useAuth } from "@/lib/auth-context";
import { generateJungleDiet } from "@/lib/diet-ai.functions";
import { useMealMutations, useMeals } from "@/lib/nativo-queries";

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

const templates = [
  {
    id: "t1",
    name: "Comida real clássica",
    detail: "Proteína, vegetais e carboidrato natural em 4 refeições.",
    meals: [
      {
        time_label: "07h30",
        name: "Café da manhã",
        items: ["3 ovos caipiras", "Meio abacate", "Café sem açúcar"],
        kcal: 480,
      },
      {
        time_label: "12h30",
        name: "Almoço",
        items: ["Carne de pasto", "Arroz e feijão", "Salada com azeite"],
        kcal: 720,
      },
      { time_label: "16h00", name: "Lanche", items: ["Fruta da estação", "Castanhas"], kcal: 260 },
      {
        time_label: "20h00",
        name: "Jantar",
        items: ["Peixe assado", "Legumes na manteiga", "Batata-doce"],
        kcal: 610,
      },
    ],
  },
  {
    id: "t2",
    name: "Janela de 8 horas",
    detail: "Jejum leve das 20h às 12h, com 3 refeições densas.",
    meals: [
      {
        time_label: "12h00",
        name: "Primeira refeição",
        items: ["Ovos", "Legumes", "Arroz"],
        kcal: 700,
      },
      { time_label: "16h00", name: "Lanche", items: ["Iogurte natural", "Fruta"], kcal: 320 },
      {
        time_label: "19h30",
        name: "Jantar",
        items: ["Carne", "Salada", "Raízes"],
        kcal: 700,
      },
    ],
  },
  {
    id: "t3",
    name: "Treino pela manhã",
    detail: "Mais carboidrato natural no pós-treino e jantar mais leve.",
    meals: [
      { time_label: "06h30", name: "Pré-treino", items: ["Banana", "Café"], kcal: 180 },
      {
        time_label: "09h00",
        name: "Pós-treino",
        items: ["Ovos", "Batata-doce", "Fruta"],
        kcal: 620,
      },
      { time_label: "13h00", name: "Almoço", items: ["Carne", "Arroz", "Salada"], kcal: 720 },
      { time_label: "16h30", name: "Lanche", items: ["Castanhas", "Queijo"], kcal: 280 },
      { time_label: "20h00", name: "Jantar leve", items: ["Sopa de legumes", "Frango"], kcal: 420 },
    ],
  },
];

function DietaPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const meals = useMeals(userId);
  const { toggle, add, remove, replaceWithTemplate } = useMealMutations(userId);
  const [novaRefeicao, setNovaRefeicao] = useState("");

  const montarDieta = useServerFn(generateJungleDiet);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [gerando, setGerando] = useState(false);
  const [resumoIa, setResumoIa] = useState<string | null>(null);
  const [conquista, setConquista] = useState(false);

  async function gerarDieta() {
    const weightKg = Number(peso.replace(",", "."));
    const heightCm = Number(altura.replace(",", "."));
    if (!weightKg || !heightCm) {
      toast.error("Preencha seu peso e sua altura para a IA montar o plano.");
      return;
    }
    setGerando(true);
    try {
      const plano = await montarDieta({
        data: {
          weightKg,
          heightCm,
          ...(objetivo.trim() ? { goal: objetivo.trim() } : {}),
        },
      });
      await replaceWithTemplate.mutateAsync(plano.meals);
      setResumoIa(plano.summary);
      setConquista(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui montar a dieta agora.");
    } finally {
      setGerando(false);
    }
  }

  const list = meals.data ?? [];
  const feitas = list.filter((m) => m.done).length;
  const kcal = list.filter((m) => m.done).reduce((s, m) => s + m.kcal, 0);
  const kcalTotal = list.reduce((s, m) => s + m.kcal, 0);

  return (
    <AppShell>
      <PageTitle
        title="Sua dieta"
        subtitle="Um plano de comida real para o dia. Ajuste como quiser — ele orienta, não controla."
      />

      <section className="surface-deep rise p-6">
        <p className="text-xs uppercase tracking-[0.24em] opacity-70">Plano de hoje</p>
        <p className="mt-3 font-display text-3xl font-semibold">
          {feitas}/{list.length} refeições
        </p>
        <p className="mt-2 text-sm opacity-80">
          {kcal} de aproximadamente {kcalTotal} kcal registradas — referência, não meta.
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-700"
            style={{ width: `${list.length ? (feitas / list.length) * 100 : 0}%` }}
          />
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-gold" strokeWidth={1.6} />
          Montar dieta com IA
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Diga seu peso e sua altura. A IA monta um dia inteiro de comida real, pró-metabólica, com
          horários, e já coloca tudo nas suas refeições de hoje.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            Peso (kg)
            <input
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="78"
              className="mt-1 w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-sm text-foreground outline-none focus:border-leaf"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Altura (cm)
            <input
              inputMode="decimal"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="180"
              className="mt-1 w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-sm text-foreground outline-none focus:border-leaf"
            />
          </label>
        </div>
        <input
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          placeholder="Objetivo (opcional): mais energia, emagrecer, ganhar massa"
          className="mt-2 w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
        />
        <button
          type="button"
          disabled={gerando}
          onClick={() => void gerarDieta()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {gerando ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Montando sua dieta…
            </>
          ) : (
            <>
              <Leaf className="size-4" strokeWidth={1.8} />
              Montar dieta
            </>
          )}
        </button>
        {resumoIa ? (
          <p className="rise mt-4 rounded-2xl border border-leaf/40 bg-leaf/10 p-4 text-xs leading-relaxed text-foreground">
            {resumoIa}
          </p>
        ) : null}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Refeições do dia</h2>
        {meals.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {list.map((m) => (
              <li key={m.id} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => toggle.mutate({ id: m.id, done: !m.done })}
                  className="flex flex-1 items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-4 text-left transition-colors hover:border-leaf"
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      m.done ? "border-success bg-success" : "border-border"
                    }`}
                  >
                    {m.done ? (
                      <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {m.time_label} · {m.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.kcal} kcal</span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {m.items.length ? m.items.join(" · ") : (m.note ?? "Adicionado por você")}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remover ${m.name}`}
                  onClick={() => remove.mutate(m.id)}
                  className="mt-3 text-muted-foreground transition-colors hover:text-terracotta"
                >
                  <Trash2 className="size-4" strokeWidth={1.6} />
                </button>
              </li>
            ))}
          </ul>
        )}

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
              add.mutate(
                { name: novaRefeicao.trim(), kcal: 200, note: "Adicionado por você" },
                { onSuccess: () => setNovaRefeicao("") },
              );
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
          Escolha um modelo para substituir o plano de hoje. Você pode ajustar as refeições depois.
        </p>
        <div className="mt-4 space-y-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                replaceWithTemplate.mutate(t.meals, {
                  onSuccess: () => toast.success(`Plano "${t.name}" aplicado ao dia de hoje.`),
                })
              }
              className="w-full rounded-2xl border border-border/70 bg-background/50 p-4 text-left transition-colors hover:border-leaf"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.meals.length} refeições</span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {t.detail}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 font-editorial text-sm text-accent">
          "Comida real na maior parte do tempo já muda o seu dia."
        </p>
      </section>
      <AchievementBurst
        open={conquista}
        title="Sua dieta está pronta!"
        subtitle="Seu plano de comida real já está nas refeições de hoje."
        onDone={() => setConquista(false)}
      />
    </AppShell>
  );
}
