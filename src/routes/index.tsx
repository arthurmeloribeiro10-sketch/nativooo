import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { AppShell } from "@/components/nativo/AppShell";
import { ApoloWordmark } from "@/components/apolo/ApoloMark";
import { ChallengeCard } from "@/components/apolo/ChallengeCard";
import { IntentionSheet } from "@/components/apolo/IntentionSheet";
import { MissionList } from "@/components/apolo/MissionList";
import { NextMissionCard } from "@/components/apolo/NextMissionCard";
import { StatTile, type StatTone } from "@/components/apolo/StatTile";
import { StreakChip } from "@/components/apolo/StreakChip";
import { SunHero } from "@/components/apolo/SunHero";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { firstName } from "@/lib/format";
import { useCompleteChallengeDay } from "@/lib/gamification/queries";
import { levelFor } from "@/lib/levels";
import { useRitual, type Intention } from "@/lib/rituals";
import { haptic, playChord, playNote } from "@/lib/sound";
import { uvLevel, useSunIndex } from "@/lib/sun";
import {
  challengeState,
  computeStreak,
  today,
  useMissions,
  useMissionsDoneCount,
  useMissionsWeek,
  useProfile,
  useProtocol,
  useSleepWeek,
  useStepsWeek,
  useToggleMission,
  type MissionRow,
} from "@/lib/nativo-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apolo — Seu dia" },
      {
        name: "description",
        content: "Suas missões, seu sol e seu desafio de 30 dias. Mais energia, sem neura.",
      },
      { property: "og:title", content: "Apolo — Seu dia" },
      { property: "og:description", content: "Mais energia, sem neura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function greeting(hour: number) {
  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function useLocalHour(timeZone: string | undefined) {
  const read = () => {
    const parts = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      hour12: false,
      timeZone: timeZone || undefined,
    }).formatToParts(new Date());
    return Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  };
  const [hour, setHour] = useState(read);
  useEffect(() => {
    setHour(read());
    const timer = window.setInterval(() => setHour(read()), 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone]);
  return hour;
}

function sunCaption(completed: number, total: number, loading: boolean) {
  if (loading) return "Preparando o seu dia…";
  if (total === 0) return "Seu dia está começando";
  if (completed === 0) return "Seu sol ainda vai nascer";
  if (completed >= total) return "Seu sol está alto";
  if (completed / total >= 0.6) return "Seu sol está subindo";
  return "Seu sol está nascendo";
}

