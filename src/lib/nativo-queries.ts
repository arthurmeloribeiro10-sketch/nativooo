import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { getCommunityFeed, getCommunityRanking } from "@/lib/community.functions";

export const DEFAULT_TZ = "America/Sao_Paulo";

export function browserTimeZone(): string {
  return typeof Intl === "undefined" ? DEFAULT_TZ : Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
}

export function today(timeZone = browserTimeZone()): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

export function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push(d.toLocaleDateString("en-CA", { timeZone: browserTimeZone() }));
  }
  return out;
}

export function weekdayLabel(day: string): string {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const d = new Date(`${day}T12:00:00`);
  return labels[d.getDay()] ?? "";
}

/* ---------- tipos ---------- */

export type MissionRow = {
  id: string;
  day: string;
  title: string;
  detail: string;
  pillar: string;
  done: boolean;
};

export type MealRow = {
  id: string;
  day: string;
  time_label: string;
  name: string;
  items: string[];
  kcal: number;
  done: boolean;
  note: string | null;
  plan_id: string | null;
  origin: string;
  kcal_estimated: boolean;
};

export type SleepRow = { id: string; day: string; hours: number; quality: number };
export type StepRow = { id: string; day: string; steps: number };
export type ProfileRow = {
  id: string;
  display_name: string;
  step_goal: number;
  meal_goal: number;
  timezone: string;
  weight_kg: number | null;
  height_cm: number | null;
  diet_goal: string | null;
  activity_level: string | null;
  food_preferences: string | null;
  food_restrictions: string | null;
  foods_include: string | null;
  foods_avoid: string | null;
  preferred_start_time: string | null;
  prep_time: string | null;
};

export type DietPlanRow = {
  id: string;
  name: string;
  source: string;
  summary: string | null;
  active: boolean;
  created_at: string;
};

/* ---------- sementes do dia ---------- */

const defaultMissions = [
  {
    title: "Tempo ao ar livre pela manhã",
    detail: "Aproveite a luz natural e consulte o índice UV para escolher proteção adequada.",
    pillar: "sol",
  },
  {
    title: "Uma refeição só com comida de verdade",
    detail: "Proteína, vegetal e um carboidrato natural.",
    pillar: "alimentacao",
  },
  {
    title: "30 minutos sem celular após o jantar",
    detail: "Deixe o aparelho em outro cômodo.",
    pillar: "presenca",
  },
  {
    title: "Caminhada de 20 minutos",
    detail: "Uma caminhada curta já conta.",
    pillar: "movimento",
  },
];

/* ---------- perfil ---------- */

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRow> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, step_goal, meal_goal, timezone, weight_kg, height_cm, diet_goal, activity_level, food_preferences, food_restrictions, foods_include, foods_avoid, preferred_start_time, prep_time")
        .eq("id", userId ?? "")
        .maybeSingle();
      if (error) throw error;
      if (data) return data as ProfileRow;
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .upsert({ id: userId ?? "", timezone: browserTimeZone() }, { onConflict: "id" })
        .select("id, display_name, step_goal, meal_goal, timezone, weight_kg, height_cm, diet_goal, activity_level, food_preferences, food_restrictions, foods_include, foods_avoid, preferred_start_time, prep_time")
        .single();
      if (insertError) throw insertError;
      return created as ProfileRow;
    },
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<ProfileRow, "id">>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId ?? "");
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

/* ---------- missões ---------- */

export function useMissions(userId: string | undefined) {
  return useQuery({
    queryKey: ["missions", userId, today()],
    enabled: !!userId,
    queryFn: async (): Promise<MissionRow[]> => {
      const day = today();
      const { data, error } = await supabase
        .from("missions")
        .select("id, day, title, detail, pillar, done")
        .eq("user_id", userId ?? "")
        .eq("day", day)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data as MissionRow[];

      const { data: seeded, error: seedError } = await supabase
        .from("missions")
        .upsert(defaultMissions.map((m) => ({ ...m, user_id: userId ?? "", day })), { onConflict: "user_id,day,title", ignoreDuplicates: true })
        .select("id, day, title, detail, pillar, done");
      if (seedError) throw seedError;
      return (seeded ?? []) as MissionRow[];
    },
  });
}

