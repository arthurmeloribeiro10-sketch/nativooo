import { Link } from "@tanstack/react-router";

export type StatTone = "gold" | "primary" | "muted" | "terracotta" | "success";
export type StatVariant = "yellow" | "peach" | "blue";

const TONE_CLASS: Record<StatTone, string> = {
  gold: "text-gold-deep",
  primary: "text-primary",
  muted: "text-muted-foreground",
  terracotta: "text-terracotta-deep",
  success: "text-success",
};

/** Fundo e rótulo por tile — como no design: UV amarelo, passos pêssego, sono azul. */
const VARIANT_CLASS: Record<StatVariant, { card: string; label: string; detail: StatTone }> = {
  yellow: { card: "bg-tile-yellow", label: "text-gold-deep", detail: "gold" },
  peach: { card: "bg-tile-peach", label: "text-terracotta-deep", detail: "terracotta" },
  blue: { card: "bg-secondary", label: "text-primary", detail: "primary" },
};

export function StatTile({
  label,
  value,
  detail,
  variant,
  tone,
  to = "/corpo",
}: {
  label: string;
  value: string;
  detail: string;
  variant: StatVariant;
  /** sobrescreve a cor do detalhe (ex.: "muted" quando ainda não há registro) */
  tone?: StatTone;
  to?: "/corpo";
}) {
  const v = VARIANT_CLASS[variant];
  return (
    <Link
      to={to}
      className={`lift flex min-w-0 flex-1 flex-col rounded-3xl p-3.5 ${v.card}`}
      aria-label={`${label}: ${value}, ${detail}. Abrir detalhes.`}
    >
      <span className={`truncate text-[13px] ${v.label}`}>{label}</span>
      <span className="mt-2 font-display text-[clamp(1.25rem,6.4vw,1.7rem)] font-semibold leading-none tracking-[-0.02em] text-foreground">
        {value}
      </span>
      <span className={`mt-2 truncate text-[13px] font-semibold ${TONE_CLASS[tone ?? v.detail]}`}>
        {detail}
      </span>
    </Link>
  );
}
