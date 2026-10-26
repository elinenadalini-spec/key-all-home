import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CreditCard, LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { accountLabel, isSubscriptionActive, useMe } from "@/lib/me";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/painel", label: "Imóveis", icon: CalendarDays },
    { to: "/perfil", label: "Cadastro", icon: UserRound },
    { to: "/financeiro", label: "Financeiro", icon: CreditCard },
    ...(me?.isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ] as const;

  const active = isSubscriptionActive(me?.profile?.subscription_until);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/painel" className="font-display text-xl font-bold text-primary">
            Temporada
          </Link>
          <nav className="hidden gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {me?.profile && (
              <Badge variant={active ? "secondary" : "destructive"} className="hidden sm:inline-flex">
                {accountLabel[me.profile.account_type]} · {active ? "Em dia" : "Mensalidade pendente"}
              </Badge>
            )}
            <button onClick={signOut} aria-label="Sair" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
        <div className="mx-auto flex max-w-md justify-around py-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
