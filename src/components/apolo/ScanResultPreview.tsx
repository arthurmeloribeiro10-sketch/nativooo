import { AlertCircle, Check } from "lucide-react";

export type ScanResultData = {
  name: string;
  brand: string;
  weight: string;
  score: number;
  verdict: string;
  verdictDetail: string;
  negatives: string[];
  positives: string[];
  ingredients: string;
  alternatives: { score: number; name: string; detail: string }[];
};

const BANDS = [
  { label: "Evite", className: "bg-terracotta/35" },
  { label: "Moderação", className: "bg-gold/45" },
  { label: "Bom", className: "bg-secondary" },
  { label: "Ótimo", className: "bg-primary" },
];

function ScoreRing({ score }: { score: number }) {
  const size = 104;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--sand)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--foreground)"
        fontFamily="var(--font-display)"
        fontWeight="600"
        fontSize="34"
      >
        {score}
      </text>
    </svg>
  );
}

/** Tela de resultado do scanner, alimentada por dados. */
export function ScanResultPreview({ data }: { data: ScanResultData }) {
  return (
    <div>
      <section className="surface p-6 text-center">
        <svg viewBox="0 0 120 150" className="mx-auto h-40 w-auto" aria-hidden>
          <path
            d="M18 10 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 v130 a10 10 0 0 1 -10 10 h-84 a10 10 0 0 1 -10 -10 z"
            fill="var(--sand-deep)"
          />
          <circle cx="60" cy="45" r="9" fill="var(--gold)" opacity="0.7" />
          <rect x="30" y="66" width="60" height="48" rx="10" fill="var(--card)" />
          <rect x="42" y="82" width="36" height="5" rx="2.5" fill="var(--sand-deep)" />
          <rect x="42" y="95" width="36" height="5" rx="2.5" fill="var(--sand-deep)" />
        </svg>
        <h2 className="mt-4 text-[1.8rem] leading-tight">{data.name}</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {data.brand} · {data.weight}
        </p>
      </section>

      <section className="surface mt-4 p-6">
        <div className="flex items-center gap-5">
          <ScoreRing score={data.score} />
          <div className="min-w-0">
            <p className="eyebrow">Nota Apolo</p>
            <h3 className="mt-1 text-[1.5rem] leading-tight">{data.verdict}</h3>
            <p className="mt-1 text-[15px] leading-snug text-muted-foreground">
              {data.verdictDetail}
            </p>
          </div>
        </div>
        <div className="relative mt-5">
          <div className="flex gap-1.5">
            {BANDS.map((band) => (
              <span key={band.label} className={`h-2 flex-1 rounded-full ${band.className}`} />
            ))}
          </div>
          <span
            className="absolute -top-1 h-4 w-1 rounded-full bg-foreground"
            style={{ left: `calc(${data.score}% - 2px)` }}
            aria-hidden
          />
          <div className="mt-2 flex gap-1.5 text-[12px] text-muted-foreground">
            {BANDS.map((band) => (
              <span key={band.label} className="flex-1 truncate">
                {band.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="surface mt-4 p-6">
        <h3 className="font-sans text-[1.1rem] font-semibold tracking-normal">O que pesa</h3>
        <ul className="mt-3 space-y-2">
          {data.negatives.map((item) => (
            <li key={item} className="flex items-center gap-3 text-[16px]">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-gold-deep">
                <AlertCircle className="size-4" strokeWidth={2.2} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <h3 className="mt-6 border-t border-border pt-5 font-sans text-[1.1rem] font-semibold tracking-normal">
          O que é bom
        </h3>
        <ul className="mt-3 space-y-2">
          {data.positives.map((item) => (
            <li key={item} className="flex items-center gap-3 text-[16px]">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Check className="size-4" strokeWidth={2.4} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground">
          Ingredientes: {data.ingredients}
        </p>
      </section>

      <h3 className="mt-7 px-1 text-[1.5rem]">Troque por</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {data.alternatives.map((alt) => (
          <div key={alt.name} className="surface p-5">
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-[13px] font-semibold text-primary-foreground">
              {alt.score}
            </span>
            <p className="mt-3 text-[16px] font-semibold leading-tight">{alt.name}</p>
            <p className="mt-1 text-[14px] text-muted-foreground">{alt.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
