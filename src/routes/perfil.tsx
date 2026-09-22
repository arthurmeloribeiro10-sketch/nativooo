import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Award,
  ChevronRight,
  Flame,
  Leaf,
  Sparkles,
  Sun,
  Users,
  ClipboardList,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { LivingTree } from "@/components/nativo/LivingTree";
import { PillarBar } from "@/components/nativo/PillarBar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { plural } from "@/lib/format";
import { cardByKey, useCardCollection } from "@/lib/rituals";
import { playNote, setSoundEnabled, soundEnabled } from "@/lib/sound";
import { PILLAR_LEAF_COLOR, stageFor } from "@/lib/tree";
import {
  averageScore,
  computePillars,
  computeStreak,
  today,
  useMeals,
  useMissions,
  useMissionsHistory,
  useMissionsWeek,
  useProfile,
  useProtocol,
  useSleepWeek,
  useStepsWeek,
  useUpdateProfile,
} from "@/lib/nativo-queries";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seu perfil e evolução — APOLO" },
      {
        name: "description",
        content:
          "Histórico do Apolo Score, protocolo, sequência e evolução dos pilares do seu estilo de vida.",
      },
      { property: "og:title", content: "Seu perfil e evolução — APOLO" },
      {
        property: "og:description",
        content: "Menos controle ansioso. Mais vida bem vivida — acompanhe sua evolução real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const profile = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const missions = useMissions(userId);
  const missionsWeek = useMissionsWeek(userId);
  const meals = useMeals(userId);
  const steps = useStepsWeek(userId);
  const sleep = useSleepWeek(userId);
  const protocol = useProtocol(userId);
  const history = useMissionsHistory(userId);
  const collection = useCardCollection(userId);

  const [sound, setSound] = useState(true);
  useEffect(() => {
    setSound(soundEnabled());
  }, []);

  const [nome, setNome] = useState("");
  const [meta, setMeta] = useState("10000");
  const [metaRefeicoes, setMetaRefeicoes] = useState("4");
  const [nascimento, setNascimento] = useState("");
  const [sexoCalculo, setSexoCalculo] = useState<"" | "female" | "male">("");

  useEffect(() => {
    if (profile.data) {
      setNome(profile.data.display_name);
      setMeta(String(profile.data.step_goal));
      setMetaRefeicoes(String(profile.data.meal_goal));
      setNascimento(profile.data.birth_date ?? "");
      setSexoCalculo(profile.data.metabolic_sex ?? "");
    }
  }, [profile.data?.id]);

  const pillars = computePillars({
    meals: meals.data ?? [],
    missions: missions.data ?? [],
    steps: steps.data ?? [],
    sleep: sleep.data ?? [],
    stepGoal: profile.data?.step_goal ?? 10000,
    mealGoal: profile.data?.meal_goal ?? 4,
  });
  const score = averageScore(pillars);
  const streak = computeStreak(missionsWeek.data ?? []);
  const protocolDays = (protocol.data ?? []).length;

  const leaves = [
    ...(history.data ?? []).map((m) => ({ key: m.id, pillar: m.pillar, day: m.day })),
    ...(missions.data ?? [])
      .filter((m) => m.status === "done")
      .map((m) => ({ key: m.id, pillar: m.pillar, day: today() })),
  ];
  const tree = stageFor(leaves.length);
  const hour = new Date().getHours();
  const collectedCards = collection.keys
    .map((key) => cardByKey(key))
    .filter((card): card is NonNullable<typeof card> => card !== null);

  const conquistas = [
    { label: "Primeiros 7 dias", ok: protocolDays >= 7 },
    { label: "Comida real por 21 dias", ok: protocolDays >= 21 },
    { label: "Sol da manhã · 10 dias", ok: protocolDays >= 10 },
    { label: "Semana sem desistir", ok: streak >= 7 },
  ].filter((c) => c.ok);

  return (
    <AppShell>
      <PageTitle title={profile.data?.display_name ?? "Seu perfil"} subtitle={user?.email ?? ""} />

      <section className="surface grid grid-cols-3 divide-x divide-border/60 p-5 text-center">
        <div>
          <Leaf className="mx-auto size-5 text-leaf" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">{score ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground">Progresso registrado</p>
        </div>
        <div>
          <Flame className="mx-auto size-5 text-terracotta" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">{streak}</p>
          <p className="text-[11px] text-muted-foreground">Sequência</p>
        </div>
        <div>
          <Award className="mx-auto size-5 text-gold" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">{protocolDays}</p>
          <p className="text-[11px] text-muted-foreground">Dias de protocolo</p>
        </div>
      </section>

      <section className="surface mt-6 overflow-hidden">
        <div className="grid sm:grid-cols-[1fr_1.2fr]">
          <LivingTree
            className="block h-auto w-full"
            seed={userId ?? "apolo"}
            leaves={leaves}
            hour={hour}
          />
          <div className="flex flex-col justify-center gap-2 p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Sua árvore
            </p>
            <h2 className="text-xl">
              Nível {tree.stage.level} · {tree.stage.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {plural(leaves.length, "folha")} no total, uma para cada missão concluída.{" "}
              {tree.next
                ? tree.remaining === 1
                  ? `Falta 1 folha para virar ${tree.next.name}.`
                  : `Faltam ${tree.remaining} folhas para virar ${tree.next.name}.`
                : "Sua árvore chegou ao último estágio."}
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.round(tree.progress * 100)}%`,
                  background: "var(--gradient-solar)",
                }}
              />
            </div>
          </div>
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
        <h2 className="text-lg">Seus dados</h2>
        <label htmlFor="nome" className="mt-4 block text-sm font-medium">
          Como quer ser chamado
        </label>
        <input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-input bg-background/70 px-4 py-3 text-sm outline-none focus:border-leaf"
        />
        <label htmlFor="meta-refeicoes" className="mt-4 block text-sm font-medium">
          Quantidade planejada de refeições
        </label>
        <input
          id="meta-refeicoes"
          type="number"
          min={1}
          max={10}
          value={metaRefeicoes}
          onChange={(e) => setMetaRefeicoes(e.target.value)}
          className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label htmlFor="nascimento" className="block text-sm font-medium">
            Data de nascimento
            <input
              id="nascimento"
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
            />
          </label>
          <label htmlFor="sexo-calculo" className="block text-sm font-medium">
            Sexo usado no cálculo
            <select
              id="sexo-calculo"
              value={sexoCalculo}
              onChange={(e) => setSexoCalculo(e.target.value as "" | "female" | "male")}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
            >
              <option value="">Selecionar</option>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Esses dados são privados e usados somente para estimar sua necessidade energética.
        </p>
        <label htmlFor="meta" className="mt-4 block text-sm font-medium">
          Meta diária de passos
        </label>
        <input
          id="meta"
          type="number"
          min={1000}
          step={500}
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-input bg-background/70 px-4 py-3 text-sm outline-none focus:border-leaf"
        />
        <button
          type="button"
          onClick={() =>
            updateProfile.mutate(
              {
                display_name: nome.trim() || "Apolo",
                step_goal: Number(meta) || 10000,
                meal_goal: Number(metaRefeicoes) || 4,
                birth_date: nascimento || null,
                metabolic_sex: sexoCalculo || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              {
                onSuccess: () => toast.success("Perfil atualizado."),
                onError: () => toast.error("Não foi possível salvar suas metas. Tente novamente."),
              },
            )
          }
          className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Salvar alterações
        </button>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Conquistas</h2>
        {conquistas.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Suas conquistas aparecem conforme você avança no protocolo.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {conquistas.map((c) => (
              <span
                key={c.label}
                className="rounded-full border border-gold/50 bg-gold/15 px-4 py-2 font-medium text-foreground"
              >
                {c.label}
              </span>
            ))}
          </div>
        )}
        <p className="mt-5 font-editorial text-sm italic text-accent">
          "Menos controle. Mais consciência."
        </p>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-gold" strokeWidth={1.6} />
          Coleção de cartas
        </h2>
        {collectedCards.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Vire a carta do dia na tela Início para começar sua coleção.
          </p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {collectedCards.map((card) => {
              const accent = card.pillar
                ? (PILLAR_LEAF_COLOR[card.pillar] ?? "var(--primary)")
                : card.kind === "golden"
                  ? "var(--gold)"
                  : "var(--primary)";
              return (
                <div
                  key={card.key}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: `color-mix(in oklab, ${accent} 45%, var(--border))`,
                    background: `linear-gradient(165deg, color-mix(in oklab, ${accent} 14%, var(--card)), var(--card) 70%)`,
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {card.kind === "quote"
                      ? "Frase"
                      : card.kind === "mission"
                        ? "Missão bônus"
                        : card.kind === "focus"
                          ? "Foco"
                          : "Carta rara"}
                  </p>
                  <p className="mt-1 font-editorial text-sm italic leading-snug text-foreground">
                    {card.title}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Preferências</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-4">
          <span className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Volume2 className="size-5" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-sm font-medium">Sons e vibração</span>
              <span className="block text-xs text-muted-foreground">
                Uma nota a cada missão concluída e um acorde ao fechar o dia.
              </span>
            </span>
          </span>
          <Switch
            checked={sound}
            onCheckedChange={(checked) => {
              setSoundEnabled(checked);
              setSound(checked);
              if (checked) playNote(4);
            }}
            aria-label="Sons e vibração"
          />
        </label>
      </section>

      <section className="surface mt-6 divide-y divide-border/60 p-2">
        {[
          { to: "/corpo", label: "Corpo", detail: "Índice UV, passos e sono", icon: Sun },
          { to: "/comunidade", label: "Comunidade", detail: "Ranking e feed", icon: Users },
          {
            to: "/protocolo",
            label: "Protocolo",
            detail: "Sua jornada de 30 dias",
            icon: ClipboardList,
          },
        ].map(({ to, label, detail, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon className="size-5" strokeWidth={1.6} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{detail}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
