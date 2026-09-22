import { useId, useMemo } from "react";

import { usePulseOnIncrease } from "@/lib/animation";
import {
  GROUND_Y,
  MAX_LEAVES,
  PILLAR_LEAF_COLOR,
  TREE_HEIGHT,
  TREE_WIDTH,
  buildTree,
  placeLeaves,
  skyPhase,
  stageFor,
  starField,
  sunPosition,
} from "@/lib/tree";

export type LeafDatum = { key: string; pillar: string; day: string };

type Props = {
  /** semente da geometria — o id do usuário, para cada árvore ser única */
  seed: string;
  /** folhas em ordem cronológica; a última é a mais recente */
  leaves: LeafDatum[];
  /** ações pendentes hoje — mostra uma folha "fantasma" na próxima vaga */
  pendingSlots?: number;
  /** contador que dispara o "pop" da folha mais nova ao subir (padrão: total de folhas) */
  popCounter?: number;
  hour: number;
  minute?: number;
  /** dia fechado pelo ritual: cena noturna, independente da hora */
  closed?: boolean;
  /** sem nenhum registro hoje já tarde: folhas caem um pouco e perdem cor */
  waiting?: boolean;
  /** dia da folha dourada — a folha mais recente desse dia fica dourada */
  goldenDay?: string | null;
  uv?: number | null;
  className?: string;
};

