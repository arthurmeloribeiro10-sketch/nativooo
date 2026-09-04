import { useEffect } from "react";
import { Trophy } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onDone: () => void;
};

const sparks = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return { x: Math.cos(angle) * 90, y: Math.sin(angle) * 90, delay: i * 0.03 };
});

export function AchievementBurst({ open, title, subtitle, onDone }: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />
      <div className="pop-in relative flex flex-col items-center gap-3 rounded-3xl border border-gold/40 bg-card px-8 py-7 text-center shadow-lifted">
        <span
          className="absolute size-24 rounded-full bg-gold/40"
          style={{ animation: "nativo-ring 1.1s ease-out both" }}
        />
        {sparks.map((s, i) => (
          <span
            key={i}
            className="absolute size-2 rounded-full bg-gold"
            style={
              {
                "--spark-x": `${s.x}px`,
                "--spark-y": `${s.y}px`,
                animation: `nativo-spark 1.1s ease-out ${s.delay}s both`,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="relative flex size-14 items-center justify-center rounded-full bg-gold/20">
          <Trophy className="size-7 text-gold" strokeWidth={1.6} />
        </span>
        <p className="relative font-display text-xl font-semibold text-foreground">{title}</p>
        {subtitle ? (
          <p className="relative max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
