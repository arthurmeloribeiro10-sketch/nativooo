import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no NATIVO" },
      {
        name: "description",
        content:
          "Crie sua conta no NATIVO e comece a acompanhar de verdade suas missões, refeições, sol, passos e sono.",
      },
      { property: "og:title", content: "Entrar no NATIVO" },
      {
        property: "og:description",
        content: "Sua conta guarda seu progresso, seu protocolo e sua evolução.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "criar") {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: nome || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Se pedirmos confirmação, verifique seu e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo de volta.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível continuar.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="rise text-center">
        <Leaf className="mx-auto size-7 text-leaf" strokeWidth={1.6} />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-[0.22em] text-primary">
          NATIVO
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Seu estilo de vida em prática. Entre para guardar seu progresso.
        </p>
      </div>

      <div className="surface mt-8 p-6">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-secondary/60 p-1 text-sm">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full py-2 font-medium transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "criar" ? (
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="w-full rounded-2xl border border-input bg-background/70 px-4 py-3 text-sm outline-none focus:border-leaf"
            />
          ) : null}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            className="w-full rounded-2xl border border-input bg-background/70 px-4 py-3 text-sm outline-none focus:border-leaf"
          />
          <input
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoComplete={mode === "criar" ? "new-password" : "current-password"}
            className="w-full rounded-2xl border border-input bg-background/70 px-4 py-3 text-sm outline-none focus:border-leaf"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {mode === "criar" ? "Criar minha conta" : "Entrar"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full rounded-full border border-border bg-background/70 px-5 py-3 text-sm font-medium transition-colors hover:border-leaf disabled:opacity-60"
        >
          Continuar com o Google
        </button>
      </div>

      <p className="mt-6 text-center font-editorial text-sm text-accent">
        "Menos controle. Mais consciência."
      </p>
    </div>
  );
}
