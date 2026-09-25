import { Flame } from "lucide-react";

import { usePulseOnIncrease } from "@/lib/animation";
import { plural } from "@/lib/format";

export function StreakChip({ days }: { days: number }) {
  const pulse = usePulseOnIncrease(days);
  return (
    <span
      key={pulse}
      className={`flex items-center gap-1.5 rounded-full bg-sand px-3.5 py-2 text-[15px] font-semibold text-foreground ${pulse ? "tick" : ""}`}
      aria-label={`Sequência de ${plural(days, "dia")}`}
    >
      <Flame className="size-4 text-gold-deep" strokeWidth={2.2} />
      {plural(days, "dia")}
    </span>
  );
}
