import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Salad } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { ScoreRing } from "@/components/nativo/ScoreRing";
import { StreakBadge } from "@/components/nativo/StreakBadge";
import { CoinBalance } from "@/components/nativo/CoinBalance";
import { Challenge30Card } from "@/components/nativo/Challenge30Card";
import { DailyMissionCard } from "@/components/nativo/DailyMissionCard";
import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { BodyRoutinePreview } from "@/components/nativo/BodyRoutinePreview";
import { WeeklyBarChart } from "@/components/nativo/WeeklyBarChart";
import { PillarCard } from "@/components/nativo/PillarCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { firstName } from "@/lib/format";
import { useSunIndex, uvLevel } from "@/lib/sun";
import { useWalletBalance, useCompleteChallengeDay } from "@/lib/gamification/queries";

/** Delay de entrada em cascata para as seções da Home — `.rise` lê `--stagger`. */
function stagger(index: number): React.CSSProperties {
  return { "--stagger": `${index * 70}ms` } as React.CSSProperties;
}
import {
  averageScore,
  computePillars,
  computePillarTrend,
  computeStreak,
  lastDays,
  today,
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
      { title: "APOLO — Hábitos naturais para hoje" },
      {
        name: "description",
        content: "Veja suas ações do dia, registre hábitos e acompanhe seu progresso no APOLO.",
      },
      { property: "og:title", content: "APOLO — Hábitos naturais para hoje" },
      {
        property: "og:description",
        content: "Alimentação, movimento, sono, ar livre e constância em ações simples.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function greeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

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
  const toggle = useToggleMission(userId);
  const wallet = useWalletBalance(userId);
  const completeDay = useCompleteChallengeDay(userId);
  const { place, sun } = useSunIndex();

  const pillars = computePillars({
    meals: meals.data ?? [],
    missions: missions.data ?? [],
    steps: steps.data ?? [],
    sleep: sleep.data ?? [],
    stepGoal: profile.data?.step_goal ?? 10000,
    mealGoal: profile.data?.meal_goal ?? 4,
  });
  const score = averageScore(pillars);
  const list = missions.data ?? [];
  const pending = list.filter((m) => m.status === "pending");
  const completed = list.filter((m) => m.status === "done");
  const streak = computeStreak(missionsWeek.data ?? []);
  const completedDays = protocol.data ?? [];
  const todayChallengeDay = Math.min(30, completedDays.length + 1);

  const dayJustCompleted = list.length > 0 && pending.length === 0;

  // Dispara a celebração só na TRANSIÇÃO de "tem pendente" pra "tudo feito"
  // durante a sessão — nunca ao simplesmente carregar um dia já concluído.
  const [showDayBurst, setShowDayBurst] = useState(false);
  const prevPendingCount = useRef(pending.length);
  useEffect(() => {
    if (prevPendingCount.current > 0 && pending.length === 0 && list.length > 0) {
      setShowDayBurst(true);
    }
    prevPendingCount.current = pending.length;
  }, [pending.length, list.length]);

  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      hour12: false,
      timeZone: profile.data?.timezone || undefined,
    }).format(new Date()),
  );
  const next = pending[0]
    ? { text: pending[0].title, detail: pending[0].detail, href: "/registro" as const }
    : (meals.data ?? []).length === 0
      ? {
          text: "Faça seu primeiro registro do dia",
          detail: "Uma refeição, um hábito — o que fizer sentido agora.",
          href: "/registro" as const,
        }
      : hour < 18
        ? {
            text: "Confira seus passos e o UV atual",
            detail: "Aproveite a luz do dia.",
            href: "/corpo" as const,
          }
        : {
            text: "Registre como foi seu sono",
            detail: "Fecha bem o dia de hoje.",
            href: "/corpo" as const,
          };

  const days7 = lastDays(7);
  const week = days7.map((day) => {
    const rows = (missionsWeek.data ?? []).filter((m) => m.day === day && m.status !== "pending");
    return {
      label: weekdayLabel(day),
      value: rows.length
        ? Math.round((rows.filter((m) => m.status === "done").length / rows.length) * 100)
        : null,
    };
  });

  const stepsToday = (steps.data ?? []).find((s) => s.day === today());
  const sleepLatest = [...(sleep.data ?? [])].sort((a, b) => b.day.localeCompare(a.day))[0];
  const guidance = sun.data ? uvLevel(sun.data.currentUv ?? sun.data.uvPeak) : null;

  const handleCompleteDay = () => {
    completeDay.mutate(todayChallengeDay, {
      onSuccess: (result) => {
        if (result.dayCompleted && result.coinsAwarded > 0) {
          toast.success(`Dia concluído ☀️ Você manteve sua sequência.`, {
            description: `+${result.coinsAwarded} moedas`,
          });
        } else if (result.dayCompleted) {
          toast.success("Dia concluído ☀️");
        }
      },
      onError: () => toast.error("Não foi possível concluir o dia. Tente novamente."),
    });
  };

  return (
    <AppShell>
      <AchievementBurst
        open={showDayBurst}
        title="Dia concluído ☀️"
        subtitle={`Você fechou as ${list.length} ações de hoje. Sequência de ${streak + 1} ${streak + 1 === 1 ? "dia" : "dias"}.`}
        onDone={() => setShowDayBurst(false)}
      />

      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting(hour)}, {firstName(profile.data?.display_name)} 👋
          </p>
          <h1 className="mt-1 text-2xl">
            {dayJustCompleted
              ? "Dia concluído ☀️"
              : completed.length > 0
                ? `Você já concluiu ${completed.length} de ${list.length} hoje.`
                : "Continue construindo sua melhor versão."}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StreakBadge days={streak} />
          <CoinBalance balance={wallet.data ?? 0} />
          <Avatar className="size-9">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
              {firstName(profile.data?.display_name).slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <section
        className={`rise flex items-center gap-4 p-5 ${dayJustCompleted ? "surface-solar" : "surface-deep"}`}
        style={stagger(0)}
      >
        <ScoreRing score={score} size={92} />
        <div>
          <p className="text-xs uppercase tracking-[0.12em] opacity-75">
            {dayJustCompleted ? "Dia completo" : "Seu progresso hoje"}
          </p>
          <p className="mt-1 font-editorial text-lg italic">
            {completed.length} de {list.length || "—"} hábitos concluídos
          </p>
        </div>
      </section>

      <section className="surface rise mt-5 overflow-hidden p-5" style={stagger(1)}>
        {dayJustCompleted ? (
          <>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Resumo do dia
            </p>
            <h2 className="mt-2 font-editorial text-xl italic text-foreground">
              Todas as ações de hoje, concluídas.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Constância importa mais que perfeição — volte amanhã para manter sua sequência.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Próxima ação
            </p>
            <h2 className="mt-2 font-editorial text-xl text-foreground">{next.text}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{next.detail}</p>
            {pending.length > 0 ? (
              <p className="mt-1 text-xs font-medium text-primary">
                Faltam {pending.length} {pending.length === 1 ? "ação" : "ações"} para fechar o
                dia.
              </p>
            ) : null}
            <Link
              to={next.href}
              className="lift mt-4 inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Concluir <ArrowRight className="size-4" />
            </Link>
          </>
        )}
      </section>

      <div style={stagger(2)}>
        <Challenge30Card
          completedDays={completedDays}
          todayDay={todayChallengeDay}
          pending={completeDay.isPending}
          onCompleteToday={handleCompleteDay}
        />
      </div>

      <section className="surface rise mt-5 p-5" style={stagger(3)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Missões do dia</h2>
          <span className="text-xs text-muted-foreground">
            {completed.length} concluídas · {pending.length} pendentes
          </span>
        </div>
        {list.length > 0 ? (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${(completed.length / list.length) * 100}%` }}
            />
          </div>
        ) : null}
        {missions.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {list.map((m, i) => (
              <li key={m.id} className="rise" style={stagger(i)}>
                <DailyMissionCard
                  title={m.title}
                  detail={m.detail}
                  done={m.status === "done"}
                  disabled={toggle.isPending}
                  onToggle={() =>
                    toggle.mutate(
                      { id: m.id, status: m.status === "done" ? "pending" : "done" },
                      {
                        onSuccess: () => {
                          if (m.status !== "done") toast.success("Missão concluída.");
                        },
                        onError: () => toast.error("Não foi possível salvar. Tente novamente."),
                      },
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <BodyRoutinePreview
        uv={sun.data?.currentUv ?? (place ? (sun.data?.uvPeak ?? null) : null)}
        uvPeakTime={guidance ? (sun.data?.currentTime?.slice(11, 16) ?? null) : null}
        steps={stepsToday?.steps ?? null}
        stepGoal={profile.data?.step_goal ?? 10000}
        sleepHours={sleepLatest?.hours ?? null}
        sleepQualityLabel={
          sleepLatest
            ? sleepLatest.quality >= 70
              ? "Boa recuperação"
              : "Recuperação parcial"
            : null
        }
      />

      <section className="surface rise mt-5 p-5" style={stagger(4)}>
        <h2 className="text-lg">Sua semana</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Percentual de missões concluídas em cada dia.
        </p>
        <div className="mt-5">
          <WeeklyBarChart data={week} />
        </div>
      </section>

      <section className="rise mt-5" style={stagger(5)}>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg">Seus pilares</h2>
        </div>
        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible">
          {pillars.map((p) => (
            <PillarCard
              key={p.key}
              pillarKey={p.key}
              label={p.label}
              score={p.score}
              href={p.href}
              trend={computePillarTrend({
                key: p.key,
                missions: missionsWeek.data ?? [],
                steps: steps.data ?? [],
                sleep: sleep.data ?? [],
                stepGoal: profile.data?.step_goal ?? 10000,
                days: days7,
              })}
            />
          ))}
        </div>
      </section>

      <section className="rise mt-5" style={stagger(6)}>
        <Link to="/dieta" className="lift surface flex items-center justify-between p-4">
          <span className="flex items-center gap-3">
            <Salad className="size-5 text-leaf" />
            Plano e refeições
          </span>
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </AppShell>
  );
}
