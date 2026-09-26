import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { generateDietPlan, type DietMeal } from "@/lib/diet-ai.functions";
import { askRayPeatCoach } from "@/lib/diet-chat.functions";
import { plural } from "@/lib/format";
import { calculateEnergyTarget } from "@/lib/metabolic";
import {
  useDietPlans,
  useMealMutations,
  useMeals,
  useProfile,
  useUpdateProfile,
  type MealRow,
} from "@/lib/nativo-queries";

export const Route = createFileRoute("/dieta")({
  head: () => ({
    meta: [
      { title: "Plano alimentar e refeições — Apollo" },
      {
        name: "description",
        content: "Consulte, ajuste e registre refeições em seu plano alimentar no Apollo.",
      },
      { property: "og:title", content: "Plano alimentar e refeições — Apollo" },
      {
        property: "og:description",
        content: "Plano flexível, refeições registradas e apoio para escolhas de comida real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DietaPage,
});

const templates = [
  {
    id: "real",
    name: "Comida real em 4 momentos",
    detail: "Refeições simples, sem janela alimentar obrigatória.",
    meals: [
      {
        time_label: "07:30",
        name: "Café da manhã",
        items: ["Ovos", "Fruta", "Café com leite"],
        kcal: 0,
      },
      {
        time_label: "12:30",
        name: "Almoço",
        items: ["Proteína", "Arroz e feijão", "Legumes"],
        kcal: 0,
      },
      { time_label: "16:00", name: "Lanche", items: ["Iogurte natural", "Fruta"], kcal: 0 },
      {
        time_label: "20:00",
        name: "Jantar",
        items: ["Peixe ou carne", "Batata", "Legumes"],
        kcal: 0,
      },
    ],
  },
  {
    id: "window",
    name: "Janela alimentar de 8 horas",
    detail:
      "Opcional: refeições entre 12h e 20h. O período 20h–12h corresponde a 16 horas sem comer.",
    meals: [
      {
        time_label: "12:00",
        name: "Primeira refeição",
        items: ["Ovos", "Arroz", "Legumes"],
        kcal: 0,
      },
      { time_label: "16:00", name: "Lanche", items: ["Iogurte", "Fruta"], kcal: 0 },
      { time_label: "19:30", name: "Jantar", items: ["Carne", "Raízes", "Salada"], kcal: 0 },
    ],
  },
];

type Preview = {
  name: string;
  source: "ai" | "template";
  summary: string;
  meals: DietMeal[];
  preferences: Record<string, string | number | null>;
};

function DietaPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const meals = useMeals(userId);
  const plans = useDietPlans(userId);
  const profile = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const { toggle, add, remove, update, applyPlan } = useMealMutations(userId);
  const generate = useServerFn(generateDietPlan);
  const ask = useServerFn(askRayPeatCoach);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [mode, setMode] = useState<"ai" | "template">("ai");
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editing, setEditing] = useState<MealRow | null>(null);
  const [newMeal, setNewMeal] = useState("");
  const [achievement, setAchievement] = useState(false);
  const [form, setForm] = useState({
    goal: "",
    weight: "",
    height: "",
    birthDate: "",
    metabolicSex: "" as "" | "female" | "male",
    activity: "",
    preferences: "",
    restrictions: "",
    include: "",
    avoid: "",
    start: "",
    count: "4",
    prep: "",
  });
  const [generating, setGenerating] = useState(false);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [answering, setAnswering] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setForm((f) => ({
      ...f,
      goal: profile.data.diet_goal ?? "",
      weight: profile.data.weight_kg?.toString() ?? "",
      height: profile.data.height_cm?.toString() ?? "",
      birthDate: profile.data.birth_date ?? "",
      metabolicSex: profile.data.metabolic_sex ?? "",
      activity: profile.data.activity_level ?? "",
      preferences: profile.data.food_preferences ?? "",
      restrictions: profile.data.food_restrictions ?? "",
      include: profile.data.foods_include ?? "",
      avoid: profile.data.foods_avoid ?? "",
      start: profile.data.preferred_start_time?.slice(0, 5) ?? "",
      count: String(profile.data.meal_goal),
      prep: profile.data.prep_time ?? "",
    }));
  }, [profile.data?.id]);
  const list = meals.data ?? [];
  const activePlan = (plans.data ?? []).find((p) => p.active);
  const done = list.filter((m) => m.done);
  const planned = list.filter((m) => !m.done);
  const next = useMemo(
    () =>
      planned
        .filter((m) => /^\d{2}:?\d{2}/.test(m.time_label))
        .sort((a, b) => a.time_label.localeCompare(b.time_label))[0],
    [planned],
  );
  const estimatedTotal = list.filter((m) => m.kcal > 0).reduce((sum, m) => sum + m.kcal, 0);
  const hasEstimates = list.some((m) => m.kcal > 0);

  async function buildPlan() {
    const weightKg = Number(form.weight.replace(",", "."));
    const heightCm = Number(form.height.replace(",", "."));
    const mealCount = Number(form.count);
    if (
      !weightKg ||
      !heightCm ||
      !form.birthDate ||
      !form.metabolicSex ||
      !form.activity ||
      !mealCount
    ) {
      setAiError(
        "Complete peso, altura, nascimento, sexo para cálculo, atividade e quantidade de refeições.",
      );
      return;
    }
    setGenerating(true);
    setAiError(null);
    try {
      await updateProfile.mutateAsync({
        weight_kg: weightKg,
        height_cm: heightCm,
        birth_date: form.birthDate,
        metabolic_sex: form.metabolicSex,
        diet_goal: form.goal || null,
        activity_level: form.activity,
        food_preferences: form.preferences || null,
        food_restrictions: form.restrictions || null,
        foods_include: form.include || null,
        foods_avoid: form.avoid || null,
        preferred_start_time: form.start || null,
        meal_goal: mealCount,
        prep_time: form.prep || null,
      });
      const energy = calculateEnergyTarget({
        weightKg,
        heightCm,
        birthDate: form.birthDate,
        metabolicSex: form.metabolicSex,
        activityLevel: form.activity,
        goal: form.goal,
      });
      const result = await generate({
        data: {
          weightKg,
          heightCm,
          mealCount,
          goal: form.goal || undefined,
          activityLevel: form.activity,
          preferences: form.preferences || undefined,
          restrictions: form.restrictions || undefined,
          includeFoods: form.include || undefined,
          avoidFoods: form.avoid || undefined,
          startTime: form.start || undefined,
          prepTime: form.prep || undefined,
          notes:
            "Use quantidades aproximadas nos itens quando isso for necessário para estimar energia.",
        },
      });
      const prefs = {
        goal: form.goal,
        activity: form.activity,
        preferences: form.preferences,
        restrictions: form.restrictions,
        include: form.include,
        avoid: form.avoid,
        start: form.start,
        mealCount,
        prep: form.prep,
        targetKcal: energy.targetKcal,
        formula: energy.formula,
      };
      setPreview({
        name: "Plano personalizado",
        source: "ai",
        summary: `${result.summary} Meta estimada: ${energy.targetKcal.toLocaleString("pt-BR")} kcal/dia.`,
        meals: result.meals,
        preferences: prefs,
      });
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Não foi possível gerar o plano.");
    } finally {
      setGenerating(false);
    }
  }

  async function applyPreview() {
    if (!preview) return;
    try {
      await applyPlan.mutateAsync(preview);
      setPreview(null);
      setAdjustOpen(false);
      setAchievement(true);
      toast.success("Plano aplicado. Refeições já concluídas foram preservadas.");
    } catch {
      toast.error("O plano não foi aplicado. Seus dados anteriores permanecem iguais.");
    }
  }

  async function sendQuestion() {
    const text = question.trim();
    if (!text || answering) return;
    const history = [...chat, { role: "user" as const, content: text }];
    setChat(history);
    setQuestion("");
    setAnswering(true);
    try {
      const { reply } = await ask({ data: { messages: history.slice(-12) } });
      setChat([...history, { role: "assistant", content: reply }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível responder.");
    } finally {
      setAnswering(false);
    }
  }

  return (
    <AppShell>
      <PageTitle
        title="Sua dieta"
        subtitle="Consulte o plano, registre o que aconteceu e ajuste sem apagar seu histórico."
      />
      {activePlan || list.length ? (
        <>
          <section className="surface-deep p-5">
            <p className="text-xs uppercase tracking-[0.12em] opacity-75">Plano ativo</p>
            <h2 className="mt-2 text-2xl">{activePlan?.name ?? "Refeições de hoje"}</h2>
            <p className="mt-2 text-sm opacity-80">
              {activePlan?.summary ?? `${plural(list.length, "refeição", "refeições")} no dia.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <span>
                {done.length}/{list.length} realizadas
              </span>
              {hasEstimates ? (
                <span>{estimatedTotal.toLocaleString("pt-BR")} kcal estimadas no plano</span>
              ) : (
                <span>Sem estimativa calórica suficiente</span>
              )}
            </div>
            <p className="mt-2 text-[11px] opacity-70">
              Estimativas vêm das quantidades descritas no plano; registros sem quantidade não
              recebem número exato.
            </p>
          </section>
          {next ? (
            <section className="surface mt-5 border-leaf/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Próxima refeição planejada
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg">{next.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {next.time_label} · {next.items.join(" · ")}
                  </p>
                </div>
                <Button
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate(
                      { id: next.id, done: true },
                      { onSuccess: () => toast.success("Refeição realizada.") },
                    )
                  }
                >
                  <Check />
                  Concluir
                </Button>
              </div>
            </section>
          ) : null}
          <section className="surface mt-5 p-5">
            <h2 className="text-lg">Refeições do dia</h2>
            <ul className="mt-3 space-y-2">
              {list.map((meal) => (
                <li key={meal.id} className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="flex gap-3">
                    <button
                      aria-label={
                        meal.done ? `Desmarcar ${meal.name}` : `Marcar ${meal.name} como realizada`
                      }
                      onClick={() => toggle.mutate({ id: meal.id, done: !meal.done })}
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${meal.done ? "border-success bg-success" : "border-border"}`}
                    >
                      {meal.done ? <Check className="size-3" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${meal.done ? "line-through text-muted-foreground" : ""}`}
                        >
                          {meal.time_label} · {meal.name}
                        </p>
                        {meal.kcal > 0 ? (
                          <span className="text-[11px] text-muted-foreground">
                            ≈ {meal.kcal} kcal
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {meal.items.length ? meal.items.join(" · ") : (meal.note ?? "Sem detalhes")}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {meal.origin === "plan" ? "Prevista no plano" : "Registrada por você"}
                      </p>
                    </div>
                    <button
                      aria-label={`Editar ${meal.name}`}
                      onClick={() => setEditing(meal)}
                      className="rounded-lg p-2 text-muted-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label={`Excluir ${meal.name}`}
                      onClick={() =>
                        remove.mutate(meal.id, {
                          onError: () => toast.error("Não foi possível excluir."),
                        })
                      }
                      className="rounded-lg p-2 text-muted-foreground hover:text-terracotta"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <input
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value)}
                placeholder="Adicionar uma refeição"
                className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <Button
                onClick={() => {
                  const name = newMeal.trim();
                  if (!name) return;
                  add.mutate(
                    { name, kcal: 0, note: "Registrada por você" },
                    {
                      onSuccess: () => {
                        setNewMeal("");
                        toast.success("Refeição adicionada.");
                      },
                    },
                  );
                }}
              >
                <Plus />
                Adicionar
              </Button>
            </div>
          </section>
        </>
      ) : (
        <section className="surface-deep p-5">
          <h2 className="text-2xl">Crie seu primeiro plano</h2>
          <p className="mt-2 text-sm opacity-80">
            Personalize com IA ou escolha um modelo. Você verá uma prévia antes de aplicar.
          </p>
          <Button
            className="mt-4 bg-primary-foreground text-primary"
            onClick={() => setAdjustOpen(true)}
          >
            <Sparkles />
            Montar meu plano
          </Button>
        </section>
      )}

      <section className="surface mt-5 p-5">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setAdjustOpen((v) => !v)}
        >
          <span>
            <span className="block text-lg font-semibold">
              {activePlan ? "Ajustar meu plano" : "Montar meu plano"}
            </span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Personalizar com IA ou escolher um modelo.
            </span>
          </span>
          <ChevronDown
            className={`size-5 transition-transform ${adjustOpen ? "rotate-180" : ""}`}
          />
        </button>
        {adjustOpen ? (
          <div className="mt-5">
            <div className="grid grid-cols-2 rounded-lg bg-secondary p-1">
              <button
                onClick={() => setMode("ai")}
                className={`rounded-md px-3 py-2 text-sm ${mode === "ai" ? "bg-card font-semibold" : "text-muted-foreground"}`}
              >
                Personalizar com IA
              </button>
              <button
                onClick={() => setMode("template")}
                className={`rounded-md px-3 py-2 text-sm ${mode === "template" ? "bg-card font-semibold" : "text-muted-foreground"}`}
              >
                Escolher modelo
              </button>
            </div>
            {mode === "template" ? (
              <div className="mt-4 space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() =>
                      setPreview({
                        name: template.name,
                        source: "template",
                        summary: template.detail,
                        meals: template.meals,
                        preferences: {},
                      })
                    }
                    className="w-full rounded-lg border border-border p-4 text-left"
                  >
                    <span className="text-sm font-semibold">{template.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {template.detail}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Etapa {step} de 3</p>
                {step === 1 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Objetivo">
                      <input
                        value={form.goal}
                        onChange={(e) => setForm({ ...form, goal: e.target.value })}
                      />
                    </Field>
                    <Field label="Nível de atividade">
                      <select
                        value={form.activity}
                        onChange={(e) => setForm({ ...form, activity: e.target.value })}
                      >
                        <option value="">Selecionar</option>
                        <option value="sedentario">Sedentário</option>
                        <option value="leve">Leve</option>
                        <option value="moderado">Moderado</option>
                        <option value="alto">Alto</option>
                        <option value="muito_alto">Muito alto</option>
                      </select>
                    </Field>
                    <Field label="Peso (kg)">
                      <input
                        inputMode="decimal"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      />
                    </Field>
                    <Field label="Altura (cm)">
                      <input
                        inputMode="decimal"
                        value={form.height}
                        onChange={(e) => setForm({ ...form, height: e.target.value })}
                      />
                    </Field>
                    <Field label="Data de nascimento">
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      />
                    </Field>
                    <Field label="Sexo usado no cálculo">
                      <select
                        value={form.metabolicSex}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            metabolicSex: e.target.value as "" | "female" | "male",
                          })
                        }
                      >
                        <option value="">Selecionar</option>
                        <option value="female">Feminino</option>
                        <option value="male">Masculino</option>
                      </select>
                    </Field>
                  </div>
                ) : step === 2 ? (
                  <div className="mt-3 grid gap-3">
                    <Field label="Preferências alimentares">
                      <textarea
                        rows={2}
                        value={form.preferences}
                        onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                      />
                    </Field>
                    <Field label="Restrições e intolerâncias">
                      <textarea
                        rows={2}
                        value={form.restrictions}
                        onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Quero incluir">
                        <input
                          value={form.include}
                          onChange={(e) => setForm({ ...form, include: e.target.value })}
                        />
                      </Field>
                      <Field label="Quero evitar">
                        <input
                          value={form.avoid}
                          onChange={(e) => setForm({ ...form, avoid: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Primeira refeição">
                      <input
                        type="time"
                        value={form.start}
                        onChange={(e) => setForm({ ...form, start: e.target.value })}
                      />
                    </Field>
                    <Field label="Quantidade de refeições">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.count}
                        onChange={(e) => setForm({ ...form, count: e.target.value })}
                      />
                    </Field>
                    <Field label="Tempo disponível para preparar">
                      <input
                        value={form.prep}
                        onChange={(e) => setForm({ ...form, prep: e.target.value })}
                      />
                    </Field>
                    <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                      Pró-metabólica significa, aqui, refeições regulares e alimentos de fácil
                      digestão inspirados nas ideias de Ray Peat. É uma preferência do plano, não
                      orientação médica geral.
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-between">
                  {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                      Voltar
                    </Button>
                  ) : (
                    <span />
                  )}
                  {step < 3 ? (
                    <Button onClick={() => setStep(step + 1)}>Continuar</Button>
                  ) : (
                    <Button disabled={generating} onClick={() => void buildPlan()}>
                      {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      {generating ? "Gerando…" : "Gerar prévia"}
                    </Button>
                  )}
                </div>
                {aiError ? (
                  <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                    <p className="text-sm">{aiError}</p>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="outline"
                      onClick={() => void buildPlan()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="surface mt-5 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <MessageCircle className="size-5 text-leaf" />
          Assistente para dúvidas
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Respostas sobre a abordagem pró-metabólica inspirada em Ray Peat. Não substitui avaliação
          profissional.
        </p>
        {chat.length ? (
          <ul className="mt-4 space-y-2">
            {chat.map((m, i) => (
              <li
                key={i}
                className={`rounded-lg border p-3 text-sm ${m.role === "assistant" ? "border-leaf/40 bg-leaf/10" : "border-border"}`}
              >
                <span className="mb-1 block text-[10px] uppercase text-muted-foreground">
                  {m.role === "user" ? "Você" : "Apollo"}
                </span>
                {m.content}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendQuestion();
            }}
            placeholder="Digite sua dúvida"
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <Button
            size="icon"
            disabled={answering}
            onClick={() => void sendQuestion()}
            aria-label="Enviar dúvida"
          >
            {answering ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </div>
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 p-3 sm:items-center sm:justify-center">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-card p-5 shadow-lifted"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Prévia</p>
                <h2 id="preview-title" className="mt-1 text-xl">
                  {preview.name}
                </h2>
              </div>
              <button
                onClick={() => setPreview(null)}
                aria-label="Fechar prévia"
                className="rounded-lg p-2"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{preview.summary}</p>
            <div className="mt-4 rounded-lg border border-gold/50 bg-gold/10 p-3 text-xs">
              Ao confirmar, o plano atual será arquivado. Refeições já realizadas e registros
              anteriores serão preservados; apenas refeições planejadas e pendentes de hoje serão
              substituídas.
            </div>
            <ul className="mt-4 space-y-2">
              {preview.meals.map((meal, i) => (
                <li key={`${meal.time_label}-${i}`} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">
                    {meal.time_label} · {meal.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{meal.items.join(" · ")}</p>
                  {meal.kcal > 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ≈ {meal.kcal} kcal estimadas
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => setPreview(null)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={applyPlan.isPending}
                onClick={() => void applyPreview()}
              >
                {applyPlan.isPending ? "Aplicando…" : "Confirmar plano"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
      {editing ? (
        <MealEditor
          meal={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) =>
            update.mutate(
              { id: editing.id, patch },
              {
                onSuccess: () => {
                  setEditing(null);
                  toast.success("Refeição atualizada.");
                },
                onError: () => toast.error("Não foi possível atualizar."),
              },
            )
          }
        />
      ) : null}
      <AchievementBurst
        open={achievement}
        title="Plano atualizado!"
        subtitle="Seu histórico e refeições concluídas foram preservados."
        onDone={() => setAchievement(false)}
      />
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement<{ className?: string }>;
}) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      {children && (
        <span className="mt-1 block">
          {useMemo(
            () => ({
              ...children,
              props: {
                ...children.props,
                className:
                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
              },
            }),
            [children],
          )}
        </span>
      )}
    </label>
  );
}

function MealEditor({
  meal,
  onClose,
  onSave,
}: {
  meal: MealRow;
  onClose: () => void;
  onSave: (patch: Partial<MealRow>) => void;
}) {
  const [name, setName] = useState(meal.name);
  const [time, setTime] = useState(meal.time_label.replace("h", ":"));
  const [items, setItems] = useState(meal.items.join("\n"));
  const [kcal, setKcal] = useState(meal.kcal ? String(meal.kcal) : "");
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 p-3 sm:items-center sm:justify-center">
      <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-lg bg-card p-5">
        <div className="flex justify-between">
          <h2 className="text-lg">Editar refeição</h2>
          <button onClick={onClose} aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <Field label="Nome">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Horário">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Alimentos e quantidades, um por linha">
            <textarea rows={5} value={items} onChange={(e) => setItems(e.target.value)} />
          </Field>
          <Field label="Calorias estimadas (opcional)">
            <input type="number" min={0} value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              onSave({
                name: name.trim() || meal.name,
                time_label: time || "Livre",
                items: items
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
                kcal: kcal ? Number(kcal) : 0,
                kcal_estimated: !!kcal,
              })
            }
          >
            Salvar
          </Button>
        </div>
      </section>
    </div>
  );
}
