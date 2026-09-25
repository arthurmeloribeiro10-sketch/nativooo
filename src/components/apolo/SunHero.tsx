import { SUNBURST_PATH } from "@/components/apolo/ApoloMark";

type Props = {
  levelLabel: string;
  completed: number;
  total: number;
  caption: string;
  loading?: boolean;
};

const MAX_SEGMENTS = 8;

/**
 * O sol do dia: nasce conforme as missões vão sendo concluídas. Com tudo
 * feito, fica alto no céu. A geometria é só CSS/SVG — sem lib.
 */
export function SunHero({ levelLabel, completed, total, caption, loading = false }: Props) {
  const progress = total > 0 ? Math.min(1, completed / total) : 0;
  // Centro do sol: só as pontas dos raios em 0, alto no céu em 1. A curva
  // (expoente 0.6) faz o sol aparecer cedo — metade visível já em 2 de 5.
  const visible = Math.pow(progress, 0.6);
  const sunY = 232 - visible * 152;
  const segments = Math.min(MAX_SEGMENTS, Math.max(total, 1));

  return (
    <section
      className="rise overflow-hidden rounded-[28px]"
      style={{ background: "var(--gradient-sky)" }}
      aria-label={`${levelLabel}. ${completed} de ${total} missões concluídas.`}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <span className="whitespace-nowrap rounded-full bg-card/85 px-3.5 py-1.5 text-[13px] font-semibold text-foreground">
          {levelLabel}
        </span>
        <span className="whitespace-nowrap rounded-full bg-card/85 px-3.5 py-1.5 text-[13px] font-semibold text-foreground">
          {loading ? "…" : `${completed} de ${total} ${total === 1 ? "missão" : "missões"}`}
        </span>
      </div>

      <svg viewBox="0 0 320 212" className="-mt-3 block h-auto w-full" aria-hidden>
        <defs>
          <radialGradient id="apolo-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--sky-glow)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--sky-glow)" stopOpacity="0" />
          </radialGradient>
          <clipPath id="apolo-sky-clip">
            <rect x="0" y="0" width="320" height="212" />
          </clipPath>
        </defs>
        <g clipPath="url(#apolo-sky-clip)">
          <circle
            className="glow-breathe"
            cx="160"
            cy={sunY}
            r="130"
            fill="url(#apolo-sun-glow)"
            style={{ transition: "cy 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
          <g className="sun-rise" style={{ transform: `translate(160px, ${sunY}px)` }}>
            <g className="sun-breathe">
              <g transform="scale(1.7)">
                <path d={SUNBURST_PATH} fill="var(--primary)" transform="translate(-50 -50)" />
                <circle r="21" fill="var(--primary)" />
              </g>
            </g>
          </g>
          <path d="M-40 190 Q160 110 360 190 L360 230 L-40 230 Z" fill="var(--hill)" />
        </g>
      </svg>

      <div className="-mt-px" style={{ background: "var(--hill)" }}>
        <p className="text-center font-editorial text-[1.35rem] italic text-foreground">
          {caption}
        </p>

        <div
          className="flex gap-2 px-5 pb-5 pt-4"
          role="img"
          aria-label={`${completed} de ${total} segmentos preenchidos`}
        >
          {Array.from({ length: segments }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                i < Math.min(completed, segments) ? "bg-primary" : "bg-sand-deep"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
