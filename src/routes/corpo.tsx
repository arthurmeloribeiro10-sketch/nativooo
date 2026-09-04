import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Footprints, MapPin, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  lastDays,
  today,
  useProfile,
  useSaveSleep,
  useSaveSteps,
  useSleepWeek,
  useStepsWeek,
  weekdayLabel,
} from "@/lib/nativo-queries";

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
        content: "Índice UV real, melhor janela de sol, passos do dia e diário de sono.",
      },
    ],
  }),
  component: CorpoPage,
});

type SunData = {
  hours: { hour: string; uv: number }[];
  uvPeak: number;
  sunrise: string;
  sunset: string;
  bestWindow: string;
  avoidWindow: string;
  verdict: "bom" | "moderado" | "evitar";
  message: string;
};

const veredictoStyles: Record<string, string> = {
  bom: "border-success/40 bg-success/10",
  moderado: "border-gold/50 bg-gold/10",
  evitar: "border-terracotta/40 bg-terracotta/10",
};

async function fetchSun(lat: number, lon: number): Promise<SunData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index,cloud_cover&daily=sunrise,sunset,uv_index_max&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Não foi possível ler a previsão.");
  const json = (await res.json()) as {
    hourly: { time: string[]; uv_index: number[]; cloud_cover: number[] };
    daily: { sunrise: string[]; sunset: string[]; uv_index_max: number[] };
  };

  const times = json.hourly.time;
  const uv = json.hourly.uv_index;
  const clouds = json.hourly.cloud_cover;

  const hours = times
    .map((t, i) => ({ h: Number(t.slice(11, 13)), uv: uv[i] ?? 0 }))
    .filter((x) => x.h >= 6 && x.h <= 18 && x.h % 2 === 0)
    .map((x) => ({ hour: `${x.h}h`, uv: Math.round(x.uv * 10) / 10 }));

  const uvPeak = Math.round(json.daily.uv_index_max[0] ?? 0);
  const safe = times
    .map((t, i) => ({ h: Number(t.slice(11, 13)), uv: uv[i] ?? 0 }))
    .filter((x) => x.uv > 0.5 && x.uv <= 5);
  const strong = times
    .map((t, i) => ({ h: Number(t.slice(11, 13)), uv: uv[i] ?? 0 }))
    .filter((x) => x.uv > 6);

  const cloudAvg =
    clouds.slice(6, 18).reduce((s, c) => s + (c ?? 0), 0) / Math.max(clouds.slice(6, 18).length, 1);

  const verdict: SunData["verdict"] = cloudAvg > 80 ? "evitar" : uvPeak >= 3 ? "bom" : "moderado";

  const fmt = (h: number) => `${String(h).padStart(2, "0")}h00`;

  return {
    hours,
    uvPeak,
    sunrise: json.daily.sunrise[0]?.slice(11, 16).replace(":", "h") ?? "--",
    sunset: json.daily.sunset[0]?.slice(11, 16).replace(":", "h") ?? "--",
    bestWindow: safe.length ? `${fmt(safe[0]!.h)} – ${fmt(safe[safe.length - 1]!.h)}` : "Sem janela clara hoje",
    avoidWindow: strong.length ? `${fmt(strong[0]!.h)} – ${fmt(strong[strong.length - 1]!.h)}` : "Sem pico forte",
    verdict:
      verdict === "evitar" ? "evitar" : verdict,
    message:
      cloudAvg > 80
        ? "Dia bastante nublado. A luz natural ainda ajuda, mas a exposição rende pouco hoje."
        : uvPeak >= 3
          ? "Dia bom para pegar sol. Aproveite a manhã: cerca de 20 minutos de pele exposta, sem óculos escuros."
          : "Sol fraco hoje. Vale sair mesmo assim para regular seu relógio biológico.",
  };
}

function CorpoPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const profile = useProfile(userId);
  const stepsWeek = useStepsWeek(userId);
  const sleepWeek = useSleepWeek(userId);
  const saveSteps = useSaveSteps(userId);
  const saveSleep = useSaveSleep(userId);

  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: -23.55, lon: -46.63 });
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocated(true);
      },
      () => setLocated(false),
      { timeout: 8000 },
    );
  }, []);

  const sun = useQuery({
    queryKey: ["sun", coords.lat.toFixed(2), coords.lon.toFixed(2)],
    queryFn: () => fetchSun(coords.lat, coords.lon),
    staleTime: 30 * 60 * 1000,
  });

  const goal = profile.data?.step_goal ?? 10000;
  const stepsToday = (stepsWeek.data ?? []).find((s) => s.day === today())?.steps ?? 0;
  const [stepInput, setStepInput] = useState("");
  const maxSteps = Math.max(1, ...(stepsWeek.data ?? []).map((d) => d.steps));

  const sleepToday = (sleepWeek.data ?? []).find((s) => s.day === today());
  const [horas, setHoras] = useState(7);
  const [qualidade, setQualidade] = useState(75);

  useEffect(() => {
    if (sleepToday) {
      setHoras(sleepToday.hours);
      setQualidade(sleepToday.quality);
    }
  }, [sleepToday?.id]);

  const sleepAverage = (sleepWeek.data ?? []).length
    ? Math.round(
        ((sleepWeek.data ?? []).reduce((s, n) => s + n.hours, 0) / (sleepWeek.data ?? []).length) * 10,
      ) / 10
    : 0;

  const weekDays = lastDays(7);

  return (
    <AppShell>
      <PageTitle
        title="Sol, passos e sono"
        subtitle="Os sinais mais simples do corpo: luz natural, movimento e recuperação."
      />

      <section
        className={`surface rise border p-5 ${
          sun.data ? veredictoStyles[sun.data.verdict] : "border-border"
        }`}
      >
        {sun.isLoading ? (
          <p className="text-sm text-muted-foreground">Lendo a previsão de hoje…</p>
        ) : sun.isError || !sun.data ? (
          <p className="text-sm text-muted-foreground">
            Não conseguimos ler a previsão agora. Tente novamente mais tarde.
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg">
                  <Sun className="size-5 text-gold" strokeWidth={1.6} />
                  {sun.data.verdict === "bom"
                    ? "Hoje está bom para pegar sol"
                    : sun.data.verdict === "moderado"
                      ? "Sol moderado hoje"
                      : "Dia fechado para sol"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {sun.data.message}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" />
                  {located ? "Baseado na sua localização" : "Localização padrão: São Paulo"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-semibold">{sun.data.uvPeak}</p>
                <p className="text-[11px] text-muted-foreground">UV máx.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                <p className="text-muted-foreground">Melhor janela</p>
                <p className="mt-1 text-sm font-medium">{sun.data.bestWindow}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                <p className="text-muted-foreground">Evitar exposição</p>
                <p className="mt-1 text-sm font-medium">{sun.data.avoidWindow}</p>
              </div>
            </div>

            <div className="mt-5 flex h-24 items-end gap-2">
              {sun.data.hours.map((h) => (
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
                <Sunrise className="size-4" strokeWidth={1.6} /> {sun.data.sunrise}
              </span>
              <span className="flex items-center gap-1.5">
                <Sunset className="size-4" strokeWidth={1.6} /> {sun.data.sunset}
              </span>
            </div>
          </>
        )}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Footprints className="size-5 text-leaf" strokeWidth={1.6} />
          Passos de hoje
        </h2>
        <div className="mt-4 flex items-end justify-between">
          <p className="font-display text-4xl font-semibold">{stepsToday.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">meta {goal.toLocaleString("pt-BR")}</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-leaf transition-[width] duration-700"
            style={{ width: `${Math.min((stepsToday / goal) * 100, 100)}%` }}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            min={0}
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
            placeholder="Passos de hoje"
            className="flex-1 rounded-full border border-input bg-background/70 px-4 py-3 text-sm outline-none focus:border-leaf"
          />
          <button
            type="button"
            onClick={() => {
              const value = Number(stepInput);
              if (!Number.isFinite(value) || value < 0) return;
              saveSteps.mutate(Math.round(value), {
                onSuccess: () => {
                  setStepInput("");
                  toast.success("Passos atualizados.");
                },
              });
            }}
            className="rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Salvar
          </button>
        </div>

        <div className="mt-5 flex h-24 items-end gap-2">
          {weekDays.map((day) => {
            const value = (stepsWeek.data ?? []).find((d) => d.day === day)?.steps ?? 0;
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-leaf/70"
                  style={{ height: `${Math.max((value / maxSteps) * 100, 2)}%` }}
                  aria-label={`${weekdayLabel(day)}: ${value} passos`}
                />
                <span className="text-[11px] text-muted-foreground">{weekdayLabel(day)}</span>
              </div>
            );
          })}
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
          onChange={(e) => setHoras(Number(e.target.value))}
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
          onChange={(e) => setQualidade(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--leaf)]"
        />

        <button
          type="button"
          onClick={() =>
            saveSleep.mutate(
              { hours: horas, quality: qualidade },
              { onSuccess: () => toast.success("Noite registrada.") },
            )
          }
          className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {sleepToday ? "Atualizar noite" : "Registrar noite"}
        </button>

        {sleepToday ? (
          <div className="rise mt-4 rounded-2xl border border-success/40 bg-success/10 p-4">
            <p className="text-sm font-medium">Noite registrada</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {sleepToday.hours >= 7
                ? "Boa duração. Manter o horário de dormir é o que consolida esse ganho."
                : "Um pouco abaixo do ideal. Tente antecipar o jantar e reduzir telas à noite."}
            </p>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          {weekDays.map((day) => {
            const night = (sleepWeek.data ?? []).find((n) => n.day === day);
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-8 text-[11px] text-muted-foreground">{weekdayLabel(day)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-accent/80"
                    style={{ width: `${((night?.hours ?? 0) / 9) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] text-muted-foreground">
                  {night ? `${night.hours} h` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
