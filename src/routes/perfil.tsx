import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { LevelArc } from "@/components/apolo/LevelArc";
import { Paywall } from "@/components/apolo/Paywall";
import { PillarBars } from "@/components/apolo/PillarBars";
import { ProfileDataSheet } from "@/components/apolo/ProfileDataSheet";
import { RemindersSheet } from "@/components/apolo/RemindersSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { firstName } from "@/lib/format";
import { levelFor } from "@/lib/levels";
import { readMeal } from "@/lib/meals";
import { useProStatus } from "@/lib/pro";
import { playNote, setSoundEnabled, soundEnabled } from "@/lib/sound";
import {
  challengeState,
  computeStreak,
  computeWeeklyPillars,
  useMealsWeek,
  useMissionsDoneCount,
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
      { title: "Perfil — Apolo" },
      {
        name: "description",
        content: "Seu nível, sua sequência, seus pilares da semana e suas preferências.",
      },
      { property: "og:title", content: "Perfil — Apolo" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function sinceLabel(iso: string | undefined) {
  if (!iso) return "No Apolo";
  const date = new Date(iso);
  const month = MONTHS[date.getMonth()] ?? "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return `No Apolo desde ${month}${sameYear ? "" : ` de ${date.getFullYear()}`}`;
}

function PerfilPage() {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const profile = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const missionsWeek = useMissionsWeek(userId);
  const doneCount = useMissionsDoneCount(userId);
  const mealsWeek = useMealsWeek(userId);
  const steps = useStepsWeek(userId);
  const sleep = useSleepWeek(userId);
  const protocol = useProtocol(userId);
  const pro = useProStatus(userId);

  const [sound, setSound] = useState(true);
  useEffect(() => {
    setSound(soundEnabled());
  }, []);

  const [dataOpen, setDataOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const name = firstName(profile.data?.display_name);
  const totalDone = doneCount.data ?? 0;
  const level = levelFor(totalDone);
  const streak = computeStreak(missionsWeek.data ?? []);
  const challenge = challengeState(protocol.data ?? [], profile.data?.timezone);
  const pillars = computeWeeklyPillars({
    meals: mealsWeek.data ?? [],
    missions: missionsWeek.data ?? [],
    steps: steps.data ?? [],
    sleep: sleep.data ?? [],
    stepGoal: profile.data?.step_goal ?? 8000,
    mealGoal: profile.data?.meal_goal ?? 4,
    isRealMeal: (meal) => readMeal(meal).tag === "real",
  });

  const rows = [
    {
      key: "dados",
      label: "Seus dados e metas",
      onClick: () => setDataOpen(true),
    },
    {
      key: "lembretes",
      label: "Lembretes",
      onClick: () => setRemindersOpen(true),
    },
  ];

  return (
    <AppShell>
      <ProfileDataSheet
        open={dataOpen}
        onOpenChange={setDataOpen}
        profile={profile.data}
        email={user?.email ?? ""}
        saving={updateProfile.isPending}
        onSave={(values) =>
          updateProfile.mutate(values, {
            onSuccess: () => {
              setDataOpen(false);
              toast.success("Perfil atualizado.");
            },
            onError: () => toast.error("Não foi possível salvar. Tente novamente."),
          })
        }
        onSignOut={async () => {
          await signOut();
          navigate({ to: "/auth" });
        }}
      />
      <RemindersSheet open={remindersOpen} onOpenChange={setRemindersOpen} userId={userId} />
      <Paywall
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trialActive={pro.trialActive}
        daysLeft={pro.daysLeft}
        onStart={() => {
          pro.startTrial();
          setPaywallOpen(false);
          toast.success("Seus 7 dias grátis começaram. Aproveite tudo.");
        }}
        onRestore={() =>
          toast(
            pro.trialActive
              ? "Seu teste grátis já está ativo neste aparelho."
              : "Nenhuma assinatura encontrada para restaurar.",
          )
        }
      />

      <header className="rise flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-secondary font-display text-2xl font-semibold text-primary">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[2rem] leading-tight">{name}</h1>
          <p className="text-[15px] text-muted-foreground">{sinceLabel(user?.created_at)}</p>
        </div>
        <button
          type="button"
          onClick={() => setDataOpen(true)}
          aria-label="Configurações"
          className="press flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
        >
          <SlidersHorizontal className="size-5" strokeWidth={1.8} />
        </button>
      </header>

      <section
        className="surface rise mt-6 p-6"
        style={{ "--stagger": "70ms" } as React.CSSProperties}
      >
        <LevelArc currentLevel={level.current.level} />
        <div className="mt-5 flex items-baseline justify-between">
          <h2 className="text-[1.6rem]">
            Nível {level.current.level} · {level.current.name}
          </h2>
          <span className="text-[15px] text-muted-foreground">
            {level.next ? `${totalDone} / ${level.next.min}` : `${totalDone} missões`}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${Math.round(level.progress * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {level.next
            ? level.remaining === 1
              ? `Falta 1 missão para chegar à ${level.next.name}.`
              : `Faltam ${level.remaining} missões para chegar à ${level.next.name}.`
            : "Você chegou ao Solstício. Seu sol está no ponto mais alto."}
        </p>
      </section>

      <div
        className="rise mt-4 grid grid-cols-3 gap-3"
        style={{ "--stagger": "140ms" } as React.CSSProperties}
      >
        {[
          { value: String(streak), label: streak === 1 ? "dia seguido" : "dias seguidos" },
          { value: String(totalDone), label: totalDone === 1 ? "missão feita" : "missões feitas" },
          { value: `${challenge.completedCount}/30`, label: "dias de desafio" },
        ].map((stat) => (
          <div key={stat.label} className="surface p-4">
            <p className="font-display text-[1.7rem] font-semibold leading-none text-foreground">
              {stat.value}
            </p>
            <p className="mt-2 text-[12px] leading-tight text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <PillarBars pillars={pillars} />

      <section
        className="surface rise mt-5 px-6"
        style={{ "--stagger": "280ms" } as React.CSSProperties}
      >
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={row.onClick}
                className="press flex min-h-[4.25rem] w-full items-center justify-between text-left text-[17px] text-foreground"
              >
                {row.label}
                <ChevronRight className="size-5 text-muted-foreground" strokeWidth={1.8} />
              </button>
            </li>
          ))}
          <li>
            <label className="flex min-h-[4.25rem] cursor-pointer items-center justify-between gap-4 text-[17px] text-foreground">
              Sons e vibração
              <Switch
                checked={sound}
                onCheckedChange={(checked) => {
                  setSoundEnabled(checked);
                  setSound(checked);
                  if (checked) playNote(4);
                }}
                aria-label="Sons e vibração"
                className="h-8 w-[3.4rem] data-[state=checked]:bg-primary data-[state=unchecked]:bg-sand-deep [&>span]:size-7 [&>span]:data-[state=checked]:translate-x-6"
              />
            </label>
          </li>
          <li className="flex min-h-[4.25rem] items-center justify-between text-[17px] text-muted-foreground">
            Comunidade
            <span className="rounded-full bg-sand px-3.5 py-1.5 text-[13px] font-semibold text-gold-deep">
              Em breve
            </span>
          </li>
        </ul>
      </section>

      <button
        type="button"
        onClick={() => setPaywallOpen(true)}
        className="surface-deep rise mt-5 flex w-full items-center gap-4 p-5 text-left"
        style={{ "--stagger": "350ms" } as React.CSSProperties}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
          <Sparkles className="size-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold">Apolo Pro</span>
          <span className="block text-[14px] text-primary-foreground/80">
            {pro.trialActive
              ? `Teste grátis ativo · ${pro.daysLeft === 1 ? "1 dia restante" : `${pro.daysLeft} dias restantes`}`
              : "Scanner ilimitado, Pergunte ao Apolo e mais. 7 dias grátis."}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-primary-foreground/70" strokeWidth={1.8} />
      </button>
    </AppShell>
  );
}
