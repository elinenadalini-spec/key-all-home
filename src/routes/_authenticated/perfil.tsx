import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { accountLabel, useMe, type Profile } from "@/lib/me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu cadastro — Temporada" }, { name: "description", content: "Dados pessoais, contatos e bancários." }, { property: 'og:title', content: 'Meu cadastro — Temporada' }, { property: 'og:description', content: 'Cadastro pessoal e contatos na Temporada.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Perfil,
});

const statusLabel: Record<string, string> = { pending: "Em análise", approved: "Aprovado", rejected: "Recusado", not_required: "" };

function Perfil() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const p = me?.profile;
  if (!p) return null;
  const agent = p.account_type !== "owner";

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const { error } = await supabase.from("profiles").update(f as Partial<Profile>).eq("id", p!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cadastro atualizado");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Meu cadastro</h1>
        <Badge variant="secondary">{accountLabel[p.account_type]}</Badge>
      </div>

      <Section title="Dados pessoais">
        <F n="full_name" l="Nome completo" v={p.full_name} />
        {p.account_type === "agency" && <F n="company_name" l="Nome da imobiliária" v={p.company_name} />}
        <F n="document" l={p.account_type === "agency" ? "CNPJ" : "CPF"} v={p.document} />
        <F n="address" l="Endereço" v={p.address} />
        <F n="city" l="Cidade / UF" v={p.city} />
      </Section>

      <Section title="Contatos">
        <F n="phone" l="Telefone" v={p.phone} />
        <F n="whatsapp" l="WhatsApp" v={p.whatsapp} />
        <div className="space-y-1.5"><Label>E-mail</Label><Input value={p.email ?? ""} disabled /></div>
      </Section>

      {agent && (
        <Section title="CRECI" extra={<Badge variant={p.creci_status === "approved" ? "secondary" : "destructive"}>{statusLabel[p.creci_status]}</Badge>}>
          <F n="creci" l="Número" v={p.creci} />
          <F n="creci_uf" l="UF" v={p.creci_uf} />
          <p className="text-xs text-muted-foreground sm:col-span-2">Ao alterar o CRECI, ele volta para análise.</p>
        </Section>
      )}

      <Section title="Dados bancários">
        <F n="bank_name" l="Banco" v={p.bank_name} />
        <F n="bank_agency" l="Agência" v={p.bank_agency} />
        <F n="bank_account" l="Conta" v={p.bank_account} />
        <F n="pix_key" l="Chave PIX" v={p.pix_key} />
      </Section>

      <Button size="lg">Salvar cadastro</Button>
    </form>
  );
}

function Section({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2"><h2 className="text-xl font-semibold">{title}</h2>{extra}</div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function F({ n, l, v }: { n: string; l: string; v: string | null }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={n}>{l}</Label>
      <Input id={n} name={n} defaultValue={v ?? ""} />
    </div>
  );
}
