import { Link } from "@tanstack/react-router";
import { Apple, Footprints, Moon, Smartphone, Sun, Sparkles, type LucideIcon } from "lucide-react";

const PILLAR_ICON: Record<string, LucideIcon> = {
  alimentacao: Apple,
  movimento: Footprints,
  sono: Moon,
  sol: Sun,
  presenca: Smartphone,
  habitos: Sparkles,
};

const PILLAR_COLOR: Record<string, string> = {
  alimentacao: "var(--pillar-food)",
  movimento: "var(--pillar-movement)",
  sono: "var(--pillar-sleep)",
  sol: "var(--pillar-light)",
  presenca: "var(--pillar-presence)",
  habitos: "var(--pillar-habits)",
};

export function PillarCard({
  pillarKey,
  label,
  score,
  trend,
  href,
}: {
  pillarKey: string;
  label: string;
  score: number | null;
  /** últimos dias, null quando não há dado real para aquele dia */
  trend: Array<number | null>;
  href: string;
}) {
  const Icon = PILLAR_ICON[pillarKey] ?? Sparkles;
  const color = PILLAR_COLOR[pillarKey] ?? "var(--primary)";

  return (
    <Link
      to={href}
      className="lift surface flex w-40 shrink-0 flex-col gap-2 p-4 snap-start sm:w-auto"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, var(--border))`,
        backgroundImage: `linear-gradient(165deg, color-mix(in oklab, ${color} 10%, var(--card)), var(--card) 65%)`,
      }}
    >
      <span
        className="flex size-8 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold text-foreground">
        {score === null ? "—" : `${score}%`}
      </p>

      {trend.some((v) => v !== null) ? (
        <div
          className="flex h-6 items-end gap-1"
          role="img"
          aria-label={`Últimos dias de ${label}`}
        >
          {trend.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-[height] duration-500"
              style={{
                height: v === null ? 2 : `${Math.max((v / 100) * 24, 3)}px`,
                backgroundColor: v === null ? "var(--border)" : color,
                opacity: v === null ? 1 : 0.35 + (v / 100) * 0.65,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">Sem histórico de 7 dias ainda</p>
      )}
    </Link>
  );
}
