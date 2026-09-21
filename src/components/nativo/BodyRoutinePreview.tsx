import { Link } from "@tanstack/react-router";
import { ArrowRight, Footprints, Moon, Sun } from "lucide-react";

function PreviewCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border/70 bg-background/50 p-3.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-1.5 font-display text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export function BodyRoutinePreview({
  uv,
  uvPeakTime,
  steps,
  stepGoal,
  sleepHours,
  sleepQualityLabel,
}: {
  uv: number | null;
  uvPeakTime: string | null;
  steps: number | null;
  stepGoal: number;
  sleepHours: number | null;
  sleepQualityLabel: string | null;
}) {
  return (
    <section className="surface mt-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg">Corpo e rotina</h2>
        <Link to="/corpo" className="flex items-center gap-1 text-xs font-medium text-primary">
          Ver detalhes <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="mt-4 flex gap-2.5 overflow-x-auto">
        <PreviewCard
          icon={<Sun className="size-3.5 text-gold" />}
          label="Índice UV"
          value={uv === null ? "—" : uv.toString()}
          detail={
            uv === null
              ? "Ative a localização em Corpo"
              : uvPeakTime
                ? `Pico às ${uvPeakTime}`
                : "Atualizado agora"
          }
        />
        <PreviewCard
          icon={<Footprints className="size-3.5 text-leaf" />}
          label="Movimento"
          value={steps === null ? "—" : steps.toLocaleString("pt-BR")}
          detail={
            steps === null
              ? "Ainda não registrado hoje"
              : `${Math.min(100, Math.round((steps / stepGoal) * 100))}% da meta`
          }
        />
        <PreviewCard
          icon={<Moon className="size-3.5 text-accent" />}
          label="Sono"
          value={
            sleepHours === null
              ? "—"
              : `${Math.floor(sleepHours)}h ${Math.round((sleepHours % 1) * 60)}min`
          }
          detail={
            sleepHours === null ? "Ainda não registrado" : (sleepQualityLabel ?? "Registrado")
          }
        />
      </div>
    </section>
  );
}
