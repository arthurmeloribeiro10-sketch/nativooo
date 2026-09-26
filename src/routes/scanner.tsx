import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, ChevronLeft, ScanLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/nativo/AppShell";
import { ScanResultPreview, type ScanResultData } from "@/components/apolo/ScanResultPreview";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — Apollo" },
      {
        name: "description",
        content: "Aponte para o rótulo e veja o que tem de verdade no produto.",
      },
      { property: "og:title", content: "Scanner — Apollo" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScannerPage,
});

// Exemplo de resultado — mostra a tela final enquanto a leitura de código
// de barras ainda está sendo configurada (ver src/lib/scanner).
const SAMPLE: ScanResultData = {
  name: "Granola tradicional com mel",
  brand: "[Marca]",
  weight: "250 g",
  score: 46,
  verdict: "Dá pra escolher melhor",
  verdictDetail: "Não é proibido. Só existe opção mais simples.",
  negatives: ["Açúcar é o 2º ingrediente", "Óleo de soja refinado", "Aromatizante"],
  positives: ["Aveia integral como base", "Sem corantes"],
  ingredients:
    "aveia em flocos, açúcar, óleo de soja, mel, flocos de arroz, uva-passa, sal, aromatizante.",
  alternatives: [
    { score: 84, name: "Granola sem açúcar", detail: "5 ingredientes" },
    { score: 95, name: "Aveia em flocos + mel", detail: "Você mesmo monta" },
  ],
};

function ScannerPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(false);

  if (preview) {
    return (
      <AppShell>
        <header className="rise flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPreview(false)}
            aria-label="Voltar"
            className="press flex size-12 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
          >
            <ChevronLeft className="size-6" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-semibold tracking-normal">Resultado</h1>
          <button
            type="button"
            onClick={() => toast("Salvar produtos chega junto com o scanner.")}
            aria-label="Salvar produto"
            className="press flex size-12 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
          >
            <Bookmark className="size-5" strokeWidth={1.8} />
          </button>
        </header>
        <div className="rise mt-5" style={{ "--stagger": "70ms" } as React.CSSProperties}>
          <ScanResultPreview data={SAMPLE} />
        </div>
        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          Exemplo ilustrativo. O resultado real aparece aqui quando o scanner estiver configurado.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rise">
        <h1 className="text-[clamp(1.75rem,7.8vw,2.1rem)] leading-[1.12]">Scanner</h1>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Saiba o que tem de verdade em cada rótulo.
        </p>
      </div>

      <section
        className="surface rise mt-6 flex flex-col items-center p-8 text-center"
        style={{ "--stagger": "70ms" } as React.CSSProperties}
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-primary">
          <ScanLine className="size-9" strokeWidth={1.6} />
        </span>
        <h2 className="mt-5 text-[1.6rem] leading-tight">Em configuração</h2>
        <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
          A leitura de código de barras está sendo preparada. Em breve você aponta a câmera para o
          rótulo e recebe a Nota Apollo na hora.
        </p>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="press mt-6 min-h-12 rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-foreground"
        >
          Ver exemplo de resultado
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/registro" })}
          className="press mt-3 min-h-12 rounded-full px-6 text-[15px] font-medium text-primary"
        >
          Registrar refeição no Diário
        </button>
      </section>
    </AppShell>
  );
}
