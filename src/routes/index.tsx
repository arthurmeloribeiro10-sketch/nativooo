import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Flame, Salad, Sun } from "lucide-react";

import heroImage from "@/assets/nativo-hero.jpg";
import { AppShell } from "@/components/nativo/AppShell";
import { PillarBar } from "@/components/nativo/PillarBar";
import { ScoreRing } from "@/components/nativo/ScoreRing";
import { useAuth } from "@/lib/auth-context";
import {
  averageScore,
  computePillars,
  computeStreak,
  lastDays,
  useMeals,
  useMissions,
  useMissionsWeek,
  useProfile,
  useProtocol,
  useSleepWeek,
  useStepsWeek,
  useToggleMission,
  weekdayLabel,
} from "@/lib/nativo-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NATIVO — Seu estilo de vida em prática" },
      {
        name: "description",
        content:
          "O NATIVO transforma o lifestyle de creators em hábitos diários: Nativo Score, protocolos, missões e comunidade. Menos controle. Mais vida bem vivida.",
      },
      { property: "og:title", content: "NATIVO — Seu estilo de vida em prática" },
      {
        property: "og:description",
        content:
          "Hábitos, protocolos e evolução pessoal em um só lugar. Comece pelo protocolo de 30 dias do Nativo.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const userId = user?.id;

  const profile = useProfile(userId);
  const missions = useMissions(userId);
  const missionsWeek = useMissionsWeek(userId);
  const meals = useMeals(userId);
  const steps = useStepsWeek(userId);
  const sleep = useSleepWeek(userId);
  const protocol = useProtocol(userId);
  const toggleMission = useToggleMission(userId);

  const pillars = computePillars({
    meals: meals.data ?? [],
    missions: missions.data ?? [],
    steps: steps.data ?? [],
    sleep: sleep.data ?? [],
    protocolDays: protocol.data ?? [],
    stepGoal: profile.data?.step_goal ?? 10000,
  });
  const score = averageScore(pillars);
  const streak = computeStreak(missionsWeek.data ?? []);
  const list = missions.data ?? [];
  const doneCount = list.filter((m) => m.done).length;

  const week = lastDays(7).map((day) => {
    const dayMissions = (missionsWeek.data ?? []).filter((m) => m.day === day);
    const value = dayMissions.length
      ? Math.round((dayMissions.filter((m) => m.done).length / dayMissions.length) * 100)
      : 0;
    return { day, label: weekdayLabel(day), score: value };
  });

  const weakest = [...pillars].sort((a, b) => a.score - b.score)[0];

  return (
    <AppShell>
      <section className="rise surface-deep overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] opacity-70">
              Olá, {profile.data?.display_name ?? "Nativo"}
            </p>
            <h1 className="mt-3 font-editorial text-2xl leading-snug text-primary-foreground">
              Como você quer viver hoje?
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-80">
              {weakest
                ? `Seu ponto de atenção agora é ${weakest.label.toLowerCase()}. Uma ação simples já muda o dia.`
                : "Registre seu dia e veja seu score se atualizar."}
            </p>
          </div>
          <ScoreRing score={score} />
        </div>
        <img
          src={heroImage}
          alt="Mesa de madeira com comida de verdade sob luz da manhã"
          width={1600}
          height={1008}
          className="h-40 w-full object-cover sm:h-48"
        />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="surface flex items-center gap-3 p-4">
          <Flame className="size-5 text-terracotta" strokeWidth={1.6} />
          <div>
            <p className="font-display text-lg font-semibold">{streak} dias</p>
            <p className="text-xs text-muted-foreground">de sequência</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-4">
          <Sun className="size-5 text-gold" strokeWidth={1.6} />
          <div>
            <p className="font-display text-lg font-semibold">
              {doneCount}/{list.length}
            </p>
            <p className="text-xs text-muted-foreground">missões de hoje</p>
          </div>
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Missões do dia</h2>
          <span className="text-xs text-muted-foreground">Uma ação por vez</span>
        </div>
        {missions.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {list.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggleMission.mutate({ id: m.id, done: !m.done })}
                  className="flex w-full items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-3 text-left transition-colors hover:border-leaf"
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      m.done ? "border-success bg-success" : "border-border"
                    }`}
                  >
                    {m.done ? (
                      <svg viewBox="0 0 24 24" className="size-3 stroke-primary-foreground" fill="none">
                        <path d="M5 13l4 4L19 7" strokeWidth={3} strokeLinecap="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span>
                    <span
                      className={`block text-sm font-medium ${
                        m.done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {m.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{m.detail}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Seus pilares</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          O score orienta, não julga. Ele mostra onde vale colocar atenção.
        </p>
        <div className="mt-2 divide-y divide-border/60">
          {pillars.map((p) => (
            <PillarBar key={p.key} label={p.label} score={p.score} note={p.note} />
          ))}
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Evolução da semana</h2>
        <div className="mt-5 flex h-32 items-end gap-2">
          {week.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-leaf/80"
                style={{ height: `${Math.max(d.score, 2)}%` }}
                aria-label={`${d.label}: ${d.score}`}
              />
              <span className="text-[11px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 font-editorial text-sm text-accent">
          "Sua evolução acontece na consistência."
        </p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/registro"
          className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <Camera className="size-5 text-leaf" strokeWidth={1.6} />
            <span className="text-sm font-medium">Registrar refeição</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/dieta"
          className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <Salad className="size-5 text-leaf" strokeWidth={1.6} />
            <span className="text-sm font-medium">Ver sua dieta do dia</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/corpo"
          className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <Sun className="size-5 text-gold" strokeWidth={1.6} />
            <span className="text-sm font-medium">Sol, passos e sono</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/protocolo"
          className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-sm font-medium">
            Protocolo Nativo · {(protocol.data ?? []).length}/30 dias
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </section>
    </AppShell>
  );
}
