import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Salad } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { StreakBadge } from "@/components/nativo/StreakBadge";
import { CoinBalance } from "@/components/nativo/CoinBalance";
import { Challenge30Card } from "@/components/nativo/Challenge30Card";
import { DailyMissionCard } from "@/components/nativo/DailyMissionCard";
import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { BodyRoutinePreview } from "@/components/nativo/BodyRoutinePreview";
import { WeeklyBarChart } from "@/components/nativo/WeeklyBarChart";
import { PillarCard } from "@/components/nativo/PillarCard";
import { TreeHero } from "@/components/nativo/TreeHero";
import { DayOpenRitual } from "@/components/nativo/DayOpenRitual";
import { DayCloseRitual } from "@/components/nativo/DayCloseRitual";
import type { LeafDatum } from "@/components/nativo/LivingTree";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { firstName, plural } from "@/lib/format";
import { useSunIndex } from "@/lib/sun";
import { useWalletBalance, useCompleteChallengeDay } from "@/lib/gamification/queries";
import {
  cardByKey,
  drawCard,
  useCardCollection,
  useRitual,
  type Intention,
  type Mood,
} from "@/lib/rituals";
import { haptic, playChord, playFlip, playNote } from "@/lib/sound";
import {
  averageScore,
  computePillars,
  computePillarTrend,
  computeStreak,
  lastDays,
  today,
  useAddMission,
  useMeals,
  useMissions,
  useMissionsHistory,
  useMissionsWeek,
  useProfile,
  useProtocol,
  useSleepWeek,
  useStepsWeek,
  useToggleMission,
  weekdayLabel,
  type MissionRow,
} from "@/lib/nativo-queries";

/** Delay de entrada em cascata para as seções da Home — `.rise` lê `--stagger`. */
function stagger(index: number): React.CSSProperties {
  return { "--stagger": `${index * 70}ms` } as React.CSSProperties;
}

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