function formatSleep(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

function uvTone(label: string): StatTone {
  if (label === "Baixo") return "success";
  if (label === "Moderado") return "gold";
  return "terracotta";
}

function Home() {
  const { user } = useAuth();
  const userId = user?.id;
  const todayStr = today();

  const profile = useProfile(userId);
  const missions = useMissions(userId);
  const missionsWeek = useMissionsWeek(userId);
  const doneCount = useMissionsDoneCount(userId);
  const steps = useStepsWeek(userId);
  const sleep = useSleepWeek(userId);
  const protocol = useProtocol(userId);
  const toggle = useToggleMission(userId);
  const completeDay = useCompleteChallengeDay(userId);
  const { place, sun } = useSunIndex();
  const { ritual, update: updateRitual } = useRitual(userId, todayStr);
  const hour = useLocalHour(profile.data?.timezone);

  const name = firstName(profile.data?.display_name);
  const list = missions.data ?? [];
  const pending = list.filter((m) => m.status === "pending");
  const completed = list.filter((m) => m.status === "done");
  const allDone = list.length > 0 && pending.length === 0;
  const streak = computeStreak(missionsWeek.data ?? []);
  const challenge = challengeState(protocol.data ?? [], profile.data?.timezone);
  const level = levelFor((doneCount.data ?? 0) + (doneCount.isFetched ? 0 : completed.length));

  // "Depois" empurra a missão para o fim da fila só nesta sessão.
  const [deferred, setDeferred] = useState<string[]>([]);
  const nextMission = useMemo<MissionRow | null>(() => {
    const fresh = pending.find((m) => !deferred.includes(m.id));
    return fresh ?? pending[0] ?? null;
  }, [pending, deferred]);

  const [intentionOpen, setIntentionOpen] = useState(false);
  const [burst, setBurst] = useState<{ title: string; subtitle: string } | null>(null);

  // Ao fechar todas as missões, o dia do desafio é marcado sozinho — uma vez por dia.
  const markedRef = useRef(false);
  useEffect(() => {
    if (!allDone || challenge.doneToday || challenge.finished || !protocol.isFetched) return;
    if (markedRef.current || completeDay.isPending) return;
    markedRef.current = true;
    completeDay.mutate(challenge.todayDay, {
      onSuccess: () => {
        playChord();
        haptic([20, 60, 20]);
        setBurst({
          title: "Dia completo ☀️",
          subtitle: `Você fechou as ${list.length} missões de hoje e marcou o dia ${challenge.todayDay} do Desafio Apolo.`,
        });
      },
      onError: () => {
        markedRef.current = false;
        toast.error("Não foi possível marcar o dia do desafio. Tente de novo mais tarde.");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, challenge.doneToday, challenge.finished, protocol.isFetched]);

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

  const handleDefer = () => {
    if (!nextMission) return;
    haptic(6);
    setDeferred((current) => [...current, nextMission.id]);
  };

  const handleChooseIntention = (intention: Intention) => {
    haptic(10);
    updateRitual({ intention });
    setIntentionOpen(false);
  };

  const stepsToday = (steps.data ?? []).find((s) => s.day === todayStr);
  const stepGoal = profile.data?.step_goal ?? 8000;
  const sleepLatest = [...(sleep.data ?? [])].sort((a, b) => b.day.localeCompare(a.day))[0];
  const uvNow = sun.data?.currentUv ?? (place ? (sun.data?.uvPeak ?? null) : null);
  const uv = uvNow === null ? null : uvLevel(uvNow);

  return (
    <AppShell>
      <AchievementBurst
        open={burst !== null}
        title={burst?.title ?? ""}
        subtitle={burst?.subtitle ?? ""}
        onDone={() => setBurst(null)}
      />
      <IntentionSheet
        open={intentionOpen}
        onOpenChange={setIntentionOpen}
        name={name}
        current={ritual.intention}
        onChoose={handleChooseIntention}
      />

      <header className="flex items-center justify-between">
        <ApoloWordmark />
        <div className="flex items-center gap-2.5">
          <StreakChip days={streak} />
          <Avatar className="size-11">
            <AvatarFallback className="bg-secondary font-display text-lg font-semibold text-primary">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="rise mt-7">
        <p className="text-[17px] text-muted-foreground">
          {greeting(hour)}, {name}
        </p>
        <button
          type="button"
          onClick={() => setIntentionOpen(true)}
          className="mt-1 block text-left"
          aria-label={
            ritual.intention
              ? `Intenção de hoje: ${ritual.intention}. Toque para trocar.`
              : "Escolher a intenção de hoje"
          }
        >
          <h1 className="text-[2.35rem] leading-[1.08]">
            {ritual.intention
              ? `Hoje é dia de ${ritual.intention.toLowerCase()}.`
              : "Como você quer viver hoje?"}
          </h1>
          {!ritual.intention ? (
            <span className="mt-1 block text-[13px] font-medium text-primary">
              Toque para escolher uma intenção
            </span>
          ) : null}
        </button>
      </div>

      <div className="mt-5">
        <SunHero
          levelLabel={`Nível ${level.current.level} · ${level.current.name}`}
          completed={completed.length}
          total={list.length}
          caption={sunCaption(completed.length, list.length, missions.isLoading)}
          loading={missions.isLoading}
        />
      </div>

      <NextMissionCard
        mission={nextMission}
        total={list.length}
        loading={missions.isLoading}
        busy={toggle.isPending}
        onComplete={() => nextMission && handleToggle(nextMission)}
        onDefer={handleDefer}
      />

      <div className="rise mt-4 flex gap-3" style={{ "--stagger": "140ms" } as React.CSSProperties}>
        <StatTile
          label="Índice UV"
          value={uvNow === null ? "—" : String(Math.round(uvNow))}
          detail={uv ? uv.label : place ? "Carregando" : "Ativar local"}
          tone={uv ? uvTone(uv.label) : "muted"}
        />
        <StatTile
          label="Passos"
          value={stepsToday ? stepsToday.steps.toLocaleString("pt-BR") : "—"}
          detail={stepsToday ? `de ${stepGoal.toLocaleString("pt-BR")}` : "Registrar"}
          tone={stepsToday && stepsToday.steps >= stepGoal ? "success" : "muted"}
        />
        <StatTile
          label="Sono"
          value={sleepLatest ? formatSleep(sleepLatest.hours) : "—"}
          detail={
            sleepLatest
              ? sleepLatest.quality >= 70
                ? "Bom"
                : sleepLatest.quality >= 45
                  ? "Regular"
                  : "Leve"
              : "Registrar"
          }
          tone={sleepLatest ? (sleepLatest.quality >= 70 ? "primary" : "gold") : "muted"}
        />
      </div>

      <MissionList
        missions={list}
        loading={missions.isLoading}
        busy={toggle.isPending}
        onToggle={handleToggle}
      />

      <ChallengeCard
        completedCount={challenge.completedCount}
        todayDay={challenge.todayDay}
        doneToday={challenge.doneToday}
        allDone={allDone}
        pendingCount={pending.length}
      />
    </AppShell>
  );
}
