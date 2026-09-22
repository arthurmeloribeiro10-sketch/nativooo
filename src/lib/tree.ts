/**
 * Modelo da "Sua Árvore" — a árvore viva da Home.
 *
 * Cada missão concluída vira uma folha; a quantidade de folhas define o
 * estágio (semente → copa cheia) e o estágio define a profundidade dos galhos.
 * A geometria é determinística: mesmo usuário + mesmo estágio = mesma árvore,
 * então ela nunca "pula" entre renders, só cresce. Nada aqui depende do DOM.
 */

export type TreeStage = {
  level: number;
  name: string;
  /** folhas necessárias para entrar neste estágio */
  min: number;
  /** níveis de ramificação a partir do tronco */
  depth: number;
  /** comprimento do tronco em unidades do viewBox */
  trunk: number;
};

export const TREE_STAGES: TreeStage[] = [
  { level: 0, name: "Semente", min: 0, depth: 0, trunk: 0 },
  { level: 1, name: "Broto", min: 1, depth: 1, trunk: 34 },
  { level: 2, name: "Muda", min: 6, depth: 2, trunk: 52 },
  { level: 3, name: "Árvore jovem", min: 16, depth: 3, trunk: 62 },
  { level: 4, name: "Árvore", min: 41, depth: 4, trunk: 68 },
  { level: 5, name: "Copa cheia", min: 91, depth: 5, trunk: 70 },
];

export function stageFor(leafCount: number) {
  let stage = TREE_STAGES[0]!;
  for (const s of TREE_STAGES) if (leafCount >= s.min) stage = s;
  const next = TREE_STAGES[stage.level + 1] ?? null;
  const progress = next ? (leafCount - stage.min) / (next.min - stage.min) : 1;
  return {
    stage,
    next,
    progress: Math.max(0, Math.min(1, progress)),
    remaining: next ? Math.max(0, next.min - leafCount) : 0,
  };
}

/** FNV-1a 32 bits — transforma qualquer string (ex.: user id) em semente numérica. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32 — rápido, determinístico e com boa distribuição para gráficos. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TREE_WIDTH = 320;
export const TREE_HEIGHT = 260;
export const GROUND_Y = 226;
export const MAX_LEAVES = 180;

export type Segment = {
  key: string;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
  width: number;
  depth: number;
};

export type Anchor = { key: string; x: number; y: number; angle: number; depth: number };

export function buildTree(seedText: string, stage: TreeStage) {
  const rng = mulberry32(hashSeed(seedText));
  const segments: Segment[] = [];
  const anchors: Anchor[] = [];
  if (stage.depth === 0) return { segments, anchors };

  const maxDepth = stage.depth;

  const grow = (
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    depth: number,
    key: string,
  ) => {
    const rad = (angle * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * length;
    const y2 = y + Math.sin(rad) * length;
    // Curvatura orgânica: ponto de controle deslocado na perpendicular do galho.
    const bend = (rng() - 0.5) * length * 0.4;
    const mx = (x + x2) / 2;
    const my = (y + y2) / 2;
    const cx = mx + -Math.sin(rad) * bend;
    const cy = my + Math.cos(rad) * bend;
    // Arredonda para 1 casa: evita divergência de ponto flutuante entre o
    // render no servidor e no navegador (hidratação) e deixa o SVG menor.
    const r1 = (v: number) => Math.round(v * 10) / 10;
    segments.push({
      key,
      x1: r1(x),
      y1: r1(y),
      cx: r1(cx),
      cy: r1(cy),
      x2: r1(x2),
      y2: r1(y2),
      width: r1(width),
      depth,
    });

    if (depth >= maxDepth - 1) anchors.push({ key, x: r1(x2), y: r1(y2), angle: r1(angle), depth });
    if (depth >= maxDepth) return;

    const children = depth === 0 && maxDepth >= 3 ? 3 : rng() < 0.32 ? 3 : 2;
    const spread = 26 + rng() * 16;
    for (let i = 0; i < children; i++) {
      const t = (i / (children - 1)) * 2 - 1; // -1 … 1
      const childAngle = angle + t * spread + (rng() - 0.5) * 14;
      const childLength = length * (0.6 + rng() * 0.18);
      grow(x2, y2, childAngle, childLength, width * 0.64, depth + 1, `${key}-${i}`);
    }
  };

  grow(
    TREE_WIDTH / 2,
    GROUND_Y,
    -90 + (rng() - 0.5) * 8,
    stage.trunk,
    4 + stage.level * 1.7,
    0,
    "t",
  );

  // Embaralha as âncoras de forma determinística para as folhas preencherem a
  // copa de modo espalhado, em vez de fecharem um lado antes do outro.
  for (let i = anchors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = anchors[i]!;
    anchors[i] = anchors[j]!;
    anchors[j] = a;
  }

  return { segments, anchors };
}

export type LeafPlacement = { x: number; y: number; rot: number; size: number };

/**
 * Posição de cada folha. A folha `i` sempre recebe a mesma posição, não
 * importa quantas existam depois dela — assim uma folha nova nunca move as
 * antigas, só aparece.
 */
