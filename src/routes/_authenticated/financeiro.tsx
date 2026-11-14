import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl, isSubscriptionActive, MONTHLY_FEE, useMe } from "@/lib/me";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Temporada" }, { name: "description", content: "Mensalidade e histórico de pagamentos." }, { property: 'og:title', content: 'Financeiro — Temporada' }, { property: 'og:description', content: 'Mensalidade e pagamentos na Temporada.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Financeiro,
});

const methodLabel: Record<string, string> = { pix: 'QR Code PIX', boleto: 'Boleto', credito: 'Cartão de crédito', debito: 'Cartão de débito' };

function Financeiro() {
  const { data: me } = useMe();
  const pays = useQuery({
    queryKey: ["payments", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").eq("user_id", me!.user.id).order("reference_month", { ascending: false });
      return data ?? [];
    },
  });
  if (!me?.profile) return null;
  const until = me.profile.subscription_until;
  const active = isSubscriptionActive(until);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meu plano</h1>
      <div className="overflow-hidden rounded-3xl bg-ocean p-6 text-primary-foreground shadow-soft">
        <p className="text-sm opacity-80">Mensalidade</p>
        <p className="font-display text-4xl font-bold">{brl(MONTHLY_FEE)}<span className="text-base font-normal opacity-80">/mês</span></p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={active ? "secondary" : "destructive"}>{active ? "Em dia" : "Pendente"}</Badge>
          {until && <span className="text-sm opacity-80">Válida até {format(parseISO(until), "dd/MM/yyyy")}</span>}
        </div>
        <Button variant="accent" className="mt-5" onClick={() => toast.info("Pagamento online em ativação. Por enquanto, combine o pagamento com a administração.")}>
          <CreditCard /> Pagar mensalidade
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Vencimentos</h2>
        {pays.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum vencimento registrado.</p>}
        <div className="divide-y rounded-2xl border bg-card">
          <div className="hidden grid-cols-5 gap-2 p-4 text-xs font-semibold uppercase text-muted-foreground sm:grid"><span>Vencimento</span><span>Valor</span><span>Pagamento</span><span>Situação</span><span>NFPSe</span></div>
          {[...(pays.data ?? [])].sort((a, b) => a.reference_month.localeCompare(b.reference_month)).map((p) => {
            const paid = p.status === 'paid';
            return (
              <div key={p.id} className="grid grid-cols-2 gap-2 p-4 text-sm sm:grid-cols-5 sm:items-center">
                <span className="font-medium">{format(parseISO(p.reference_month), "dd/MM/yyyy")}</span>
                <b>{brl(p.amount)}</b>
                <span>{methodLabel[p.method ?? ''] ?? '—'}</span>
                <span><Badge variant={paid ? 'secondary' : 'destructive'}>{paid ? 'Pago' : 'Pendente'}</Badge></span>
                <span className={paid ? 'font-medium text-success' : 'text-muted-foreground'}>{paid ? 'NFPSe Disponível' : 'NFPSe Indisponível'}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
