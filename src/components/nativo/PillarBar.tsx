export function PillarBar({
  label,
  score,
  note,
}: {
  label: string;
  score: number | null;
  note?: string;
}) {
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs font-medium text-muted-foreground">
          {score === null ? "Sem registro" : `${score}%`}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-leaf transition-[width] duration-700 ease-out"
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
      {note ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  );
}
