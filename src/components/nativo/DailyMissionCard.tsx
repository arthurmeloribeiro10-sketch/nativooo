import { Check } from "lucide-react";

export function DailyMissionCard({
  title,
  detail,
  done,
  disabled,
  onToggle,
}: {
  title: string;
  detail: string;
  done: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`flex min-h-14 w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
        done
          ? "border-success/40 bg-success/10"
          : "border-border bg-background/50 hover:border-primary/40"
      }`}
    >
      <span
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          done ? "border-success bg-success text-success-foreground" : "border-border"
        }`}
      >
        {done ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-medium transition-colors duration-200 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}