/** Hora e minuto locais no fuso do perfil (ou do navegador). */
function useLocalClock(timeZone: string | undefined) {
  const read = () => {
    const parts = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timeZone || undefined,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return { hour, minute };
  };
  const [clock, setClock] = useState(read);
  useEffect(() => {
    setClock(read());
    const timer = window.setInterval(() => setClock(read()), 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone]);
  return clock;
}

function Home() {
  const { user } = useAuth();
  const userId = user?.id;
  const todayStr = today();

  const profile = useProfile(userId);
  const missions = useMissions(userId);
  const missionsWeek = useMissionsWeek(userId);
  const history = useMissionsHistory(userId);
  const meals = useMeals(userId);
  const steps = useStepsWeek(userId);
  const sleep = useSleepWeek(userId);
  const protocol = useProtocol(userId);
  const toggle = useToggleMission(userId);
  const addMission = useAddMission(userId);
  const wallet = useWalletBalance(userId);
  const completeDay = useCompleteChallengeDay(userId);
  const { place, sun } = useSunIndex();
  const { ritual, update: updateRitual, ready: ritualReady } = useRitual(userId, todayStr);
  const collection = useCardCollection(userId);
  const { hour, minute } = useLocalClock(profile.data?.timezone);

  const name = firstName(profile.data?.display_name);
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
  const challengeDoneToday = completedDays.includes(todayChallengeDay);
  const allDone = list.length > 0 && pending.length === 0;
  const mealsDone = (meals.data ?? []).filter((m) => m.done).length;

  // Folhas: histórico (dias anteriores) + missões concluídas hoje, em ordem.
  const leaves = useMemo<LeafDatum[]>(
    () => [
      ...(history.data ?? []).map((m) => ({ key: m.id, pillar: m.pillar, day: m.day })),
      ...completed.map((m) => ({ key: m.id, pillar: m.pillar, day: todayStr })),
    ],
    [history.data, completed, todayStr],
  );
  const pillarsTouched = useMemo(
    () => Array.from(new Set(completed.map((m) => m.pillar))),
    [completed],
  );

  // Pilar mais fraco (com dado) — personaliza a carta de "foco".
  const weakestPillar =
    pillars
      .filter((p): p is typeof p & { score: number } => p.score !== null)
      .sort((a, b) => a.score - b.score)[0]?.key ?? null;
  const card = ritual.cardKey
    ? cardByKey(ritual.cardKey)
    : userId
      ? drawCard(userId, todayStr, weakestPillar)
      : null;

  const [openRitualOpen, setOpenRitualOpen] = useState(false);
  const [closeRitualOpen, setCloseRitualOpen] = useState(false);
  const [burst, setBurst] = useState<{ title: string; subtitle: string } | null>(null);

  // Celebração só na TRANSIÇÃO de "tem pendente" pra "tudo feito" nesta sessão.
  const prevPendingCount = useRef(pending.length);
  useEffect(() => {
    if (prevPendingCount.current > 0 && pending.length === 0 && list.length > 0) {
      setBurst({
        title: "Dia completo ☀️",
        subtitle: `Você fechou as ${list.length} ações de hoje. Agora é só colher: feche o dia quando quiser.`,
      });
    }
    prevPendingCount.current = pending.length;
  }, [pending.length, list.length]);

  const handleToggle = (m: MissionRow) => {
    const marking = m.status !== "done";
    if (marking) {
      playNote(completed.length);
      haptic(12);
    }
    toggle.mutate(
      { id: m.id, status: marking ? "done" : "pending" },
      { onError: () => toast.error("Não foi possível salvar. Tente novamente.") },
    );
  };

  const handleChooseIntention = (intention: Intention) => {
    if (!card) return;
    haptic(10);
    updateRitual({ intention, cardKey: card.key });
  };

  const handleReveal = () => {
    playFlip();
    haptic([8, 40, 14]);
    updateRitual({ cardRevealedAt: new Date().toISOString() });
  };

  const handleAcceptCard = () => {
    if (!card) return;
    const finish = () => {
      collection.add(card.key);
      updateRitual({ cardAccepted: true });
      setOpenRitualOpen(false);
      playNote(2);
      toast.success(
        card.kind === "golden"
          ? "Folha dourada ativada. A próxima missão concluída brilha na sua árvore."
          : card.mission
            ? "Missão bônus adicionada ao seu dia."
            : "Carta guardada na sua coleção.",
      );
    };
    if (card.mission && !list.some((m) => m.title === card.mission?.title)) {
      addMission.mutate(card.mission, {
        onSuccess: finish,
        onError: (error) => {
          // Título já existe hoje (índice único) — trata como aceito.
          if ((error as { code?: string }).code === "23505") finish();
          else toast.error("Não foi possível adicionar a missão. Tente de novo.");
        },
      });
    } else {
      finish();
    }
  };

  const handleChooseMood = (mood: Mood) => {
    haptic(10);
    updateRitual({ mood });
  };

  const handleCloseDay = () => {
    const finish = (coins: number) => {
      updateRitual({ closedAt: new Date().toISOString(), leavesAtClose: completed.length });
      setCloseRitualOpen(false);
      playChord();
      haptic([20, 60, 20, 60, 40]);
      setBurst({
        title: `Boa noite, ${name}`,
        subtitle:
          completed.length > 0
            ? `Sua árvore cresceu ${plural(completed.length, "folha")} hoje${coins > 0 ? ` e você ganhou ${coins} moedas` : ""}. Amanhã tem carta nova.`
            : "Amanhã tem carta nova e uma folha esperando por você.",
      });
    };
    if (allDone && !challengeDoneToday) {
      completeDay.mutate(todayChallengeDay, {
        onSuccess: (result) => finish(result.coinsAwarded),
        onError: () => toast.error("Não foi possível marcar o dia do desafio. Tente novamente."),
      });
    } else {
      finish(0);
    }
  };

  const scrollToMissions = () => {
    document.getElementById("missoes")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const stepsToday = (steps.data ?? []).find((s) => s.day === todayStr);
  const sleepLatest = [...(sleep.data ?? [])].sort((a, b) => b.day.localeCompare(a.day))[0];
  const uvNow = sun.data?.currentUv ?? (place ? (sun.data?.uvPeak ?? null) : null);

  return (
    <AppShell>
      <AchievementBurst
        open={burst !== null}
        title={burst?.title ?? ""}
        subtitle={burst?.subtitle ?? ""}
        onDone={() => setBurst(null)}
      />

      <DayOpenRitual
        open={openRitualOpen}
        onOpenChange={setOpenRitualOpen}
        name={name}
        intention={ritual.intention}
        card={card}
        revealed={Boolean(ritual.cardRevealedAt)}
        accepting={addMission.isPending}
        onChooseIntention={handleChooseIntention}
        onReveal={handleReveal}
        onAccept={handleAcceptCard}
      />

      <DayCloseRitual
        open={closeRitualOpen}
        onOpenChange={setCloseRitualOpen}
        name={name}
        leavesToday={completed.length}
        pillarsTouched={pillarsTouched}
        allDone={allDone}
        pending={pending.length}
        streak={streak}
        challengeDay={todayChallengeDay}
        challengeDone={challengeDoneToday}
        mood={ritual.mood}
        closing={completeDay.isPending}
        onChooseMood={handleChooseMood}
        onCloseDay={handleCloseDay}
      />

      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting(hour)}, {name} 👋
          </p>
          <h1 className="mt-1 text-2xl">
            {ritual.closedAt
              ? "Descanse. Você apareceu hoje."
              : ritual.intention
                ? `Hoje é dia de ${ritual.intention.toLowerCase()}.`
                : "Como você quer viver hoje?"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StreakBadge days={streak} />
          <CoinBalance balance={wallet.data ?? 0} />
          <Avatar className="size-9">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div style={stagger(0)}>
        <TreeHero
          seed={userId ?? "apolo"}
          leaves={leaves}
          leavesToday={completed.length}
          completed={completed.length}
          total={list.length}
          pending={pending.length}
          allDone={allDone}
          hasRecordToday={completed.length > 0 || mealsDone > 0}
          nextTitle={pending[0]?.title ?? null}
          hour={hour}
          minute={minute}
          uv={uvNow}
          score={score}
          ritual={ritual}
          ritualReady={ritualReady && !missions.isLoading}
          onOpenDay={() => setOpenRitualOpen(true)}
          onCloseDay={() => setCloseRitualOpen(true)}
          onGoToMissions={scrollToMissions}
        />
      </div>

      <div className="rise" style={stagger(1)}>
        <BodyRoutinePreview
          uv={uvNow}
          uvPeakTime={sun.data ? (sun.data.currentTime?.slice(11, 16) ?? null) : null}
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
      </div>

      <section id="missoes" className="surface rise mt-5 scroll-mt-24 p-5" style={stagger(2)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Missões do dia</h2>
          <span className="text-xs text-muted-foreground">
            {completed.length} concluídas · {pending.length} pendentes
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada missão concluída vira uma folha na sua árvore.
        </p>
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
                  onToggle={() => handleToggle(m)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={stagger(3)}>
        <Challenge30Card
          completedDays={completedDays}
          todayDay={todayChallengeDay}
          pending={completeDay.isPending}
          onCompleteToday={() => setCloseRitualOpen(true)}
          ctaLabel="Fechar o dia"
        />
      </div>

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
