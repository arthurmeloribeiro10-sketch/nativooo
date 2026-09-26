import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos — Apollo" }] }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6">
      <Link
        to="/perfil"
        aria-label="Voltar"
        className="press inline-flex size-12 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
      >
        <ChevronLeft className="size-6" strokeWidth={2} />
      </Link>
      <h1 className="mt-6 text-[2rem] leading-tight">Termos de uso</h1>
      <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-foreground/85">
        <p>
          O Apollo é um guia de rotina e alimentação. Ele orienta, mas não substitui médico,
          nutricionista ou outro profissional de saúde.
        </p>
        <p>
          O teste grátis do Apollo Pro dura 7 dias e pode ser cancelado a qualquer momento. Depois
          disso, a assinatura anual é cobrada conforme o valor exibido no aplicativo.
        </p>
        <p>
          Ao usar o Apollo, você concorda em registrar informações verdadeiras e em usar o
          aplicativo apenas para fins pessoais.
        </p>
      </div>
    </div>
  );
}
