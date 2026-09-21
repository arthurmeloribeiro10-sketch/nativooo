import { useInViewport, usePrefersReducedMotion } from "@/lib/animation";

export type WeeklyBarPoint = { label: string; value: number | null };

/** Barras de 0 até o valor real quando o gráfico entra na viewport. */
export function WeeklyBarChart({ data }: { data: WeeklyBarPoint[] }) {
  const [ref, inView] = useInViewport<HTMLDivElement>();
  const reducedMotion = usePrefersReducedMotion();
  const animate = inView || reducedMotion;

  return (
    <div ref={ref} className="flex h-28 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div
            className={`w-full rounded-t ${d.value === null ? "bg-border" : "bg-primary/80"} transition-[height] duration-700 ease-out`}
            style={{
              height: d.value === null ? 3 : animate ? `${Math.max(d.value * 0.75, 4)}px` : 0,
              transitionDelay: `${i * 40}ms`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
