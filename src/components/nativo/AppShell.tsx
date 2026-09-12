import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, ListChecks, Salad, Sun, Users, User, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Início", icon: Home },
  { to: "/registro", label: "Registrar", icon: ListChecks },
  { to: "/dieta", label: "Dieta", icon: Salad },
  { to: "/corpo", label: "Corpo", icon: Sun },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 1, 0);
    const timer = window.setTimeout(() => {
      void queryClient.invalidateQueries();
    }, nextDay.getTime() - now.getTime());
    return () => window.clearTimeout(timer);
  }, [queryClient]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Carregando seu dia…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-32 pt-5 sm:px-6 sm:pt-7">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-[0.22em] text-primary">NATIVO</span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth" });
          }}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-leaf hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-3.5" strokeWidth={1.6} />
          Sair
        </button>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-stretch justify-between px-1 py-2 sm:px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-secondary text-primary", "aria-current": "page" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors hover:text-primary sm:text-[11px]"
            >
              <Icon className="size-5" strokeWidth={1.6} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rise mb-5">
      <h1 className="text-3xl text-foreground">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
