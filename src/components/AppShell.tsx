import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, CreditCard, FileCheck2, LogOut, PlusCircle, ShieldCheck, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
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

  const ownerMode = !!me?.isOwner && !me.isAdmin;
  const [cadOpen, setCadOpen] = useState(false);
  const item = "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-foreground bg-card hover:bg-muted";
  const on = { className: "bg-primary text-primary-foreground border-primary hover:bg-primary" };
  const ownerNav = (
    <nav className="space-y-2" aria-label="Menu do proprietário">
      <Link to="/cadastrar-imovel" className={item} activeProps={{ className: "bg-accent text-accent-foreground border-accent hover:bg-accent" }}><PlusCircle className="h-4 w-4" />Cadastrar Imóvel</Link>
      <Link to="/painel" className={item} activeProps={on}><CalendarDays className="h-4 w-4" />Meus Imóveis</Link>
      <button type="button" className={item} aria-expanded={cadOpen} onClick={() => setCadOpen(!cadOpen)}><UserRound className="h-4 w-4" />Cadastro<ChevronDown className={`ml-auto h-4 w-4 transition-transform ${cadOpen ? "rotate-180" : ""}`} /></button>
      {cadOpen && <div className="space-y-2 pl-4">
        <Link to="/perfil" className={item} activeProps={on}>Meu Cadastro</Link>
        <Link to="/profissionais" className={item} activeProps={on}>Cadastro Profissionais</Link>
      </div>}
      <Link to="/autorizacoes" className={item} activeProps={on}><FileCheck2 className="h-4 w-4" />Autorizações</Link>
      <Link to="/financeiro" className={item} activeProps={on}><CreditCard className="h-4 w-4" />Meu Plano</Link>
    </nav>
  );

  const active = isSubscriptionActive(me?.profile?.subscription_until);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/painel" className="font-display text-xl font-bold text-primary">
            PropKey
          </Link>
          <nav className={ownerMode ? "hidden" : "hidden gap-1 md:flex"}>
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
      {ownerMode ? (
        <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
          <aside className="hidden w-56 shrink-0 md:block"><div className="sticky top-20">{ownerNav}</div></aside>
          <main className="min-w-0 flex-1"><div className="mb-4 md:hidden">{ownerNav}</div>{children}</main>
        </div>
      ) : <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>}
      <nav className={ownerMode ? "hidden" : "fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden"}>
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
