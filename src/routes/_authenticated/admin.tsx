import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, format, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { accountLabel, brl, isSubscriptionActive, MONTHLY_FEE, useMe, type Profile } from "@/lib/me";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TERM_KEYS, useTerms, type TermKey } from "@/lib/terms";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — Temporada" }, { name: "description", content: "Aprovação de CRECI e mensalidades." }, { property: 'og:title', content: 'Administração — Temporada' }, { property: 'og:description', content: 'Gestão de profissionais, mensalidades e termos.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Admin,
});

function Admin() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({
    queryKey: ["admin-users"],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
  if (!me?.isAdmin) return <p>Acesso restrito ao administrador.</p>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  async function setCreci(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("profiles").update({ creci_status: status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "CRECI aprovado" : "CRECI recusado");
    refresh();
  }

  async function registerPayment(u: Profile) {
    const today = new Date();
    const base = u.subscription_until && parseISO(u.subscription_until) > today ? parseISO(u.subscription_until) : today;
    const next = format(addMonths(base, 1), "yyyy-MM-dd");
    const { error } = await supabase.from("payments").insert({
      user_id: u.id,
      amount: MONTHLY_FEE,
      reference_month: format(base, "yyyy-MM-01"),
      method: "manual",
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("profiles").update({ subscription_until: next }).eq("id", u.id);
    toast.success(`Mensalidade registrada até ${format(parseISO(next), "dd/MM/yyyy")}`);
    refresh();
  }

  const all = users.data ?? [];
  const pending = all.filter((u) => u.creci_status === "pending");
  const filtered = all.filter((u) => [u.full_name, u.company_name, u.email, u.creci].join(" ").toLowerCase().includes(q.toLowerCase()));
  const activeCount = all.filter((u) => isSubscriptionActive(u.subscription_until)).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Administração</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat l="Usuários" v={all.length} />
        <Stat l="Em dia" v={activeCount} />
        <Stat l="Receita/mês" v={brl(activeCount * MONTHLY_FEE)} />
      </div>
      <Tabs defaultValue="creci">
        <TabsList>
          <TabsTrigger value="creci">CRECI ({pending.length})</TabsTrigger>
          <TabsTrigger value="users">Usuários e mensalidades</TabsTrigger>
          <TabsTrigger value="termos">Termos</TabsTrigger>
        </TabsList>
        <TabsContent value="creci" className="space-y-2 pt-4">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Nenhum CRECI aguardando análise.</p>}
          {pending.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div>
                <b>{u.company_name || u.full_name}</b> <Badge variant="secondary">{accountLabel[u.account_type]}</Badge>
                <p className="text-sm text-muted-foreground">CRECI {u.creci}/{u.creci_uf} · {u.email}</p>
                <a className="text-xs text-primary underline" href="https://www.cofeci.gov.br/consulta-cadastro-nacional" target="_blank" rel="noreferrer">Consultar no COFECI</a>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => setCreci(u.id, "approved")}>Aprovar</Button>
                <Button size="sm" variant="outline" onClick={() => setCreci(u.id, "rejected")}>Recusar</Button>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="users" className="space-y-3 pt-4">
          <Input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          {filtered.map((u) => {
            const ok = isSubscriptionActive(u.subscription_until);
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div className="min-w-0">
                  <b>{u.company_name || u.full_name || u.email}</b> <Badge variant="secondary">{accountLabel[u.account_type]}</Badge>
                  <p className="text-sm text-muted-foreground">
                    {u.email} · {ok ? `em dia até ${format(parseISO(u.subscription_until!), "dd/MM/yyyy")}` : "mensalidade pendente"}
                  </p>
                </div>
                <Button size="sm" variant={ok ? "outline" : "accent"} onClick={() => registerPayment(u)}>Registrar pagamento</Button>
              </div>
            );
          })}
        </TabsContent>
        <TabsContent value="termos" className="space-y-4 pt-4"><TermsEditor /></TabsContent>
      </Tabs>
    </div>
  );
}

function TermsEditor() {
  const { data: terms } = useTerms();
  const qc = useQueryClient();
  if (!terms) return null;
  const labels: Record<TermKey, string> = { geral: "Cláusulas gerais", proprietario: "Proprietário", corretor: "Corretor / Imobiliária" };
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rows = TERM_KEYS.map((k) => ({ id: k, title: String(f.get(`${k}-title`)), body: String(f.get(`${k}-body`)), updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("app_terms").upsert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success("Termos atualizados");
    qc.invalidateQueries({ queryKey: ["terms"] });
  }
  return (
    <form onSubmit={save} className="space-y-5">
      <p className="text-sm text-muted-foreground">Este texto aparece quando o proprietário autoriza e quando o corretor pede autorização.</p>
      {TERM_KEYS.map((k) => (
        <div key={k} className="space-y-2 rounded-2xl border bg-card p-4">
          <Label>{labels[k]} — título</Label>
          <Input name={`${k}-title`} defaultValue={terms[k].title} />
          <Label>Texto</Label>
          <Textarea name={`${k}-body`} rows={8} defaultValue={terms[k].body} />
        </div>
      ))}
      <Button>Salvar termos</Button>
    </form>
  );
}

function Stat({ l, v }: { l: string; v: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{l}</p>
      <p className="font-display text-xl font-bold">{v}</p>
    </div>
  );
}
