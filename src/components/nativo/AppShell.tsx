import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Notebook, ScanLine, Sparkles, User, type LucideIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";
import { useReminderScheduler } from "@/lib/reminders";

const nav: { to: "/" | "/registro" | "/scanner" | "/perfil"; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/registro", label: "Diário", icon: Notebook },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
  { to: "/perfil", label: "Perfil", icon: User },
];

type Props = {
  children: ReactNode;
  /** false em telas de tela cheia (chat) */
  nav?: boolean;
  /** false para a tela controlar o próprio espaçamento */
  padded?: boolean;
};

export function AppShell({ children, nav: showNav = true, padded = true }: Props) {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  // Virada do dia: revalida tudo à meia-noite para as missões de amanhã aparecerem.
  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 1, 0);
    const timer = window.setTimeout(() => {
      void queryClient.invalidateQueries();
    }, nextDay.getTime() - now.getTime());
    return () => window.clearTimeout(timer);
  }, [queryClient]);

  useReminderScheduler(user?.id);

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Carregando seu dia…</p>
      </div>
    );
  }

  return (
    <div
      className={
        padded
          ? "mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-36 pt-6"
          : "mx-auto flex min-h-dvh w-full max-w-lg flex-col"
      }
    >
      <main className="flex flex-1 flex-col">{children}</main>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-5 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3">
        <div className="flex flex-1 items-center justify-between rounded-full bg-card p-1.5 shadow-nav">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-secondary text-primary", "aria-current": "page" }}
              inactiveProps={{ className: "text-foreground/75 hover:text-foreground" }}
              className="press flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 text-[11px] font-medium transition-colors"
            >
              <Icon className="size-5" strokeWidth={1.7} />
              {label}
            </Link>
          ))}
        </div>
        <Link
          to="/perguntar"
          aria-label="Pergunte ao Apolo"
          className="press flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-nav transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="size-6" strokeWidth={1.8} />
        </Link>
      </div>
    </nav>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rise mb-5">
      <h1 className="text-[2rem] leading-[1.1] text-foreground">{title}</h1>
      {subtitle ? <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
