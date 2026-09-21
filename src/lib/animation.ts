import { useEffect, useRef, useState } from "react";

/** Pequenos utilitários de animação em React puro + CSS — sem dependência nova. */

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Anima um número de 0 até `target` (ou direto, sem transição, com reduced-motion). */
export function useCountUp(target: number, durationMs = 800): number {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(from + (target - from) * easeOutCubic(progress)));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, reducedMotion]);

  return value;
}

/**
 * Incrementa a cada vez que `value` sobe em relação ao render anterior — nunca
 * no mount. Usar como `key` para forçar remount de um badge e disparar a
 * animação `.tick` (ex.: saldo de moedas, streak) quando o valor aumenta.
 */
export function usePulseOnIncrease(value: number): number {
  const prev = useRef(value);
  const mounted = useRef(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (mounted.current && value > prev.current) {
      setPulse((p) => p + 1);
    }
    mounted.current = true;
    prev.current = value;
  }, [value]);

  return pulse;
}

/** true assim que o elemento entra na viewport (uma vez só — para disparar animações de gráfico). */
export function useInViewport<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}
