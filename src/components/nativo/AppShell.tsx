import { Link } from "@tanstack/react-router";
import { Home, Camera, Salad, Sun, Users, User } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/registro", label: "Registrar", icon: Camera },
  { to: "/dieta", label: "Dieta", icon: Salad },
  { to: "/corpo", label: "Corpo", icon: Sun },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 pb-28 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-[0.22em] text-primary">NATIVO</span>
        </Link>
        <span className="hidden text-xs text-muted-foreground sm:block">
          Seu estilo de vida em prática.
        </span>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-stretch justify-between px-3 py-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors hover:text-primary"
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
    <div className="rise mb-6">
      <h1 className="text-3xl text-foreground">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
