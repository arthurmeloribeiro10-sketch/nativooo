import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export type Place = { name: string; latitude: number; longitude: number; admin1?: string };
export type SunData = {
  currentUv: number | null;
  currentTime: string | null;
  uvPeak: number;
  updatedAt: string;
  hours: { hour: string; uv: number }[];
  lowWindow: string | null;
  highWindow: string | null;
  timezone: string;
};

export function uvLevel(uv: number) {
  if (uv < 3)
    return {
      label: "Baixo",
      style: "border-success/50 bg-success/10",
      advice:
        "O UV está baixo. Atividades ao ar livre continuam pedindo atenção ao tempo de permanência e à sua pele.",
    };
  if (uv < 6)
    return {
      label: "Moderado",
      style: "border-gold/60 bg-gold/10",
      advice:
        "Proteja pele e olhos. Prefira sombra, roupa, chapéu, óculos com proteção UV e protetor solar.",
    };
  if (uv < 8)
    return {
      label: "Alto",
      style: "border-terracotta/60 bg-terracotta/10",
      advice:
        "Reduza exposição direta, especialmente perto do meio-dia, e use proteção para pele e olhos.",
    };
  if (uv < 11)
    return {
      label: "Muito alto",
      style: "border-destructive/60 bg-destructive/10",
      advice:
        "Evite exposição direta nas horas próximas ao meio-dia e redobre a proteção para pele e olhos.",
    };
  return {
    label: "Extremo",
    style: "border-destructive bg-destructive/15",
    advice: "Evite exposição direta. Procure sombra e use proteção completa para pele e olhos.",
  };
}

function rangeFor(rows: { time: string; uv: number }[]) {
  const first = rows.at(0);
  const last = rows.at(-1);
  if (!first || !last) return null;
  const fmt = (time: string) => time.slice(11, 16);
  return `${fmt(first.time)}–${fmt(last.time)}`;
}

async function fetchSun(lat: number, lon: number): Promise<SunData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&hourly=uv_index&daily=uv_index_max&forecast_days=1&timezone=auto`,
  );
  if (!res.ok) throw new Error("A previsão de UV não respondeu.");
  const json = (await res.json()) as {
    timezone: string;
    current?: { time?: string; uv_index?: number };
    hourly?: { time?: string[]; uv_index?: number[] };
    daily?: { uv_index_max?: number[] };
  };
  const times = json.hourly?.time ?? [];
  const values = json.hourly?.uv_index ?? [];
  if (!times.length || times.length !== values.length)
    throw new Error("A previsão horária veio incompleta.");
  const rows = times
    .map((time, i) => ({ time, uv: Number(values[i]) }))
    .filter((x) => Number.isFinite(x.uv));
  const daylight = rows.filter(
    (x) => Number(x.time.slice(11, 13)) >= 6 && Number(x.time.slice(11, 13)) <= 18,
  );
  const chart = daylight
    .filter((_, i) => i % 2 === 0)
    .map((x) => ({ hour: x.time.slice(11, 16), uv: Math.round(x.uv * 10) / 10 }));
  return {
    currentUv: Number.isFinite(json.current?.uv_index) ? Number(json.current?.uv_index) : null,
    currentTime: json.current?.time ?? null,
    uvPeak: Math.round(Number(json.daily?.uv_index_max?.[0] ?? Math.max(...values)) * 10) / 10,
    updatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    hours: chart,
    lowWindow: rangeFor(daylight.filter((x) => x.uv > 0 && x.uv < 3)),
    highWindow: rangeFor(daylight.filter((x) => x.uv >= 8)),
    timezone: json.timezone,
  };
}

export async function searchCities(term: string): Promise<Place[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=5&language=pt&format=json`,
  );
  if (!res.ok) throw new Error("Não foi possível buscar cidades.");
  const json = (await res.json()) as { results?: Place[] };
  return json.results ?? [];
}

/**
 * Localização + previsão de UV, compartilhada entre a Home (preview
 * compacto) e /corpo (tela completa) — mesma query key, então navegar entre
 * as duas não dispara uma segunda chamada de rede.
 */
export function useSunIndex() {
  const [place, setPlace] = useState<Place | null>(null);
  const [locationState, setLocationState] = useState<
    "loading" | "located" | "denied" | "unsupported"
  >("loading");

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlace({
          name: "Sua localização",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationState("located");
      },
      () => setLocationState("denied"),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  };
  useEffect(requestLocation, []);

  const sun = useQuery({
    queryKey: ["sun", place?.latitude, place?.longitude],
    enabled: !!place,
    queryFn: () => fetchSun(place?.latitude ?? 0, place?.longitude ?? 0),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return { place, setPlace, locationState, setLocationState, requestLocation, sun };
}
