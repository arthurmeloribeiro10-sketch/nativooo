import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/animation";

export function ScoreRing({ score, size = 112 }: { score: number | null; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const reducedMotion = usePrefersReducedMotion();

  // Começa em 0 e anima até o valor real assim que monta — só uma vez,
  // não a cada re-render (evita reanimar ao revalidar a query em segundo plano).
  const [animatedScore, setAnimatedScore] = useState(reducedMotion ? (score ?? 0) : 0);
  useEffect(() => {
    if (score === null) return;
    const id = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const offset = circumference * (1 - animatedScore / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-primary-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-success transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold leading-none">
          {score === null ? "—" : animatedScore}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.12em] opacity-70">
          {score === null ? "sem dados" : "registrado"}
        </span>
      </div>
    </div>
  );
}
