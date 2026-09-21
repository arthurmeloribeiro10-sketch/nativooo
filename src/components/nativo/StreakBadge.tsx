import { Flame } from "lucide-react";
import { plural } from "@/lib/format";

export function StreakBadge({ days, onClick }: { days: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full bg-terracotta/15 px-2.5 py-1 text-xs font-semibold text-foreground"
    >
      <Flame className="size-3.5 text-terracotta" strokeWidth={2} />
      {plural(days, "dia")}
    </button>
  );
}
