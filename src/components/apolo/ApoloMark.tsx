/**
 * Marca do Apolo — um sol de raios ondulados, desenhado em SVG para não
 * depender de asset externo. Usa `currentColor`, então herda a cor do texto.
 */

function sunburstPath(rays: number, inner: number, cx: number, cy: number, r: number) {
  const step = (Math.PI * 2) / rays;
  const parts: string[] = [];
  for (let i = 0; i < rays; i++) {
    const a0 = i * step - Math.PI / 2;
    const aTip = a0 + step * 0.62;
    const a1 = a0 + step;
    const bx0 = cx + Math.cos(a0) * r * inner;
    const by0 = cy + Math.sin(a0) * r * inner;
    const tx = cx + Math.cos(aTip) * r;
    const ty = cy + Math.sin(aTip) * r;
    const bx1 = cx + Math.cos(a1) * r * inner;
    const by1 = cy + Math.sin(a1) * r * inner;
    const c0x = cx + Math.cos(a0 + step * 0.05) * r * 0.78;
    const c0y = cy + Math.sin(a0 + step * 0.05) * r * 0.78;
    const c1x = cx + Math.cos(a1 - step * 0.02) * r * 0.7;
    const c1y = cy + Math.sin(a1 - step * 0.02) * r * 0.7;
    if (i === 0) parts.push(`M ${bx0.toFixed(2)} ${by0.toFixed(2)}`);
    parts.push(`Q ${c0x.toFixed(2)} ${c0y.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)}`);
    parts.push(`Q ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${bx1.toFixed(2)} ${by1.toFixed(2)}`);
  }
  return `${parts.join(" ")} Z`;
}

export const SUNBURST_PATH = sunburstPath(16, 0.4, 50, 50, 48);

export function ApoloMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className} fill="currentColor">
      <path d={SUNBURST_PATH} />
      <circle cx="50" cy="50" r="21" />
    </svg>
  );
}

export function ApoloWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-primary ${className}`}>
      <ApoloMark className="size-7" />
      <span className="font-display text-[1.65rem] font-semibold italic leading-none tracking-tight">
        Apolo
      </span>
    </span>
  );
}
