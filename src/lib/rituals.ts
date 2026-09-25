import { useCallback, useEffect, useState } from "react";

/**
 * Intenção do dia — uma palavra que vira o título da Home
 * ("Hoje é dia de energia."). Fica no aparelho, por usuário e por dia.
 */

export type Intention = "Presença" | "Energia" | "Calma" | "Foco" | "Leveza" | "Coragem";

export const INTENTIONS: { word: Intention; hint: string }[] = [
  { word: "Energia", hint: "Mover o corpo, acordar a mente." },
  { word: "Presença", hint: "Estar onde você está." },
  { word: "Calma", hint: "Menos pressa, mais respiro." },
  { word: "Foco", hint: "Uma coisa de cada vez." },
  { word: "Leveza", hint: "Sem culpa, sem excesso." },
  { word: "Coragem", hint: "Fazer o que vinha adiando." },
];

export type DailyRitual = {
  intention?: Intention;
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
          /* sem storage — vale só até recarregar */
        }
        return next;
      });
    },
    [userId, day],
  );

  return { ritual, update, ready };
}
