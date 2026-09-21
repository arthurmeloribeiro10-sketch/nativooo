import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Salad } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { ScoreRing } from "@/components/nativo/ScoreRing";
import { StreakBadge } from "@/components/nativo/StreakBadge";
import { CoinBalance } from "@/components/nativo/CoinBalance";
import { Challenge30Card } from "@/components/nativo/Challenge30Card";
import { DailyMissionCard } from "@/components/nativo/DailyMissionCard";
import { BodyRoutinePreview } from "@/components/nativo/BodyRoutinePreview";
import { WeeklyBarChart } from "@/components/nativo/WeeklyBarChart";
import { PillarCard } from "@/components/nativo/PillarCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { firstName } from "@/lib/format";
import { useSunIndex, uvLevel } from "@/lib/sun";
import { useWalletBalance, useCompleteChallengeDay } from "@/lib/gamification/queries";
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
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting(hour)}, {firstName(profile.data?.display_name)} 👋
          </p>
          <h1 className="mt-1 text-2xl">Continue construindo sua melhor versão.</h1>
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

      <section className="surface-deep rise flex items-center gap-4 p-5">
        <ScoreRing score={score} size={92} />
        <div>
          <p className="text-xs uppercase tracking-[0.12em] opacity-75">Seu progresso hoje</p>
          <p className="mt-1 font-editorial text-lg">
            {completed.length} de {list.length || "—"} hábitos concluídos
          </p>
        </div>
      </section>

      <section className="surface rise mt-5 overflow-hidden p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Próxima ação</p>
        <h2 className="mt-2 font-editorial text-xl text-foreground">{next.text}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{next.detail}</p>
        <Link
          to={next.href}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Concluir <ArrowRight className="size-4" />
        </Link>
      </section>

      <Challenge30Card
        completedDays={completedDays}
        todayDay={todayChallengeDay}
        pending={completeDay.isPending}
        onCompleteToday={handleCompleteDay}
      />

      <section className="surface mt-5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Missões do dia</h2>
          <span className="text-xs text-muted-foreground">
            {completed.length} concluídas · {pending.length} pendentes
          </span>
        </div>
        {missions.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {list.map((m) => (
              <li key={m.id}>
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

      <section className="surface mt-5 p-5">
        <h2 className="text-lg">Sua semana</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Percentual de missões concluídas em cada dia.
        </p>
        <div className="mt-5">
          <WeeklyBarChart data={week} />
        </div>
      </section>

      <section className="mt-5">
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

      <section className="mt-5">
        <Link to="/dieta" className="surface flex items-center justify-between p-4">
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
