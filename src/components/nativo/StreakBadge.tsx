import { Flame } from "lucide-react";
import { plural } from "@/lib/format";
import { usePulseOnIncrease } from "@/lib/animation";

export function StreakBadge({ days, onClick }: { days: number; onClick?: () => void }) {
  const pulse = usePulseOnIncrease(days);
  return (
    <button
      key={pulse}
      type="button"
      onClick={onClick}
      className={`lift flex items-center gap-1 rounded-full bg-terracotta/15 px-2.5 py-1 text-xs font-semibold text-foreground ${pulse ? "tick" : ""}`}
    >
      <Flame className="size-3.5 text-terracotta" strokeWidth={2} />
      {plural(days, "dia")}
    </button>
  );
}
