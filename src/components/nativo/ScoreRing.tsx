import { useEffect, useId, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/animation";

export function ScoreRing({
  score,
  size = 112,
  onLight = false,
}: {
  score: number | null;
  size?: number;
  /** sobre superfície clara: trilho em cor de borda em vez de branco translúcido */
  onLight?: boolean;
}) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const reducedMotion = usePrefersReducedMotion();
  const gradientId = useId();

  // Começa em 0 e anima até o valor real assim que monta — só uma vez,
  // não a cada re-render (evita reanimar ao revalidar a query em segundo plano).
  const [animatedScore, setAnimatedScore] = useState(reducedMotion ? (score ?? 0) : 0);
  useEffect(() => {
    if (score === null) return;
    const id = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const offset = circumference * (1 - animatedScore / 100);
  const complete = score !== null && score >= 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        aria-hidden
        className={`absolute inset-0 rounded-full blur-md transition-opacity duration-700 ${complete ? "opacity-70" : "opacity-40"}`}
        style={{ background: "var(--gradient-solar)" }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--terracotta)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={onLight ? "stroke-border" : "stroke-primary-foreground/20"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display font-semibold leading-none ${size >= 90 ? "text-3xl" : "text-2xl"}`}
        >
          {score === null ? "—" : animatedScore}
        </span>
        {size >= 90 ? (
          <span className="mt-1 text-[10px] uppercase tracking-[0.12em] opacity-70">
            {score === null ? "sem dados" : complete ? "dia completo" : "registrado"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
