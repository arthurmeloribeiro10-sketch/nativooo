import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade — Apollo" }] }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6">
      <Link
        to="/perfil"
        aria-label="Voltar"
        className="press inline-flex size-12 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
      >
        <ChevronLeft className="size-6" strokeWidth={2} />
      </Link>
      <h1 className="mt-6 text-[2rem] leading-tight">Privacidade</h1>
      <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-foreground/85">
        <p>
          O Apollo guarda só o que você registra: refeições, hábitos, passos, sono e suas metas.
          Esses dados ficam na sua conta e servem para montar o seu dia.
        </p>
        <p>
          Fotos de refeições são usadas apenas para gerar a descrição em texto e não são
          armazenadas. Perguntas feitas ao Apollo são enviadas ao serviço de IA para gerar a
          resposta.
        </p>
        <p>
          Você pode apagar registros a qualquer momento no Diário e pedir a exclusão da conta pelo
          e-mail de suporte.
        </p>
      </div>
    </div>
  );
}
