import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Camera, Flame, Sun } from "lucide-react";

import heroImage from "@/assets/nativo-hero.jpg";
import { AppShell } from "@/components/nativo/AppShell";
import { PillarBar } from "@/components/nativo/PillarBar";
import { ScoreRing } from "@/components/nativo/ScoreRing";
import { nativoScore, pillars, todayMissions, weeklyProgress } from "@/lib/nativo-data";

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
          "Hábitos, protocolos e evolução pessoal em um só lugar. Comece pelo protocolo de 30 dias do João Braga.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [missions, setMissions] = useState(todayMissions);
  const doneCount = missions.filter((m) => m.done).length;

  return (
    <AppShell>
      <section className="rise surface-deep overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] opacity-70">Bom dia, Arthur</p>
            <h1 className="mt-3 font-editorial text-2xl leading-snug text-primary-foreground">
              Como você quer viver hoje?
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-80">
              Hoje você cuidou mais da sua vida do que ontem. Seu sono é o próximo hábito a receber
              atenção.
            </p>
          </div>
          <ScoreRing score={nativoScore} />
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
            <p className="font-display text-lg font-semibold">12 dias</p>
            <p className="text-xs text-muted-foreground">de sequência</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-4">
          <Sun className="size-5 text-gold" strokeWidth={1.6} />
          <div>
            <p className="font-display text-lg font-semibold">
              {doneCount}/{missions.length}
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
        <ul className="mt-4 space-y-2">
          {missions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() =>
                  setMissions((prev) =>
                    prev.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)),
                  )
                }
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
          {weeklyProgress.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-leaf/80"
                style={{ height: `${d.score}%` }}
                aria-label={`${d.day}: ${d.score}`}
              />
              <span className="text-[11px] text-muted-foreground">{d.day}</span>
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
          to="/protocolo"
          className="surface flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-sm font-medium">Protocolo Nativo · Dia 12</span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </section>
    </AppShell>
  );
}
