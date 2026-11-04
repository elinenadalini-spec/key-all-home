import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BedDouble, Clock, Home, Lock, Mail, MessageCircle, Phone, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl, useMe, type Property } from "@/lib/me";
import { usePhotoUrls } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TermsAcceptDialog } from "@/components/TermsAccept";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertyNotifications } from '@/components/PropertyNotifications';
import { asSegment, propertySegments, propertyPrice, segmentPricePatch, priceSuffix, segmentLabels, segments, type Segment } from '@/lib/segments';
import { SegmentCheckboxes, SegmentPriceInputs } from '@/components/PropertySegments';
import { inventoryOwnerFilter } from '@/lib/property-inventory';

export const Route = createFileRoute("/_authenticated/painel")({
  validateSearch: (search: Record<string, unknown>): { segmento?: Segment } => ['venda','anual','temporada'].includes(String(search['segmento'])) ? { segmento: asSegment(String(search['segmento'])) } : {},
  head: () => ({ meta: [{ title: "Meus imóveis — Temporada" }, { name: "description", content: "Imóveis de Venda, Anual e Temporada vinculados aos proprietários." }, { property: 'og:title', content: 'Meus imóveis — Temporada' }, { property: 'og:description', content: 'Carteira de Venda, Anual e Temporada.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Painel,
});

const segmentStyles: Record<Segment, { active: string; idle: string; badge: string }> = {
  venda: {
    active: 'border-accent bg-accent text-accent-foreground',
    idle: 'border-accent/40 bg-card text-accent hover:bg-accent/10',
    badge: 'bg-accent/15 text-accent',
  },
  anual: {
    active: 'border-success bg-success text-success-foreground',
    idle: 'border-success/40 bg-card text-success hover:bg-success/10',
    badge: 'bg-success/15 text-success',
  },
  temporada: {
    active: 'border-primary bg-primary text-primary-foreground',
    idle: 'border-primary/40 bg-card text-primary hover:bg-primary/10',
    badge: 'bg-primary/15 text-primary',
  },
};

function Painel() {
  const { data: me } = useMe();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const segment = search.segmento;
  const props = useQuery({
    queryKey: ["properties", me?.user.id, me?.isOwner, me?.isAdmin],
    enabled: !!me,
    queryFn: async () => {
      let q = supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (!me) return [];
      const ownerId = inventoryOwnerFilter(me);
      if (ownerId) q = q.eq("owner_id", ownerId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Property[];
    },
  });

  if (!me) return null;
  const pending = me.isAgent && me.profile?.creci_status !== "approved";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Olá, {me.profile?.full_name?.split(" ")[0] || "bem-vindo"}</p>
          <h1 className="text-3xl font-bold">{me.isAdmin ? "Todos os imóveis" : me.isOwner ? "Meus imóveis" : "Imóveis autorizados"}</h1>
        </div>
        {me.isOwner && <NewProperty segment={segment} />}
      </div>

      {pending && (
        <div className="flex gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <Clock className="h-5 w-5 shrink-0 text-accent" />
          <div>
            {me.profile?.creci_status === "rejected"
              ? "Seu CRECI não foi aprovado. Revise o número em Cadastro."
              : `Seu CRECI ${me.profile?.creci ?? ""}/${me.profile?.creci_uf ?? ""} está em análise. Assim que aprovado, os proprietários poderão autorizar você.`}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {segments.map((s) => {
          const style = segmentStyles[s];
          const active = segment === s;
          const count = props.data?.filter((p) => propertySegments(p).includes(s)).length ?? 0;
          return (
            <button
              key={s}
              type="button"
              onClick={() => navigate({ to: '/painel', search: { segmento: s } })}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 shadow-soft transition-colors ${active ? style.active : style.idle}`}
            >
              <Home className="h-8 w-8" />
              <span className="text-sm font-semibold">{segmentLabels[s]}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${active ? 'bg-background/25' : style.badge}`}>
                {count} {count === 1 ? 'imóvel' : 'imóveis'}
              </span>
            </button>
          );
        })}
      </div>

      {segment && props.data && props.data.filter((p) => propertySegments(p).includes(segment)).length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Home className="mx-auto mb-2 h-8 w-8" />
          {me.isAdmin ? "Nenhum imóvel cadastrado neste segmento." : me.isOwner ? "Cadastre seu primeiro imóvel para começar." : "Nenhum proprietário autorizou você ainda."}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {segment && props.data?.filter((p) => propertySegments(p).includes(segment)).map((p) => <PropertyCard key={p.id} p={p} segment={segment} />)}
      </div>

      {me.isAgent && !pending && <><PropertyNotifications />{segment && <AgentNetwork segment={segment} />}</>}
    </div>
  );
}

function AgentNetwork({ segment }: { segment: Segment }) {
  const qc = useQueryClient();
  const owners = useQuery({
    queryKey: ["owner-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agent_owner_contacts");
      if (error) throw error;
      return data;
    },
  });
  const others = useQuery({
    queryKey: ["network-props"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agent_network_properties_multi_segment");
      if (error) throw error;
      return data.filter((p) => !p.has_access);
    },
  });
  const covers = usePhotoUrls((others.data ?? []).map((p) => p.cover).filter(Boolean) as string[]);
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null);
  const { data: me } = useMe();

  async function request() {
    if (!target || !me) return;
    await supabase.from("access_requests").delete().eq("property_id", target.id).eq("agent_id", me.user.id);
    const { error } = await supabase.from("access_requests").insert({
      property_id: target.id, agent_id: me.user.id, agent_accepted_terms_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido enviado ao proprietário");
    setTarget(null);
    qc.invalidateQueries({ queryKey: ["network-props"] });
  }

  if (!owners.data?.length) return null;
  return (
    <div className="space-y-6 pt-4">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Contatos dos proprietários</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {owners.data.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-card p-4 text-sm">
              <b className="text-base">{o.full_name || "Proprietário"}</b>
              {o.city && <p className="text-muted-foreground">{o.city}</p>}
              <div className="mt-2 space-y-1">
                {o.phone && <a className="flex items-center gap-2 hover:text-primary" href={`tel:${o.phone}`}><Phone className="h-4 w-4" />{o.phone}</a>}
                {o.whatsapp && <a className="flex items-center gap-2 hover:text-primary" href={`https://wa.me/55${o.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />{o.whatsapp}</a>}
                {o.email && <a className="flex items-center gap-2 hover:text-primary" href={`mailto:${o.email}`}><Mail className="h-4 w-4" />{o.email}</a>}
              </div>
            </div>
          ))}
        </div>
      </section>
      {(others.data?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Outros imóveis desses proprietários</h2>
          <p className="text-sm text-muted-foreground">Peça autorização para ver calendário, valores e todas as fotos.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(others.data ?? []).filter((p) => propertySegments(p).includes(segment)).map((p) => {
              const cover = p.cover ? covers.data?.[p.cover] : undefined;
              const owner = owners.data?.find((o) => o.id === p.owner_id);
              return (
                <div key={p.id} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                  <div className="aspect-[16/10] bg-muted">
                    {cover ? <img src={cover} alt={p.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-ocean"><Home className="h-10 w-10 text-primary-foreground/60" /></div>}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{[p.city, owner?.full_name].filter(Boolean).join(" · ")}</p>
                    {p.request_status === "pending" ? (
                      <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pedido enviado</Badge>
                    ) : (
                      <Button size="sm" variant="accent" onClick={() => setTarget({ id: p.id, title: p.title })}>
                        <Lock /> {p.request_status === "rejected" ? "Pedir novamente" : "Pedir autorização"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <TermsAcceptDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        onAccept={request}
        confirmLabel="Aceitar e enviar pedido"
        header={target && <p className="text-sm">Pedido de autorização para <b>{target.title}</b>.</p>}
      />
    </div>
  );
}

function PropertyCard({ p, segment }: { p: Property; segment: Segment }) {
  const urls = usePhotoUrls(p.photos.slice(0, 1));
  const cover = p.photos[0] ? urls.data?.[p.photos[0]] : undefined;
  return (
    <Link to="/imovel/$id" params={{ id: p.id }} className="group overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="aspect-[16/10] bg-muted">
        {cover ? <img src={cover} alt={p.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-ocean"><Home className="h-10 w-10 text-primary-foreground/60" /></div>}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-semibold group-hover:text-primary">{p.title}</h3>
        <p className="text-sm text-muted-foreground">{p.city || "—"}</p>
        <div className="flex items-center justify-between pt-2 text-sm">
          <span className="flex gap-3 text-muted-foreground">
            <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{p.bedrooms}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{p.guests}</span>
          </span>
          <span className="font-semibold text-accent">{brl(propertyPrice(p, segment))}<span className="text-xs text-muted-foreground">{priceSuffix(segment)}</span></span>
        </div>
      </div>
    </Link>
  );
}

function NewProperty({ segment }: { segment?: Segment }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Segment[]>(segment ? [segment] : []);
  const [prices, setPrices] = useState<Partial<Record<Segment, number | ''>>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { data: me } = useMe();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!me || saving) return;
    if (!selected.length) { toast.error('Escolha ao menos um segmento.'); return; }
    setSaving(true);
    try {
    const values = segmentPricePatch(selected, Object.fromEntries(selected.map((s) => [s, prices[s] === '' ? undefined : prices[s]])));
    const { data, error } = await supabase
      .from("properties")
      .insert({
        owner_id: me.user.id,
        segments: selected,
        ...values,
        title: String(f.get("title")),
        city: String(f.get("city")),
      })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    setOpen(false);
    navigate({ to: "/imovel/$id", params: { id: data.id } });
    } catch { toast.error('Confira os valores dos segmentos antes de criar o imóvel.'); }
    finally { setSaving(false); }
  }
  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (value) { setSelected(segment ? [segment] : []); setPrices({}); } }}>
      <DialogTrigger asChild>
        <Button variant="accent"><Plus /> Imóvel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo imóvel</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <SegmentCheckboxes value={selected} onChange={setSelected} disabled={saving} />
          <div className="space-y-1.5"><Label>Nome do imóvel</Label><Input name="title" required placeholder="Casa Pé na Areia" /></div>
          <div className="space-y-1.5"><Label>Cidade</Label><Input name="city" placeholder="Ubatuba - SP" /></div>
          <SegmentPriceInputs selected={selected} prices={prices} onChange={(s, value) => setPrices((current) => ({ ...current, [s]: value }))} disabled={saving} />
          <Button className="w-full" disabled={saving || !selected.length}>{saving ? 'Criando…' : 'Criar e abrir'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