export function LivingTree({
  seed,
  leaves,
  pendingSlots = 0,
  popCounter,
  hour,
  minute = 0,
  closed = false,
  waiting = false,
  goldenDay = null,
  uv = null,
  className,
}: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const count = leaves.length;
  const { stage } = stageFor(count);
  const rendered = Math.min(count, MAX_LEAVES);
  const visible = count > MAX_LEAVES ? leaves.slice(count - MAX_LEAVES) : leaves;

  const model = useMemo(() => buildTree(seed, stage), [seed, stage]);
  const placements = useMemo(
    () => placeLeaves(model.anchors, rendered + 1, seed),
    [model.anchors, rendered, seed],
  );
  const stars = useMemo(() => starField(seed), [seed]);
  const pulse = usePulseOnIncrease(popCounter ?? count);

  const phase = skyPhase(hour, closed);
  const night = phase === "night";
  const sun = sunPosition(hour + minute / 60);
  const glow = 22 + Math.min(11, Math.max(0, uv ?? 4)) * 2.2;
  const ghost = pendingSlots > 0 && !closed ? placements[rendered] : undefined;
  const trunkWidth = 4 + stage.level * 1.7;

  return (
    <svg
      viewBox={`0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`}
      className={className}
      role="img"
      aria-label={`Sua árvore: ${stage.name}, ${count} ${count === 1 ? "folha" : "folhas"}`}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(--sky-${phase}-top)`} />
          <stop offset="100%" stopColor={`var(--sky-${phase}-bottom)`} />
        </linearGradient>
        <radialGradient id={`${id}-ground`} cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor={night ? "var(--ground-night)" : "var(--ground)"} />
          <stop offset="100%" stopColor={night ? "var(--sky-night-top)" : "var(--ground-deep)"} />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--sun)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-gold`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={TREE_WIDTH} height={TREE_HEIGHT} fill={`url(#${id}-sky)`} />

      {night ? (
        <g>
          {stars.map((s) => (
            <circle
              key={s.key}
              className="star"
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="var(--moon)"
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
          <circle cx={252} cy={52} r={15} fill="var(--moon)" />
          <circle cx={259} cy={47} r={13} fill="var(--sky-night-top)" opacity={0.92} />
        </g>
      ) : (
        <g>
          <circle
            className="sun-breathe"
            cx={sun.x}
            cy={sun.y}
            r={glow}
            fill={`url(#${id}-glow)`}
          />
          <circle cx={sun.x} cy={sun.y} r={11} fill="var(--sun)" />
        </g>
      )}

      <rect
        x={0}
        y={GROUND_Y}
        width={TREE_WIDTH}
        height={TREE_HEIGHT - GROUND_Y}
        fill={`url(#${id}-ground)`}
      />
      <ellipse cx={TREE_WIDTH / 2} cy={GROUND_Y + 2} rx={150} ry={12} fill={`url(#${id}-ground)`} />
      <ellipse
        cx={TREE_WIDTH / 2}
        cy={GROUND_Y + 3}
        rx={14 + stage.level * 6}
        ry={3}
        fill="var(--foreground)"
        opacity={0.14}
      />

      <g className="tree-grow" style={{ transformOrigin: `${TREE_WIDTH / 2}px ${GROUND_Y}px` }}>
        <g
          className={waiting ? "tree-sway tree-waiting" : "tree-sway"}
          style={{ transformOrigin: `${TREE_WIDTH / 2}px ${GROUND_Y}px` }}
        >
          {stage.level === 0 ? (
            <g
              transform={`translate(${TREE_WIDTH / 2} ${GROUND_Y}) scale(1.5) translate(${-TREE_WIDTH / 2} ${-GROUND_Y})`}
            >
              <ellipse cx={TREE_WIDTH / 2} cy={GROUND_Y - 1} rx={7} ry={4.5} fill="var(--bark)" />
              <path
                d={`M${TREE_WIDTH / 2} ${GROUND_Y - 3} q1 -9 0 -16`}
                stroke="var(--pillar-habits)"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />
              <g transform={`translate(${TREE_WIDTH / 2 - 4} ${GROUND_Y - 15}) rotate(-35)`}>
                <ellipse rx={5} ry={2.6} fill="var(--pillar-habits)" />
              </g>
              <g transform={`translate(${TREE_WIDTH / 2 + 4} ${GROUND_Y - 13}) rotate(35)`}>
                <ellipse rx={5} ry={2.6} fill="var(--pillar-habits)" />
              </g>
              {pendingSlots > 0 && !closed ? (
                <g transform={`translate(${TREE_WIDTH / 2} ${GROUND_Y - 24})`}>
                  <ellipse
                    className="leaf-ghost"
                    rx={6}
                    ry={3.4}
                    fill="none"
                    stroke={night ? "var(--moon)" : "var(--foreground)"}
                    strokeOpacity={0.6}
                    strokeWidth={1.4}
                    strokeDasharray="3 2"
                  />
                </g>
              ) : null}
            </g>
          ) : (
            <>
              {model.segments.map((s) => (
                <path
                  key={s.key}
                  d={`M${s.x1} ${s.y1} Q${s.cx} ${s.cy} ${s.x2} ${s.y2}`}
                  stroke="var(--bark)"
                  strokeWidth={Math.max(1.2, s.width)}
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
              <path
                d={`M${TREE_WIDTH / 2} ${GROUND_Y + 1} q-${trunkWidth * 1.4} 0 -${trunkWidth * 2.2} 3`}
                stroke="var(--bark)"
                strokeWidth={trunkWidth * 0.9}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={`M${TREE_WIDTH / 2} ${GROUND_Y + 1} q${trunkWidth * 1.4} 0 ${trunkWidth * 2.2} 3`}
                stroke="var(--bark)"
                strokeWidth={trunkWidth * 0.9}
                strokeLinecap="round"
                fill="none"
              />

              {visible.map((leaf, i) => {
                const p = placements[i];
                if (!p) return null;
                const newest = i === rendered - 1;
                const gold = newest && goldenDay !== null && leaf.day === goldenDay;
                const color = gold
                  ? "var(--gold)"
                  : (PILLAR_LEAF_COLOR[leaf.pillar] ?? "var(--pillar-habits)");
                return (
                  <g
                    key={leaf.key}
                    transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.rot + (waiting ? 30 : 0)).toFixed(1)})`}
                  >
                    <ellipse
                      key={newest ? `pop-${pulse}` : "leaf"}
                      className={newest && pulse > 0 ? "leaf-pop" : "leaf"}
                      rx={p.size}
                      ry={p.size * 0.55}
                      fill={color}
                      stroke="var(--foreground)"
                      strokeOpacity={0.1}
                      filter={gold ? `url(#${id}-gold)` : undefined}
                      style={{
                        animationDelay: newest && pulse > 0 ? undefined : `${(i % 9) * -0.4}s`,
                      }}
                    />
                  </g>
                );
              })}

              {ghost ? (
                <g
                  transform={`translate(${ghost.x.toFixed(1)} ${ghost.y.toFixed(1)}) rotate(${ghost.rot.toFixed(1)})`}
                >
                  <ellipse
                    className="leaf-ghost"
                    rx={ghost.size}
                    ry={ghost.size * 0.55}
                    fill="none"
                    stroke={night ? "var(--moon)" : "var(--foreground)"}
                    strokeOpacity={0.6}
                    strokeWidth={1.4}
                    strokeDasharray="3 2"
                  />
                </g>
              ) : null}
            </>
          )}
        </g>
      </g>
    </svg>
  );
}
