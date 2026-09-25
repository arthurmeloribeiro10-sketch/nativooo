import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AchievementBurst } from "@/components/nativo/AchievementBurst";
import { AppShell } from "@/components/nativo/AppShell";
import { HabitChips, type HabitChip } from "@/components/apolo/HabitChips";
import { MealComposer } from "@/components/apolo/MealComposer";
import { MealTimeline } from "@/components/apolo/MealTimeline";
import { NaturalDayCard } from "@/components/apolo/NaturalDayCard";
import { WeekStrip, type WeekDay } from "@/components/apolo/WeekStrip";
import { useAuth } from "@/lib/auth-context";
import {
  classifyMeal,
  naturalDaySummary,
  nextMealSlot,
  slotForHour,
  timeLabelNow,
  type MealSlot,
} from "@/lib/meals";
import { haptic, playNote } from "@/lib/sound";
import {
  today,
  useAddMission,
  useMealMutations,
  useMeals,
  useMealsWeek,
  useMissions,
  useMissionsWeek,
  useToggleMission,
  weekdayLabel,
} from "@/lib/nativo-queries";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Diário — Apolo" },
      {
        name: "description",
        content: "Registre refeições e hábitos em segundos. Sem contar caloria.",
      },
      { property: "og:title", content: "Diário — Apolo" },
      { property: "og:description", content: "O que entrou no seu dia?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegistroPage,
});

const HABITS: { label: string; pillar: string }[] = [
  { label: "Sol", pillar: "sol" },
  { label: "Caminhada", pillar: "movimento" },
  { label: "Hidratação", pillar: "habitos" },
  { label: "Treino", pillar: "movimento" },
  { label: "Ar livre", pillar: "sol" },
  { label: "Leitura", pillar: "presenca" },
  { label: "Respiração", pillar: "presenca" },
  { label: "Menos telas", pillar: "presenca" },
];

/** Segunda a domingo da semana que contém hoje. */
function currentWeek(todayStr: string): string[] {
  const base = new Date(`${todayStr}T12:00:00`);
  const weekday = (base.getDay() + 6) % 7; // 0 = segunda
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - weekday + i);
    return d.toLocaleDateString("en-CA");
  });
}

function RegistroPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const todayStr = today();
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const isToday = selectedDay === todayStr;

  const meals = useMeals(userId, selectedDay);
  const mealsWeek = useMealsWeek(userId);
  const missions = useMissions(userId);
  const missionsWeek = useMissionsWeek(userId);
  const { add, remove } = useMealMutations(userId);
  const addMission = useAddMission(userId);
  const toggleMission = useToggleMission(userId);

  const [presetSlot, setPresetSlot] = useState<MealSlot | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [celebration, setCelebration] = useState<string | null>(null);

  const week = useMemo<WeekDay[]>(() => {
    const days = currentWeek(todayStr);
    const withMeals = new Set((mealsWeek.data ?? []).map((m) => m.day));
    const withMissions = new Set(
      (missionsWeek.data ?? []).filter((m) => m.status === "done").map((m) => m.day),
    );
    return days.map((day) => ({
      day,
      label: weekdayLabel(day),
      num: Number(day.slice(8, 10)),
      isToday: day === todayStr,
      isFuture: day > todayStr,
      hasRecord: withMeals.has(day) || withMissions.has(day),
    }));
  }, [todayStr, mealsWeek.data, missionsWeek.data]);

  const list = meals.data ?? [];
  const summary = naturalDaySummary(list);
  const nextSlot = isToday ? nextMealSlot(list) : null;
  const now = new Date();
  const currentSlot = presetSlot ?? nextSlot ?? slotForHour(now.getHours() + now.getMinutes() / 60);

  const missionList = missions.data ?? [];
  const habits: HabitChip[] = HABITS.map((h) => ({
    ...h,
    active: missionList.find((m) => m.title === h.label)?.status === "done",
  }));

  function register(text: string) {
    const slot = currentSlot;
    const reading = classifyMeal(text);
    add.mutate(
      {
        name: slot.name,
        items: [text],
        time_label: isToday ? timeLabelNow() : slot.suggestedTime,
        done: true,
        note: "Registrado por você",
        day: selectedDay,
      },
      {
        onSuccess: () => {
          setPresetSlot(null);
          playNote(3);
          haptic(12);
          setCelebration(
            reading.tag === "real"
              ? "Comida de verdade. Isso conta no seu dia."
              : reading.tag === "processed"
                ? "Registrado, sem culpa. A próxima pode ser mais simples."
                : "Registrado. Cada refeição anotada ajuda a enxergar o dia.",
          );
        },
        onError: () => toast.error("Não foi possível registrar. Tente novamente."),
      },
    );
  }

  function toggleHabit(habit: HabitChip) {
    const existing = missionList.find((m) => m.title === habit.label);
    if (!habit.active) {
      playNote(5);
      haptic(10);
    }
    if (existing) {
      toggleMission.mutate(
        { id: existing.id, status: habit.active ? "pending" : "done" },
        { onError: () => toast.error("Não foi possível salvar o hábito.") },
      );
    } else {
      addMission.mutate(
        { title: habit.label, pillar: habit.pillar, status: "done" },
        { onError: () => toast.error("Não foi possível salvar o hábito.") },
      );
    }
  }

  const dayTitle = isToday
    ? "Hoje"
    : `${weekdayLabel(selectedDay)} ${Number(selectedDay.slice(8, 10))}`;

  return (
    <AppShell>
      <AchievementBurst
        open={celebration !== null}
        title="Refeição registrada"
        subtitle={celebration ?? ""}
        onDone={() => setCelebration(null)}
      />

      <div className="rise">
        <h1 className="text-[2.35rem] leading-[1.08]">O que entrou no seu dia?</h1>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Registrar leva segundos. Sem contar caloria.
        </p>
      </div>

      <WeekStrip
        days={week}
        selected={selectedDay}
        onSelect={(day) => {
          setSelectedDay(day);
          setPresetSlot(null);
        }}
      />

      <MealComposer
        slotName={currentSlot.name}
        busy={add.isPending}
        onRegister={register}
        focusToken={focusToken}
      />

      <NaturalDayCard summary={summary} />

      <MealTimeline
        title={dayTitle}
        meals={list}
        loading={meals.isLoading}
        nextSlot={nextSlot}
        onAddSlot={(slot) => {
          setPresetSlot(slot);
          setFocusToken((t) => t + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onRemove={(meal) =>
          remove.mutate(meal.id, {
            onSuccess: () => toast.success("Registro removido."),
            onError: () => toast.error("Não foi possível remover."),
          })
        }
      />

      {isToday ? (
        <HabitChips
          habits={habits}
          busy={toggleMission.isPending || addMission.isPending}
          onToggle={toggleHabit}
        />
      ) : null}
    </AppShell>
  );
}
