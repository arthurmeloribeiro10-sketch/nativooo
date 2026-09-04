import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const TZ = "America/Sao_Paulo";

export function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push(d.toLocaleDateString("en-CA", { timeZone: TZ }));
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
};

export type SleepRow = { id: string; day: string; hours: number; quality: number };
export type StepRow = { id: string; day: string; steps: number };
export type ProfileRow = { id: string; display_name: string; step_goal: number };

/* ---------- sementes do dia ---------- */

const defaultMissions = [
  {
    title: "15 minutos de sol antes das 10h",
    detail: "Sem óculos escuros, de preferência caminhando.",
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

const defaultMeals = [
  {
    time_label: "07h30",
    name: "Café da manhã",
    items: ["3 ovos caipiras", "Meio abacate", "Café coado sem açúcar"],
    kcal: 480,
  },
  {
    time_label: "12h30",
    name: "Almoço",
    items: ["Proteína de qualidade", "Arroz e feijão", "Salada com azeite"],
    kcal: 720,
  },
  { time_label: "16h00", name: "Lanche", items: ["Fruta da estação", "Castanhas"], kcal: 260 },
  {
    time_label: "20h00",
    name: "Jantar",
    items: ["Peixe assado", "Legumes na manteiga", "Batata-doce"],
    kcal: 610,
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
        .select("id, display_name, step_goal")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as ProfileRow;
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId! })
        .select("id, display_name, step_goal")
        .single();
      if (insertError) throw insertError;
      return created as ProfileRow;
    },
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<ProfileRow, "display_name" | "step_goal">>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId!);
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
        .eq("day", day)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data as MissionRow[];

      const { data: seeded, error: seedError } = await supabase
        .from("missions")
        .insert(defaultMissions.map((m) => ({ ...m, user_id: userId!, day })))
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
    onSuccess: () => {
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
        .select("id, day, time_label, name, items, kcal, done, note")
        .eq("day", day)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data as MealRow[];

      const { data: seeded, error: seedError } = await supabase
        .from("meals")
        .insert(defaultMeals.map((m) => ({ ...m, user_id: userId!, day })))
        .select("id, day, time_label, name, items, kcal, done, note");
      if (seedError) throw seedError;
      return (seeded ?? []) as MealRow[];
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
    onSuccess: invalidate,
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
        user_id: userId!,
        day: today(),
        name: meal.name,
        items: meal.items ?? [],
        kcal: meal.kcal ?? 0,
        time_label: meal.time_label ?? "Livre",
        done: meal.done ?? false,
        note: meal.note ?? null,
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

  const replaceWithTemplate = useMutation({
    mutationFn: async (meals: { time_label: string; name: string; items: string[]; kcal: number }[]) => {
      const day = today();
      const { error: delError } = await supabase.from("meals").delete().eq("day", day);
      if (delError) throw delError;
      const { error } = await supabase
        .from("meals")
        .insert(meals.map((m) => ({ ...m, user_id: userId!, day })));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { toggle, add, remove, replaceWithTemplate };
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
};

export function usePosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["posts", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PostView[]> => {
      const { data: posts, error } = await supabase
        .from("community_posts")
        .select("id, body, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = posts ?? [];
      if (rows.length === 0) return [];

      const ids = [...new Set(rows.map((p) => p.user_id as string))];
      const [{ data: profiles }, { data: reactions }] = await Promise.all([
        supabase.from("profiles").select("id, display_name").in("id", ids),
        supabase
          .from("post_reactions")
          .select("post_id, user_id")
          .in(
            "post_id",
            rows.map((p) => p.id as string),
          ),
      ]);

      const names = new Map((profiles ?? []).map((p) => [p.id as string, p.display_name as string]));
      const all = reactions ?? [];

      return rows.map((p) => ({
        id: p.id as string,
        body: p.body as string,
        created_at: p.created_at as string,
        user_id: p.user_id as string,
        author: names.get(p.user_id as string) ?? "Nativo",
        reactions: all.filter((r) => r.post_id === p.id).length,
        reacted: all.some((r) => r.post_id === p.id && r.user_id === userId),
      }));
    },
  });
}

export function usePostMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["posts", userId] });

  const create = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("community_posts").insert({ user_id: userId!, body });
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

export function useRanking() {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: async (): Promise<RankingRow[]> => {
      const { data, error } = await supabase.rpc("community_ranking");
      if (error) throw error;
      return (data ?? []) as RankingRow[];
    },
  });
}

/* ---------- score ---------- */

export type PillarScore = { key: string; label: string; score: number; note: string };

export function computePillars(input: {
  meals: MealRow[];
  missions: MissionRow[];
  steps: StepRow[];
  sleep: SleepRow[];
  protocolDays: number[];
  stepGoal: number;
}): PillarScore[] {
  const { meals, missions, steps, sleep, protocolDays, stepGoal } = input;
  const pct = (v: number) => Math.max(0, Math.min(100, Math.round(v * 100)));

  const mealsDone = meals.filter((m) => m.done).length;
  const alimentacao = meals.length ? pct(mealsDone / meals.length) : 0;

  const stepsToday = steps.find((s) => s.day === today())?.steps ?? 0;
  const movimento = pct(stepsToday / (stepGoal || 10000));

  const sleepToday = sleep.find((s) => s.day === today());
  const sono = sleepToday ? pct((Math.min(sleepToday.hours, 8) / 8) * 0.6 + (sleepToday.quality / 100) * 0.4) : 0;

  const byPillar = (p: string) => {
    const list = missions.filter((m) => m.pillar === p);
    return list.length ? pct(list.filter((m) => m.done).length / list.length) : 0;
  };

  return [
    {
      key: "alimentacao",
      label: "Alimentação",
      score: alimentacao,
      note: `${mealsDone} de ${meals.length} refeições registradas hoje.`,
    },
    {
      key: "movimento",
      label: "Movimento",
      score: movimento,
      note: `${stepsToday.toLocaleString("pt-BR")} passos de ${stepGoal.toLocaleString("pt-BR")}.`,
    },
    {
      key: "sono",
      label: "Sono e recuperação",
      score: sono,
      note: sleepToday ? `${sleepToday.hours} h na última noite.` : "Registre a noite de hoje.",
    },
    { key: "sol", label: "Sol e natureza", score: byPillar("sol"), note: "Missões de luz natural." },
    {
      key: "presenca",
      label: "Presença e telas",
      score: byPillar("presenca"),
      note: "Momentos sem tela no seu dia.",
    },
    {
      key: "habitos",
      label: "Hábitos e protocolos",
      score: pct(protocolDays.length / 30),
      note: `${protocolDays.length} de 30 dias do protocolo.`,
    },
  ];
}

export function averageScore(pillars: PillarScore[]): number {
  if (!pillars.length) return 0;
  return Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);
}

export function computeStreak(missions: MissionRow[]): number {
  const doneDays = new Set(missions.filter((m) => m.done).map((m) => m.day));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA", { timeZone: TZ });
    if (doneDays.has(d)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
