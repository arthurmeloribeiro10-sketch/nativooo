import type { MissionRow } from "@/lib/nativo-queries";

type Props = {
  mission: MissionRow | null;
  total: number;
  loading: boolean;
  busy: boolean;
  onComplete: () => void;
  onDefer: () => void;
};

export function NextMissionCard({ mission, total, loading, busy, onComplete, onDefer }: Props) {
  return (
    <section
      className="surface rise mt-4 p-6"
      style={{ "--stagger": "70ms" } as React.CSSProperties}
    >
      <span className="inline-block rounded-full bg-tile-yellow px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-deep">
        Próxima missão
      </span>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-7 w-3/4 rounded-full bg-muted" />
          <div className="h-4 w-full rounded-full bg-muted" />
        </div>
      ) : mission ? (
        <>
          <h2 className="mt-3 text-[1.5rem] leading-tight">{mission.title}</h2>
          {mission.detail ? (
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {mission.detail}
            </p>
          ) : null}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onComplete}
              className="press min-h-12 rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              Concluir
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onDefer}
              className="press min-h-12 rounded-full border border-sand-deep bg-card px-6 text-[15px] font-medium text-foreground disabled:opacity-60"
            >
              Depois
            </button>
          </div>
        </>
      ) : total > 0 ? (
        <>
          <h2 className="mt-3 text-[1.5rem] leading-tight">Tudo feito por hoje.</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Seu sol está alto. Amanhã tem missões novas esperando por você.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-[1.5rem] leading-tight">Suas missões estão chegando.</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Assim que o dia carregar, a primeira ação aparece aqui.
          </p>
        </>
      )}
    </section>
  );
}
