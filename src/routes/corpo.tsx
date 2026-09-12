import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Footprints, LocateFixed, MapPin, Moon, Search, Sun } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { lastDays, today, useProfile, useSaveSleep, useSaveSteps, useSleepWeek, useStepsWeek, weekdayLabel } from "@/lib/nativo-queries";

export const Route = createFileRoute("/corpo")({
  head: () => ({ meta: [
    { title: "Atividade ao ar livre, passos e sono — NATIVO" },
    { name: "description", content: "Consulte o índice UV por horário, registre passos e acompanhe seu sono no NATIVO." },
    { property: "og:title", content: "Atividade ao ar livre, passos e sono — NATIVO" },
    { property: "og:description", content: "Índice UV horário, movimento e recuperação com dados claros." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CorpoPage,
});

type Place = { name: string; latitude: number; longitude: number; admin1?: string };
type SunData = { currentUv: number | null; currentTime: string | null; uvPeak: number; updatedAt: string; hours: { hour: string; uv: number }[]; lowWindow: string | null; highWindow: string | null; timezone: string };

function uvLevel(uv: number) {
  if (uv < 3) return { label: "Baixo", style: "border-success/50 bg-success/10", advice: "O UV está baixo. Atividades ao ar livre continuam pedindo atenção ao tempo de permanência e à sua pele." };
  if (uv < 6) return { label: "Moderado", style: "border-gold/60 bg-gold/10", advice: "Proteja pele e olhos. Prefira sombra, roupa, chapéu, óculos com proteção UV e protetor solar." };
  if (uv < 8) return { label: "Alto", style: "border-terracotta/60 bg-terracotta/10", advice: "Reduza exposição direta, especialmente perto do meio-dia, e use proteção para pele e olhos." };
  if (uv < 11) return { label: "Muito alto", style: "border-destructive/60 bg-destructive/10", advice: "Evite exposição direta nas horas próximas ao meio-dia e redobre a proteção para pele e olhos." };
  return { label: "Extremo", style: "border-destructive bg-destructive/15", advice: "Evite exposição direta. Procure sombra e use proteção completa para pele e olhos." };
}

function rangeFor(rows: { time: string; uv: number }[]) {
  const first = rows.at(0);
  const last = rows.at(-1);
  if (!first || !last) return null;
  const fmt = (time: string) => time.slice(11, 16);
  return `${fmt(first.time)}–${fmt(last.time)}`;
}

async function fetchSun(lat: number, lon: number): Promise<SunData> {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&hourly=uv_index&daily=uv_index_max&forecast_days=1&timezone=auto`);
  if (!res.ok) throw new Error("A previsão de UV não respondeu.");
  const json = await res.json() as { timezone: string; current?: { time?: string; uv_index?: number }; hourly?: { time?: string[]; uv_index?: number[] }; daily?: { uv_index_max?: number[] } };
  const times = json.hourly?.time ?? [];
  const values = json.hourly?.uv_index ?? [];
  if (!times.length || times.length !== values.length) throw new Error("A previsão horária veio incompleta.");
  const rows = times.map((time, i) => ({ time, uv: Number(values[i]) })).filter((x) => Number.isFinite(x.uv));
  const daylight = rows.filter((x) => Number(x.time.slice(11, 13)) >= 6 && Number(x.time.slice(11, 13)) <= 18);
  const chart = daylight.filter((_, i) => i % 2 === 0).map((x) => ({ hour: x.time.slice(11, 16), uv: Math.round(x.uv * 10) / 10 }));
  return {
    currentUv: Number.isFinite(json.current?.uv_index) ? Number(json.current?.uv_index) : null,
    currentTime: json.current?.time ?? null,
    uvPeak: Math.round(Number(json.daily?.uv_index_max?.[0] ?? Math.max(...values)) * 10) / 10,
    updatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    hours: chart, lowWindow: rangeFor(daylight.filter((x) => x.uv > 0 && x.uv < 3)),
    highWindow: rangeFor(daylight.filter((x) => x.uv >= 8)), timezone: json.timezone,
  };
}

async function searchCities(term: string): Promise<Place[]> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=5&language=pt&format=json`);
  if (!res.ok) throw new Error("Não foi possível buscar cidades.");
  const json = await res.json() as { results?: Place[] };
  return json.results ?? [];
}

function CorpoPage() {
  const { user } = useAuth(); const userId = user?.id;
  const profile = useProfile(userId); const stepsWeek = useStepsWeek(userId); const sleepWeek = useSleepWeek(userId);
  const saveSteps = useSaveSteps(userId); const saveSleep = useSaveSleep(userId);
  const [place, setPlace] = useState<Place | null>(null); const [locationState, setLocationState] = useState<"loading" | "located" | "denied" | "unsupported">("loading");
  const [city, setCity] = useState(""); const [cityResults, setCityResults] = useState<Place[]>([]); const [searching, setSearching] = useState(false);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) { setLocationState("unsupported"); return; }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPlace({ name: "Sua localização", latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocationState("located"); },
      () => setLocationState("denied"), { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  };
  useEffect(requestLocation, []);

  const sun = useQuery({ queryKey: ["sun", place?.latitude, place?.longitude], enabled: !!place, queryFn: () => fetchSun(place?.latitude ?? 0, place?.longitude ?? 0), staleTime: 30 * 60 * 1000, retry: 1 });
  const guidance = sun.data ? uvLevel(sun.data.currentUv ?? sun.data.uvPeak) : null;
  const goal = profile.data?.step_goal ?? 10000; const stepsTodayRow = (stepsWeek.data ?? []).find((s) => s.day === today());
  const [stepInput, setStepInput] = useState(""); const maxSteps = Math.max(1, ...(stepsWeek.data ?? []).map((d) => d.steps));
  const sleepToday = (sleepWeek.data ?? []).find((s) => s.day === today()); const [horas, setHoras] = useState(7); const [qualidade, setQualidade] = useState(75);
  useEffect(() => { if (sleepToday) { setHoras(sleepToday.hours); setQualidade(sleepToday.quality); } }, [sleepToday?.id]);
  const sleepAverage = (sleepWeek.data ?? []).length ? Math.round(((sleepWeek.data ?? []).reduce((s, n) => s + n.hours, 0) / (sleepWeek.data ?? []).length) * 10) / 10 : null;
  const weekDays = useMemo(() => lastDays(7), []);

  async function findCity() {
    if (city.trim().length < 2) return;
    setSearching(true);
    try { setCityResults(await searchCities(city.trim())); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao buscar cidade."); } finally { setSearching(false); }
  }

  return <AppShell>
    <PageTitle title="Corpo e rotina" subtitle="Informações objetivas para decidir como se movimentar, sair e recuperar." />
    <section className={`surface rise border p-5 ${guidance?.style ?? "border-border"}`}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg"><Sun className="size-5 text-gold" />Índice UV</h2><p className="mt-1 text-xs text-muted-foreground">Fonte: Open-Meteo · orientação de proteção baseada na OMS</p></div>{sun.data ? <div className="text-right"><p className="font-display text-3xl font-semibold">{sun.data.currentUv ?? "—"}</p><p className="text-[11px] text-muted-foreground">UV atual</p></div> : null}</div>
      {!place ? <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
        <p className="text-sm font-medium">{locationState === "loading" ? "Buscando sua localização…" : "Escolha uma cidade para ver uma previsão local"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Sem localização, o NATIVO não cria recomendações locais.</p>
        {locationState !== "loading" ? <><div className="mt-3 flex gap-2"><input aria-label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void findCity(); }} placeholder="Ex.: Campinas" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"/><Button type="button" size="icon" onClick={() => void findCity()} disabled={searching} aria-label="Buscar cidade"><Search /></Button><Button type="button" size="icon" variant="outline" onClick={requestLocation} aria-label="Usar minha localização"><LocateFixed /></Button></div>{cityResults.length ? <ul className="mt-2 divide-y divide-border">{cityResults.map((result) => <li key={`${result.latitude}-${result.longitude}`}><button type="button" onClick={() => { setPlace(result); setLocationState("located"); setCityResults([]); }} className="w-full py-2 text-left text-sm">{result.name}{result.admin1 ? `, ${result.admin1}` : ""}</button></li>)}</ul> : null}</> : null}
      </div> : sun.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Carregando dados horários…</p> : sun.isError || !sun.data ? <div className="mt-4 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"><AlertTriangle className="mt-0.5 size-4 shrink-0"/><div><p className="text-sm font-medium">Previsão indisponível</p><p className="mt-1 text-xs text-muted-foreground">Não há base para uma recomendação local agora.</p><Button className="mt-3" size="sm" variant="outline" onClick={() => sun.refetch()}>Tentar novamente</Button></div></div> : <>
        <div className="mt-4"><p className="text-sm font-semibold">UV {guidance?.label.toLowerCase()} agora · máximo previsto {sun.data.uvPeak}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guidance?.advice}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{place.name}{place.admin1 ? `, ${place.admin1}` : ""} · atualizado às {sun.data.updatedAt}</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Faixa com UV abaixo de 3</p><p className="mt-1 text-sm font-medium">{sun.data.lowWindow ?? "Não identificada hoje"}</p></div><div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">UV 8 ou mais</p><p className="mt-1 text-sm font-medium">{sun.data.highWindow ?? "Não previsto hoje"}</p></div></div>
        {sun.data.hours.length ? <div><div className="mt-5 flex h-28 items-end gap-2" role="img" aria-label={`Previsão horária de UV. Máximo ${sun.data.uvPeak}`} >{sun.data.hours.map((h) => <div key={h.hour} className="flex flex-1 flex-col items-center gap-1"><span className="text-[10px] text-muted-foreground">{h.uv}</span><div className={`w-full rounded-t ${h.uv >= 8 ? "bg-destructive" : h.uv >= 3 ? "bg-gold" : "bg-success"}`} style={{ height: `${Math.max(4, Math.min(h.uv / 12 * 72, 72))}px` }}/><span className="text-[10px] text-muted-foreground">{h.hour}</span></div>)}</div><div className="mt-2 flex gap-4 text-[10px] text-muted-foreground"><span>Verde: UV 0–2</span><span>Dourado: UV 3–7</span><span>Vermelho: UV 8+</span></div></div> : <p className="mt-4 text-sm text-muted-foreground">A fonte não retornou dados horários válidos.</p>}
      </>}
    </section>

    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="surface p-5"><h2 className="flex items-center gap-2 text-lg"><Footprints className="size-5 text-leaf"/>Passos de hoje</h2><div className="mt-4 flex items-end justify-between"><p className="font-display text-4xl font-semibold">{stepsTodayRow ? stepsTodayRow.steps.toLocaleString("pt-BR") : "—"}</p><p className="text-xs text-muted-foreground">meta pessoal {goal.toLocaleString("pt-BR")}</p></div><p className="mt-1 text-xs text-muted-foreground">{stepsTodayRow ? "Valor informado por você." : "Ainda sem registro hoje."}</p><div className="mt-4 flex gap-2"><input type="number" min={0} value={stepInput} onChange={(e) => setStepInput(e.target.value)} placeholder="Passos de hoje" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"/><Button disabled={saveSteps.isPending} onClick={() => { const value = Number(stepInput); if (!Number.isFinite(value) || value < 0) return; saveSteps.mutate(Math.round(value), { onSuccess: () => { setStepInput(""); toast.success("Passos salvos."); }, onError: () => toast.error("Não foi possível salvar. Tente novamente.") }); }}>Salvar</Button></div><div className="mt-5 flex h-20 items-end gap-2">{weekDays.map((day) => { const value = (stepsWeek.data ?? []).find((d) => d.day === day)?.steps; return <div key={day} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-leaf/70" style={{ height: value === undefined ? 2 : `${Math.max((value / maxSteps) * 55, 4)}px` }}/><span className="text-[10px] text-muted-foreground">{weekdayLabel(day)}</span></div>; })}</div></section>
      <section className="surface p-5"><h2 className="flex items-center gap-2 text-lg"><Moon className="size-5 text-accent"/>Registro de sono</h2><p className="mt-1 text-xs text-muted-foreground">{sleepAverage === null ? "Ainda sem registros nesta semana." : `Média registrada: ${sleepAverage} h por noite.`}</p><label htmlFor="horas" className="mt-5 flex justify-between text-sm font-medium">Horas dormidas <span>{horas} h</span></label><input id="horas" type="range" min={3} max={11} step={0.5} value={horas} onChange={(e) => setHoras(Number(e.target.value))} className="mt-2 w-full accent-[var(--leaf)]"/><label htmlFor="qualidade" className="mt-4 flex justify-between text-sm font-medium">Como você acordou <span>{qualidade}%</span></label><input id="qualidade" type="range" min={0} max={100} step={5} value={qualidade} onChange={(e) => setQualidade(Number(e.target.value))} className="mt-2 w-full accent-[var(--leaf)]"/><Button className="mt-5 w-full" disabled={saveSleep.isPending} onClick={() => saveSleep.mutate({ hours: horas, quality: qualidade }, { onSuccess: () => toast.success("Sono salvo."), onError: () => toast.error("Não foi possível salvar. Tente novamente.") })}>{sleepToday ? "Atualizar registro" : "Registrar noite"}</Button></section>
    </div>
  </AppShell>;
}