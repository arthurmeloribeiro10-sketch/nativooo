import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Mic, PenLine, Check } from "lucide-react";

import { AppShell, PageTitle } from "@/components/nativo/AppShell";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registrar refeição e hábitos — NATIVO" },
      {
        name: "description",
        content:
          "Registre refeições por foto, texto ou voz e marque hábitos do dia. Feedback leve, sem contagem obsessiva de calorias.",
      },
      { property: "og:title", content: "Registrar refeição e hábitos — NATIVO" },
      {
        property: "og:description",
        content: "Poucos toques para registrar seu dia e ver o Nativo Score se atualizar.",
      },
    ],
  }),
  component: RegistroPage,
});

const habitos = [
  "Exercício",
  "Caminhada",
  "Sono",
  "Ar livre",
  "Sol",
  "Hidratação",
  "Menos telas",
  "Leitura",
  "Respiração",
];

export default function RegistroPage() {
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>(["Sol", "Caminhada"]);

  return (
    <AppShell>
      <PageTitle
        title="O que entrou no seu dia?"
        subtitle="Registrar deve levar segundos. Foto, texto ou voz — o que for mais fácil agora."
      />

      <section className="surface p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Camera, label: "Foto" },
            { icon: PenLine, label: "Texto" },
            { icon: Mic, label: "Voz" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-background/60 py-5 text-xs font-medium text-foreground transition-colors hover:border-leaf"
            >
              <Icon className="size-6 text-leaf" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>

        <label htmlFor="refeicao" className="mt-6 block text-sm font-medium">
          Descreva a refeição
        </label>
        <textarea
          id="refeicao"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setEnviado(false);
          }}
          rows={3}
          placeholder="Ovos com abacate, café e uma fruta"
          className="mt-2 w-full resize-none rounded-2xl border border-input bg-background/70 p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-leaf"
        />
        <button
          type="button"
          onClick={() => setEnviado(texto.trim().length > 0)}
          className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Registrar refeição
        </button>

        {enviado ? (
          <div className="rise mt-4 rounded-2xl border border-success/40 bg-success/10 p-4">
            <p className="text-sm font-medium text-foreground">Comida real reconhecida</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Boa presença de alimentos de verdade e proteína. Para variar mais, um vegetal colorido
              cairia bem na próxima refeição.
            </p>
            <p className="mt-3 font-editorial text-sm text-accent">
              "Comida real, movimento e presença: você está no caminho."
            </p>
          </div>
        ) : null}
      </section>

      <section className="surface mt-6 p-5">
        <h2 className="text-lg">Hábitos de hoje</h2>
        <p className="mt-1 text-xs text-muted-foreground">Toque no que já aconteceu.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {habitos.map((h) => {
            const ativo = selecionados.includes(h);
            return (
              <button
                key={h}
                type="button"
                onClick={() =>
                  setSelecionados((prev) =>
                    prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h],
                  )
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  ativo
                    ? "border-leaf bg-leaf text-leaf-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:border-leaf"
                }`}
              >
                {ativo ? <Check className="size-3.5" /> : null}
                {h}
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
