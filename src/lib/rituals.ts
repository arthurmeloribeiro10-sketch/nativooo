import { useCallback, useEffect, useState } from "react";

import { hashSeed, mulberry32 } from "@/lib/tree";

/**
 * Rituais diários — "Abrir o dia" (intenção + carta) e "Fechar o dia"
 * (humor + colheita). O estado fica no aparelho (localStorage, por usuário e
 * por dia): é leve, funciona offline e não exige migration. A interface
 * `useRitual` é o único ponto de contato, então mover isso para o Supabase
 * depois é trocar a implementação de um arquivo.
 */

export type Intention = "Presença" | "Energia" | "Calma" | "Foco" | "Leveza" | "Coragem";

export const INTENTIONS: { word: Intention; hint: string }[] = [
  { word: "Presença", hint: "Estar onde você está." },
  { word: "Energia", hint: "Mover o corpo, acordar a mente." },
  { word: "Calma", hint: "Menos pressa, mais respiro." },
  { word: "Foco", hint: "Uma coisa de cada vez." },
  { word: "Leveza", hint: "Sem culpa, sem excesso." },
  { word: "Coragem", hint: "Fazer o que vinha adiando." },
];

export type Mood = "leve" | "ok" | "pesado";

export const MOODS: { key: Mood; label: string; reply: string }[] = [
  { key: "leve", label: "Leve", reply: "Que bom. Dias leves fazem raízes fortes." },
  { key: "ok", label: "Normal", reply: "Um dia comum também é um dia que conta." },
  { key: "pesado", label: "Pesado", reply: "Dias pesados passam. Você apareceu, e isso importa." },
];

export type CardKind = "quote" | "mission" | "focus" | "golden";

export type Card = {
  key: string;
  kind: CardKind;
  title: string;
  body: string;
  pillar?: string;
  mission?: { title: string; detail: string; pillar: string };
};

const QUOTES: Card[] = [
  {
    key: "q-ontem",
    kind: "quote",
    title: "Hoje você cuidou mais da sua vida do que ontem.",
    body: "Não precisa ser muito. Precisa ser hoje.",
  },
  {
    key: "q-caminhada",
    kind: "quote",
    title: "Uma caminhada curta já conta.",
    body: "Dez minutos a pé mudam o resto do dia.",
  },
  {
    key: "q-perfeito",
    kind: "quote",
    title: "Você não precisa de um dia perfeito para continuar.",
    body: "Consistência vale mais que intensidade.",
  },
  {
    key: "q-controle",
    kind: "quote",
    title: "Menos controle. Mais consciência.",
    body: "Observe antes de corrigir.",
  },
  {
    key: "q-consistencia",
    kind: "quote",
    title: "Sua evolução acontece na consistência.",
    body: "Cada folha desta árvore foi um dia que você apareceu.",
  },
  {
    key: "q-caminho",
    kind: "quote",
    title: "Comida real, movimento e presença: você está no caminho.",
    body: "Escolha uma das três para começar.",
  },
  {
    key: "q-sol",
    kind: "quote",
    title: "O sol da manhã é um lembrete: começar cedo é começar leve.",
    body: "Consulte o UV e aproveite a luz.",
  },
  {
    key: "q-descanso",
    kind: "quote",
    title: "Descansar também é progresso.",
    body: "Sono bom é o hábito que sustenta os outros.",
  },
];

const MISSIONS: Card[] = [
  {
    key: "m-respiracao",
    kind: "mission",
    title: "Missão bônus: cinco minutos de respiração",
    body: "Sente, feche os olhos e conte dez respirações lentas. Vale uma folha extra.",
    pillar: "presenca",
    mission: {
      title: "Cinco minutos de respiração",
      detail: "Carta do dia: dez respirações lentas, sem celular por perto.",
      pillar: "presenca",
    },
  },
  {
    key: "m-grama",
    kind: "mission",
    title: "Missão bônus: pés descalços na grama",
    body: "Dois minutos de contato com o chão. Simples, e muda o humor.",
    pillar: "sol",
    mission: {
      title: "Pés descalços na grama",
      detail: "Carta do dia: dois minutos de contato com a terra.",
      pillar: "sol",
    },
  },
  {
    key: "m-agua",
    kind: "mission",
    title: "Missão bônus: água antes das refeições",
    body: "Um copo de água antes de cada refeição de hoje.",
    pillar: "habitos",
    mission: {
      title: "Beba água antes das refeições",
      detail: "Carta do dia: um copo antes de cada refeição.",
      pillar: "habitos",
    },
  },
  {
    key: "m-alongar",
    kind: "mission",
    title: "Missão bônus: alongar cinco minutos",
    body: "Pescoço, ombros, quadril. Cinco minutos, sem pressa.",
    pillar: "movimento",
    mission: {
      title: "Alongar 5 minutos",
      detail: "Carta do dia: pescoço, ombros e quadril.",
      pillar: "movimento",
    },
  },
  {
    key: "m-luz",
    kind: "mission",
    title: "Missão bônus: luz baixa antes de dormir",
    body: "Uma hora antes da cama, apague as luzes fortes e as telas.",
    pillar: "sono",
    mission: {
      title: "Luz baixa uma hora antes de dormir",
      detail: "Carta do dia: prepare o corpo para o sono.",
      pillar: "sono",
    },
  },
  {
    key: "m-semtela",
    kind: "mission",
    title: "Missão bônus: uma refeição sem tela",
    body: "Escolha uma refeição de hoje e coma só comendo.",
    pillar: "presenca",
    mission: {
      title: "Uma refeição sem tela",
      detail: "Carta do dia: só você e a comida.",
      pillar: "presenca",
    },
  },
];

