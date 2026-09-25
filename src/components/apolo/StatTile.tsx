import { Link } from "@tanstack/react-router";

export type StatTone = "gold" | "primary" | "muted" | "terracotta" | "success";

const TONE_CLASS: Record<StatTone, string> = {
  gold: "text-gold-deep",
  primary: "text-primary",
  muted: "text-muted-foreground",
  terracotta: "text-terracotta",
  success: "text-success",
};

export function StatTile({
  label,
  value,
  detail,
  tone = "muted",
  to = "/corpo",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
  to?: "/corpo";
}) {
  return (
    <Link
      to={to}
      className="lift surface flex min-w-0 flex-1 flex-col p-3.5"
      aria-label={`${label}: ${value}, ${detail}. Abrir detalhes.`}
    >
      <span className="truncate text-[13px] text-muted-foreground">{label}</span>
      <span className="mt-2 font-display text-[clamp(1.25rem,6.4vw,1.7rem)] font-semibold leading-none text-foreground">
        {value}
      </span>
      <span className={`mt-2 truncate text-[13px] font-semibold ${TONE_CLASS[tone]}`}>
        {detail}
      </span>
    </Link>
  );
}
