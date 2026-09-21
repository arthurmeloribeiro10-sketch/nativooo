import { Sun } from "lucide-react";
import { useCountUp } from "@/lib/animation";

export function CoinBalance({ balance }: { balance: number }) {
  const animated = useCountUp(balance, 600);
  return (
    <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-foreground">
      <Sun className="size-3.5 text-gold" strokeWidth={2} />
      {animated}
    </span>
  );
}