export function useToggleMission(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("missions").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, done }) => {
      const key = ["missions", userId, today()];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MissionRow[]>(key);
      qc.setQueryData<MissionRow[]>(key, (old) => old?.map((m) => (m.id === id ? { ...m, done } : m)));
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["missions", userId, today()] });
      qc.invalidateQueries({ queryKey: ["missions-week", userId] });
    },
  });
}

export function useAddMission(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mission: { title: string; detail?: string; pillar?: string; done?: boolean }) => {
      const { error } = await supabase.from("missions").insert({
        user_id: userId!,
        day: today(),
        title: mission.title,
        detail: mission.detail ?? "",
        pillar: mission.pillar ?? "habitos",
        done: mission.done ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missions", userId, today()] });
      qc.invalidateQueries({ queryKey: ["missions-week", userId] });
    },
  });
}

export function useDeleteMission(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missions", userId, today()] });
      qc.invalidateQueries({ queryKey: ["missions-week", userId] });
    },
  });
}

export function useMissionsWeek(userId: string | undefined) {
  return useQuery({
    queryKey: ["missions-week", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MissionRow[]> => {
      const days = lastDays(7);
      const { data, error } = await supabase
        .from("missions")
        .select("id, day, title, detail, pillar, done")
        .eq("user_id", userId ?? "")
        .gte("day", days[0]!)
        .lte("day", days[days.length - 1]!);
      if (error) throw error;
      return (data ?? []) as MissionRow[];
    },
  });
}

/* ---------- refeições ---------- */

export function useMeals(userId: string | undefined) {
  return useQuery({
    queryKey: ["meals", userId, today()],
    enabled: !!userId,
    queryFn: async (): Promise<MealRow[]> => {
      const day = today();
      const { data, error } = await supabase
        .from("meals")
        .select("id, day, time_label, name, items, kcal, done, note, plan_id, origin, kcal_estimated")
        .eq("user_id", userId ?? "")
        .eq("day", day)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MealRow[];
    },
  });
}

export function useMealMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["meals", userId, today()] });

  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("meals").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["missions", userId, today()] });
    },
  });

  const add = useMutation({
    mutationFn: async (meal: {
      name: string;
      items?: string[];
      kcal?: number;
      time_label?: string;
      done?: boolean;
      note?: string;
    }) => {
      const { error } = await supabase.from("meals").insert({
        user_id: userId ?? "",
        day: today(),
        name: meal.name,
        items: meal.items ?? [],
        kcal: meal.kcal ?? 0,
        time_label: meal.time_label ?? "Livre",
        done: meal.done ?? false,
        note: meal.note ?? null,
        origin: "manual",
        kcal_estimated: meal.kcal !== undefined && meal.kcal > 0,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<MealRow, "name" | "items" | "time_label" | "kcal" | "kcal_estimated">> }) => {
      const { error } = await supabase.from("meals").update(patch).eq("id", id).eq("user_id", userId ?? "");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const repeat = useMutation({
    mutationFn: async (meal: MealRow) => {
      const { error } = await supabase.from("meals").insert({
        user_id: userId ?? "", day: today(), name: meal.name, items: meal.items,
        time_label: "Livre", kcal: meal.kcal, kcal_estimated: meal.kcal_estimated,
        note: "Repetida de um registro recente", origin: "manual", done: true,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const applyPlan = useMutation({
    mutationFn: async (plan: { name: string; source: "ai" | "template" | "manual"; summary?: string; preferences?: Record<string, string | number | null>; meals: { time_label: string; name: string; items: string[]; kcal: number }[] }) => {
      const { error } = await supabase.rpc("apply_diet_plan", {
        _name: plan.name, _source: plan.source, _summary: plan.summary ?? "",
        _preferences: plan.preferences ?? {}, _meals: plan.meals, _day: today(),
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ["diet-plans", userId] }); },
  });

  return { toggle, add, remove, update, repeat, applyPlan };
}

export function useDietPlans(userId: string | undefined) {
  return useQuery({
    queryKey: ["diet-plans", userId], enabled: !!userId,
    queryFn: async (): Promise<DietPlanRow[]> => {
      const { data, error } = await supabase.from("diet_plans")
        .select("id, name, source, summary, active, created_at")
        .eq("user_id", userId ?? "").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRecentMeals(userId: string | undefined) {
  return useQuery({
    queryKey: ["recent-meals", userId], enabled: !!userId,
    queryFn: async (): Promise<MealRow[]> => {
      const { data, error } = await supabase.from("meals")
        .select("id, day, time_label, name, items, kcal, done, note, plan_id, origin, kcal_estimated")
        .eq("user_id", userId ?? "").eq("done", true).lt("day", today())
        .order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ---------- sono ---------- */

export function useSleepWeek(userId: string | undefined) {
  return useQuery({
    queryKey: ["sleep", userId],
    enabled: !!userId,
    queryFn: async (): Promise<SleepRow[]> => {
      const days = lastDays(7);
      const { data, error } = await supabase
        .from("sleep_logs")
        .select("id, day, hours, quality")
        .eq("user_id", userId ?? "")
        .gte("day", days[0]!)
        .lte("day", days[days.length - 1]!)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, hours: Number(r.hours) })) as SleepRow[];
    },
  });
}

export function useSaveSleep(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ hours, quality }: { hours: number; quality: number }) => {
      const { error } = await supabase
        .from("sleep_logs")
        .upsert({ user_id: userId!, day: today(), hours, quality }, { onConflict: "user_id,day" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep", userId] }),
  });
}

/* ---------- passos ---------- */

export function useStepsWeek(userId: string | undefined) {
  return useQuery({
    queryKey: ["steps", userId],
    enabled: !!userId,
    queryFn: async (): Promise<StepRow[]> => {
      const days = lastDays(7);
      const { data, error } = await supabase
        .from("step_logs")
        .select("id, day, steps")
        .eq("user_id", userId ?? "")
        .gte("day", days[0]!)
        .lte("day", days[days.length - 1]!)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StepRow[];
    },
  });
}

export function useSaveSteps(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (steps: number) => {
      const { error } = await supabase
        .from("step_logs")
        .upsert({ user_id: userId!, day: today(), steps }, { onConflict: "user_id,day" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["steps", userId] }),
  });
}

/* ---------- protocolo ---------- */

export function useProtocol(userId: string | undefined) {
  return useQuery({
    queryKey: ["protocol", userId],
    enabled: !!userId,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from("protocol_progress")
        .select("day_number")
        .eq("user_id", userId ?? "")
        .order("day_number", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => r.day_number as number);
    },
  });
}

export function useToggleProtocolDay(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ day, done }: { day: number; done: boolean }) => {
      if (done) {
        const { error } = await supabase
          .from("protocol_progress")
          .insert({ user_id: userId!, day_number: day });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("protocol_progress")
          .delete()
          .eq("day_number", day)
          .eq("user_id", userId!);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocol", userId] }),
  });
}

/* ---------- comunidade ---------- */

export type PostView = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: string;
  reactions: number;
  reacted: boolean;
  image_url: string | null;
};

export function usePosts(userId: string | undefined) {
  const fetchCommunityFeed = useServerFn(getCommunityFeed);
  return useQuery({
    queryKey: ["posts", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PostView[]> => fetchCommunityFeed(),
  });
}

export function usePostMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["posts", userId] });

  const create = useMutation({
    mutationFn: async ({ body, file }: { body: string; file?: File | null }) => {
      let image_path: string | null = null;
      if (file) {
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("community-photos")
          .upload(path, file, { contentType: file.type || "image/jpeg" });
        if (upErr) throw upErr;
        image_path = path;
      }
      const { error } = await supabase
        .from("community_posts")
        .insert({ user_id: userId!, body, image_path });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });


  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const react = useMutation({
    mutationFn: async ({ postId, reacted }: { postId: string; reacted: boolean }) => {
      if (reacted) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: userId! });
        if (error && error.code !== "23505") throw error;
      }
    },
    onSuccess: invalidate,
  });

  return { create, remove, react };
}

export type RankingRow = {
  user_id: string;
  display_name: string;
  protocol_days: number;
  missions_done: number;
};

export function useRanking(userId: string | undefined) {
  const fetchCommunityRanking = useServerFn(getCommunityRanking);
  return useQuery({
    queryKey: ["ranking", userId],
    enabled: !!userId,
    queryFn: async (): Promise<RankingRow[]> => fetchCommunityRanking(),
  });
}

/* ---------- score ---------- */

export type PillarScore = { key: string; label: string; score: number | null; note: string; href: string };

export function computePillars(input: {
  meals: MealRow[];
  missions: MissionRow[];
  steps: StepRow[];
  sleep: SleepRow[];
  stepGoal: number;
  mealGoal: number;
}): PillarScore[] {
  const { meals, missions, steps, sleep, stepGoal, mealGoal } = input;
  const pct = (v: number) => Math.max(0, Math.min(100, Math.round(v * 100)));

  const mealsDone = meals.filter((m) => m.done).length;
  const alimentacao = meals.length ? pct(mealsDone / Math.max(mealGoal, meals.length)) : null;

  const stepsToday = steps.find((s) => s.day === today());
  const movimento = stepsToday ? pct(stepsToday.steps / stepGoal) : null;

  const sleepLatest = [...sleep].sort((a, b) => b.day.localeCompare(a.day))[0];
  const sono = sleepLatest ? pct((Math.min(sleepLatest.hours, 8) / 8) * 0.6 + (sleepLatest.quality / 100) * 0.4) : null;

  const byPillar = (p: string) => {
    const list = missions.filter((m) => m.pillar === p);
    return list.length ? pct(list.filter((m) => m.done).length / list.length) : null;
  };

  return [
    {
      key: "alimentacao",
      label: "Alimentação",
      score: alimentacao,
      note: `${mealsDone} de ${meals.length} refeições registradas hoje.`,
      href: "/dieta",
    },
    {
      key: "movimento",
      label: "Movimento",
      score: movimento,
      note: stepsToday ? `${stepsToday.steps.toLocaleString("pt-BR")} passos informados de ${stepGoal.toLocaleString("pt-BR")}.` : "Passos ainda não informados hoje.",
      href: "/corpo",
    },
    {
      key: "sono",
      label: "Sono e recuperação",
      score: sono,
      note: sleepLatest ? `${sleepLatest.hours} h no último registro (${weekdayLabel(sleepLatest.day)}).` : "Sono ainda não registrado.",
      href: "/corpo",
    },
    { key: "sol", label: "Momentos ao ar livre", score: byPillar("sol"), note: "Atividades ao ar livre registradas hoje.", href: "/registro" },
    {
      key: "presenca",
      label: "Presença e telas",
      score: byPillar("presenca"),
      note: "Momentos sem tela no seu dia.",
      href: "/registro",
    },
    {
      key: "habitos", label: "Outros hábitos", score: byPillar("habitos"),
      note: "Outros hábitos registrados hoje.", href: "/registro",
    },
  ];
}

export function averageScore(pillars: PillarScore[]): number | null {
  const recorded = pillars.filter((p): p is PillarScore & { score: number } => p.score !== null);
  if (!recorded.length) return null;
  return Math.round(recorded.reduce((s, p) => s + p.score, 0) / recorded.length);
}

export function computeStreak(missions: MissionRow[]): number {
  const doneDays = new Set(missions.filter((m) => m.done).map((m) => m.day));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA", { timeZone: browserTimeZone() });
    if (doneDays.has(d)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
