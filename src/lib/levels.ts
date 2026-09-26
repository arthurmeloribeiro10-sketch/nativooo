/**
 * Níveis do sol — a evolução do usuário no Apollo é contada em missões
 * concluídas (todas, desde o começo). Cada nível é uma fase do dia: o sol
 * nasce na Aurora e chega ao Solstício.
 */

export type SunLevel = {
  level: number;
  name: string;
  /** missões concluídas necessárias para entrar no nível */
  min: number;
};

export const SUN_LEVELS: SunLevel[] = [
  { level: 1, name: "Aurora", min: 0 },
  { level: 2, name: "Amanhecer", min: 15 },
  { level: 3, name: "Manhã", min: 50 },
  { level: 4, name: "Zênite", min: 120 },
  { level: 5, name: "Solstício", min: 250 },
];

export function levelFor(missionsDone: number) {
  let current = SUN_LEVELS[0]!;
  for (const level of SUN_LEVELS) if (missionsDone >= level.min) current = level;
  const next = SUN_LEVELS[current.level] ?? null;
  const progress = next ? (missionsDone - current.min) / (next.min - current.min) : 1;
  return {
    current,
    next,
    progress: Math.max(0, Math.min(1, progress)),
    remaining: next ? Math.max(0, next.min - missionsDone) : 0,
  };
}
