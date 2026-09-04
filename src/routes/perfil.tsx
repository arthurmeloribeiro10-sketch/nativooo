import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Flame, Leaf } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { PillarBar } from "@/components/nativo/PillarBar";
import { useAuth } from "@/lib/auth-context";
import {
  averageScore,
  computePillars,
  computeStreak,
  useMeals,
  useMissions,
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
      { title: "Seu perfil e evolução — NATIVO" },
      {
        name: "description",
        content:
          "Histórico do Nativo Score, protocolo, sequência e evolução dos pilares do seu estilo de vida.",
      },
      { property: "og:title", content: "Seu perfil e evolução — NATIVO" },
      {
        property: "og:description",
        content: "Menos controle ansioso. Mais vida bem vivida — acompanhe sua evolução real.",
      },
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

  const [nome, setNome] = useState("");
  const [meta, setMeta] = useState("10000");

  useEffect(() => {
    if (profile.data) {
      setNome(profile.data.display_name);
      setMeta(String(profile.data.step_goal));
    }
  }, [profile.data?.id]);

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
  const protocolDays = (protocol.data ?? []).length;

  const conquistas = [
    { label: "Primeiros 7 dias", ok: protocolDays >= 7 },
    { label: "Comida real por 21 dias", ok: protocolDays >= 21 },
    { label: "Sol da manhã · 10 dias", ok: protocolDays >= 10 },
    { label: "Semana sem desistir", ok: streak >= 7 },
  ].filter((c) => c.ok);

  return (
    <AppShell>
      <PageTitle
        title={profile.data?.display_name ?? "Seu perfil"}
        subtitle={user?.email ?? undefined}
      />

      <section className="surface grid grid-cols-3 divide-x divide-border/60 p-5 text-center">
        <div>
          <Leaf className="mx-auto size-5 text-leaf" strokeWidth={1.6} />
          <p className="mt-2 font-display text-lg font-semibold">{score}</p>
          <p className="text-[11px] text-muted-foreground">Nativo Score</p>
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
              { display_name: nome.trim() || "Nativo", step_goal: Number(meta) || 10000 },
              { onSuccess: () => toast.success("Perfil atualizado.") },
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
        <p className="mt-5 font-editorial text-sm text-accent">"Menos controle. Mais consciência."</p>
      </section>
    </AppShell>
  );
}
