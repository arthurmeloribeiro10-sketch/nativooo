import { Sun } from "lucide-react";
import { useCountUp, usePulseOnIncrease } from "@/lib/animation";

export function CoinBalance({ balance }: { balance: number }) {
  const animated = useCountUp(balance, 600);
  const pulse = usePulseOnIncrease(balance);
  return (
    <span
      key={pulse}
      className={`flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-foreground ${pulse ? "tick glow-gold" : ""}`}
    >
      <Sun className="size-3.5 text-gold" strokeWidth={2} />
      {animated}
    </span>
  );
}
