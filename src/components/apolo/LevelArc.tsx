import { SUNBURST_PATH } from "@/components/apolo/ApoloMark";
import { SUN_LEVELS } from "@/lib/levels";

type Props = { currentLevel: number };

const CX = 160;
const CY = 112;
const R = 128;

function stop(index: number) {
  const angle = Math.PI - (index / (SUN_LEVELS.length - 1)) * Math.PI;
  return { x: CX + Math.cos(angle) * R, y: CY - Math.sin(angle) * R };
}

function arcPath(from: number, to: number) {
  const a = stop(from);
  const b = stop(to);
  if (from === to) return "";
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${R} ${R} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** Arco dos níveis do sol sobre o cartão índigo — Aurora à esquerda, Solstício à direita. */
export function LevelArc({ currentLevel }: Props) {
  const currentIndex = Math.max(0, Math.min(SUN_LEVELS.length - 1, currentLevel - 1));
  const sun = stop(currentIndex);
  const light = "color-mix(in oklab, var(--primary-foreground) 45%, transparent)";

  return (
    <div>
      <svg viewBox="0 0 320 132" className="block h-auto w-full" aria-hidden>
        <line x1="20" y1={CY} x2="300" y2={CY} stroke={light} strokeWidth="2" />
        <path
          d={arcPath(currentIndex, SUN_LEVELS.length - 1)}
          fill="none"
          stroke={light}
          strokeWidth="2"
          strokeDasharray="5 6"
        />
        <path
          d={arcPath(0, currentIndex)}
          fill="none"
          stroke="var(--sun)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {SUN_LEVELS.map((level, i) => {
          const p = stop(i);
          if (i === currentIndex) return null;
          return (
            <circle
              key={level.level}
              cx={p.x}
              cy={p.y}
              r="6"
              fill={i < currentIndex ? "var(--sun)" : "var(--primary)"}
              stroke={i < currentIndex ? "var(--sun)" : light}
              strokeWidth="2"
            />
          );
        })}
        <g transform={`translate(${sun.x} ${sun.y})`}>
          <circle r="24" fill="color-mix(in oklab, var(--primary-foreground) 22%, transparent)" />
          <g transform="translate(-13 -13) scale(0.26)">
            <path d={SUNBURST_PATH} fill="var(--sun)" />
            <circle cx="50" cy="50" r="21" fill="var(--sun)" />
          </g>
        </g>
      </svg>
      <div className="-mt-1 flex justify-between text-[12px] tracking-tight">
        {SUN_LEVELS.map((level, i) => (
          <span
            key={level.level}
            className={i === currentIndex ? "font-semibold text-sun" : "text-primary-foreground/75"}
          >
            {level.name}
          </span>
        ))}
      </div>
    </div>
  );
}