const FOCUS: Record<string, Card> = {
  alimentacao: {
    key: "focus-alimentacao",
    kind: "focus",
    title: "Foco do dia: alimentação",
    body: "Seu pilar que mais pede atenção. Uma refeição só com comida de verdade já muda a média.",
    pillar: "alimentacao",
    mission: {
      title: "Uma refeição só com comida de verdade",
      detail: "Foco do dia: proteína, vegetal e um carboidrato natural.",
      pillar: "alimentacao",
    },
  },
  movimento: {
    key: "focus-movimento",
    kind: "focus",
    title: "Foco do dia: movimento",
    body: "Seu pilar que mais pede atenção. Uma caminhada de vinte minutos resolve.",
    pillar: "movimento",
    mission: {
      title: "Caminhada de 20 minutos",
      detail: "Foco do dia: uma caminhada curta já conta.",
      pillar: "movimento",
    },
  },
  sono: {
    key: "focus-sono",
    kind: "focus",
    title: "Foco do dia: sono",
    body: "Seu pilar que mais pede atenção. Hoje, luz baixa uma hora antes de dormir.",
    pillar: "sono",
    mission: {
      title: "Luz baixa uma hora antes de dormir",
      detail: "Foco do dia: prepare o corpo para descansar.",
      pillar: "sono",
    },
  },
  sol: {
    key: "focus-sol",
    kind: "focus",
    title: "Foco do dia: sol e natureza",
    body: "Seu pilar que mais pede atenção. Dez minutos ao ar livre pela manhã.",
    pillar: "sol",
    mission: {
      title: "Tempo ao ar livre pela manhã",
      detail: "Foco do dia: luz natural e um pouco de ar.",
      pillar: "sol",
    },
  },
  presenca: {
    key: "focus-presenca",
    kind: "focus",
    title: "Foco do dia: presença",
    body: "Seu pilar que mais pede atenção. Uma refeição inteira sem tela.",
    pillar: "presenca",
    mission: {
      title: "Uma refeição sem tela",
      detail: "Foco do dia: só você e a comida.",
      pillar: "presenca",
    },
  },
  habitos: {
    key: "focus-habitos",
    kind: "focus",
    title: "Foco do dia: hábitos",
    body: "Seu pilar que mais pede atenção. Um copo de água antes de cada refeição.",
    pillar: "habitos",
    mission: {
      title: "Beba água antes das refeições",
      detail: "Foco do dia: um copo antes de cada refeição.",
      pillar: "habitos",
    },
  },
};

const GOLDEN: Card = {
  key: "golden",
  kind: "golden",
  title: "Folha dourada",
  body: "Carta rara. A próxima missão que você concluir hoje vira uma folha dourada na sua árvore.",
};

export const DECK: Card[] = [...QUOTES, ...MISSIONS, ...Object.values(FOCUS), GOLDEN];

export function cardByKey(key: string | undefined): Card | null {
  if (!key) return null;
  return DECK.find((c) => c.key === key) ?? null;
}

/**
 * Sorteio da carta do dia: pesado (frase 40 %, missão 35 %, foco 15 %,
 * dourada 10 %) e determinístico por usuário + dia, então recarregar a página
 * antes de virar a carta não muda o resultado.
 */
export function drawCard(seed: string, day: string, weakestPillar: string | null): Card {
  const rng = mulberry32(hashSeed(`${seed}:${day}:card`));
  const roll = rng();
  if (roll < 0.4) return QUOTES[Math.floor(rng() * QUOTES.length)]!;
  if (roll < 0.75) return MISSIONS[Math.floor(rng() * MISSIONS.length)]!;
  if (roll < 0.9 && weakestPillar && FOCUS[weakestPillar]) return FOCUS[weakestPillar]!;
  if (roll < 0.9) return QUOTES[Math.floor(rng() * QUOTES.length)]!;
  return GOLDEN;
}

export type DailyRitual = {
  intention?: Intention;
  cardKey?: string;
  cardRevealedAt?: string;
  cardAccepted?: boolean;
  mood?: Mood;
  closedAt?: string;
  leavesAtClose?: number;
};

function ritualKey(userId: string, day: string) {
  return `apolo:ritual:${userId}:${day}`;
}

function readRitual(userId: string, day: string): DailyRitual {
  try {
    const raw = localStorage.getItem(ritualKey(userId, day));
    return raw ? (JSON.parse(raw) as DailyRitual) : {};
  } catch {
    return {};
  }
}

export function useRitual(userId: string | undefined, day: string) {
  const [ritual, setRitual] = useState<DailyRitual>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setRitual(readRitual(userId, day));
    setReady(true);
  }, [userId, day]);

  const update = useCallback(
    (patch: Partial<DailyRitual>) => {
      if (!userId) return;
      setRitual((current) => {
        const next = { ...current, ...patch };
        try {
          localStorage.setItem(ritualKey(userId, day), JSON.stringify(next));
        } catch {
          /* sem storage — o ritual vale só até recarregar */
        }
        return next;
      });
    },
    [userId, day],
  );

  return { ritual, update, ready };
}

/** Cartas guardadas — coleção exibida no Perfil. */
export function useCardCollection(userId: string | undefined) {
  const key = userId ? `apolo:cards:${userId}` : null;
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      setKeys(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setKeys([]);
    }
  }, [key]);

  const add = useCallback(
    (cardKey: string) => {
      if (!key) return;
      setKeys((current) => {
        if (current.includes(cardKey)) return current;
        const next = [...current, cardKey];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* idem */
        }
        return next;
      });
    },
    [key],
  );

  return { keys, add };
}
