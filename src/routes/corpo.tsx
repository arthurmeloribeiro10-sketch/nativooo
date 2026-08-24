import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Footprints, Moon, Sun, Sunrise, Sunset } from "lucide-react";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import {
  sleepAverage,
  sleepWeek,
  stepsToday,
  stepsWeek,
  sunHours,
  sunToday,
} from "@/lib/nativo-data";

export const Route = createFileRoute("/corpo")({
  head: () => ({
    meta: [
      { title: "Sol, passos e sono — NATIVO" },
      {
        name: "description",
        content:
          "Veja se o dia está bom para pegar sol, acompanhe seus passos e registre o sono da noite no NATIVO.",
      },
      { property: "og:title", content: "Sol, passos e sono — NATIVO" },
      {
        property: "og:description",
        content: "Índice UV, melhor janela de sol, passos do dia e diário de sono.",
      },
    ],
  }),
  component: CorpoPage,
});

const veredictoStyles: Record<string, string> = {
  bom: "border-success/40 bg-success/10",
  moderado: "border-gold/50 bg-gold/10",
  evitar: "border-terracotta/40 bg-terracotta/10",
};

function CorpoPage() {
  const [horas, setHoras] = useState(7);
  const [qualidade, setQualidade] = useState(75);
  const [registrado, setRegistrado] = useState(false);
  const maxSteps = Math.max(...stepsWeek.map((d) => d.steps));

  return (
    <AppShell>
      <PageTitle
        title="Sol, passos e sono"
        subtitle="Os sinais mais simples do corpo: luz natural, movimento e recuperação."
      />

      <section className={`surface rise border p-5 ${veredictoStyles[sunToday.verdict]}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg">
              <Sun className="size-5 text-gold" strokeWidth={1.6} />
              Hoje está bom para pegar sol
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sunToday.message}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold">{sunToday.uvPeak}</p>
            <p className="text-[11px] text-muted-foreground">UV máx.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border/60 bg-card/70 p-3">
            <p className="text-muted-foreground">Melhor janela</p>
            <p className="mt-1 text-sm font-medium">{sunToday.bestWindow}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/70 p-3">
            <p className="text-muted-foreground">Evitar exposição</p>
            <p className="mt-1 text-sm font-medium">{sunToday.avoidWindow}</p>
          </div>
        </div>

        <div className="mt-5 flex h-24 items-end gap-2">
          {sunHours.map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gold/80"
                style={{ height: `${Math.max(h.uv, 0.3) * 10}%` }}
                aria-label={`${h.hour}: UV ${h.uv}`}
              />
              <span className="text-[11px] text-muted-foreground">{h.hour}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sunrise className="size-4" strokeWidth={1.6} /> {sunToday.sunrise}
          </span>
          <span>{sunToday.condition}</span>
          <span className="flex items-center gap-1.5">
            <Sunset className="size-4" strokeWidth={1.6} /> {sunToday.sunset}
          </span>
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Footprints className="size-5 text-leaf" strokeWidth={1.6} />
          Passos de hoje
        </h2>
        <div className="mt-4 flex items-end justify-between">
          <p className="font-display text-4xl font-semibold">
            {stepsToday.steps.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-muted-foreground">
            meta {stepsToday.goal.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-leaf transition-[width] duration-700"
            style={{ width: `${Math.min((stepsToday.steps / stepsToday.goal) * 100, 100)}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <p className="text-muted-foreground">Distância</p>
            <p className="mt-1 text-sm font-medium">{stepsToday.km} km</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <p className="text-muted-foreground">Minutos ativos</p>
            <p className="mt-1 text-sm font-medium">{stepsToday.minutesActive} min</p>
          </div>
        </div>

        <div className="mt-5 flex h-24 items-end gap-2">
          {stepsWeek.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-leaf/70"
                style={{ height: `${(d.steps / maxSteps) * 100}%` }}
                aria-label={`${d.day}: ${d.steps} passos`}
              />
              <span className="text-[11px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Moon className="size-5 text-accent" strokeWidth={1.6} />
          Registro de sono
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Média da semana: {sleepAverage} h por noite.
        </p>

        <label htmlFor="horas" className="mt-5 flex items-baseline justify-between text-sm font-medium">
          Horas dormidas
          <span className="text-xs text-muted-foreground">{horas} h</span>
        </label>
        <input
          id="horas"
          type="range"
          min={3}
          max={11}
          step={0.5}
          value={horas}
          onChange={(e) => {
            setHoras(Number(e.target.value));
            setRegistrado(false);
          }}
          className="mt-2 w-full accent-[var(--leaf)]"
        />

        <label
          htmlFor="qualidade"
          className="mt-4 flex items-baseline justify-between text-sm font-medium"
        >
          Como você acordou
          <span className="text-xs text-muted-foreground">{qualidade}%</span>
        </label>
        <input
          id="qualidade"
          type="range"
          min={0}
          max={100}
          step={5}
          value={qualidade}
          onChange={(e) => {
            setQualidade(Number(e.target.value));
            setRegistrado(false);
          }}
          className="mt-2 w-full accent-[var(--leaf)]"
        />

        <button
          type="button"
          onClick={() => setRegistrado(true)}
          className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Registrar noite
        </button>

        {registrado ? (
          <div className="rise mt-4 rounded-2xl border border-success/40 bg-success/10 p-4">
            <p className="text-sm font-medium">Noite registrada</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {horas >= 7
                ? "Boa duração. Manter o horário de dormir é o que consolida esse ganho."
                : "Um pouco abaixo do ideal. Tente antecipar o jantar e reduzir telas à noite."}
            </p>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          {sleepWeek.map((n) => (
            <div key={n.day} className="flex items-center gap-3">
              <span className="w-8 text-[11px] text-muted-foreground">{n.day}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-accent/80"
                  style={{ width: `${(n.hours / 9) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-[11px] text-muted-foreground">{n.hours} h</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