export function placeLeaves(anchors: Anchor[], count: number, seedText: string): LeafPlacement[] {
  const rng = mulberry32(hashSeed(`${seedText}:leaves`));
  const out: LeafPlacement[] = [];
  if (!anchors.length) return out;
  for (let i = 0; i < count; i++) {
    const anchor = anchors[i % anchors.length]!;
    const ring = Math.floor(i / anchors.length);
    const theta = rng() * Math.PI * 2;
    const distance = ring === 0 ? rng() * 3 : (4 + ring * 4.5) * (0.5 + rng() * 0.5);
    const r1 = (v: number) => Math.round(v * 10) / 10;
    out.push({
      x: r1(anchor.x + Math.cos(theta) * distance),
      y: r1(anchor.y + Math.sin(theta) * distance - ring * 1.2),
      rot: r1(anchor.angle + 90 + (rng() - 0.5) * 80),
      size: r1(6.5 + rng() * 3),
    });
  }
  return out;
}

export type SkyPhase = "dawn" | "morning" | "midday" | "dusk" | "night";

export function skyPhase(hour: number, closed = false): SkyPhase {
  if (closed) return "night";
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "midday";
  if (hour >= 16 && hour < 19) return "dusk";
  return "night";
}

/** Arco do sol entre 5h30 e 18h30, em coordenadas do viewBox. */
export function sunPosition(hourDecimal: number) {
  const t = Math.max(0, Math.min(1, (hourDecimal - 5.5) / 13));
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return { x: r1(34 + t * (TREE_WIDTH - 68)), y: r1(178 - Math.sin(t * Math.PI) * 140) };
}

export function starField(seedText: string) {
  const rng = mulberry32(hashSeed(`${seedText}:stars`));
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return Array.from({ length: 22 }, (_, i) => ({
    key: `s${i}`,
    x: r1(8 + rng() * (TREE_WIDTH - 16)),
    y: r1(8 + rng() * 120),
    r: r1(0.5 + rng() * 1.1),
    delay: r1(rng() * 4),
  }));
}

export const PILLAR_LEAF_COLOR: Record<string, string> = {
  alimentacao: "var(--pillar-food)",
  movimento: "var(--pillar-movement)",
  sono: "var(--pillar-sleep)",
  sol: "var(--pillar-light)",
  presenca: "var(--pillar-presence)",
  habitos: "var(--pillar-habits)",
};

export const PILLAR_SHORT_LABEL: Record<string, string> = {
  alimentacao: "Alimentação",
  movimento: "Movimento",
  sono: "Sono",
  sol: "Sol e natureza",
  presenca: "Presença",
  habitos: "Hábitos",
};
