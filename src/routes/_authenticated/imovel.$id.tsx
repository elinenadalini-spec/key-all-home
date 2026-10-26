import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, BedDouble, Bath, ImagePlus, Trash2, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { accountLabel, brl, useMe, type Property } from "@/lib/me";
import { PHOTO_BUCKET, usePhotoUrls } from "@/lib/photos";
import { PropertyCalendar } from "@/components/PropertyCalendar";
import { TermsAcceptDialog, TermsText } from "@/components/TermsAccept";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/imovel/$id")({
  head: () => ({ meta: [{ title: "Imóvel — Temporada" }, { name: "description", content: "Calendário e valores do imóvel." }] }),
  component: PropertyPage,
});

function PropertyPage() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const prop = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Property | null;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`prop-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "properties", filter: `id=eq.${id}` }, () =>
        qc.invalidateQueries({ queryKey: ["property", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  const p = prop.data;
  if (prop.isLoading || !me) return <p className="text-muted-foreground">Carregando…</p>;
  if (!p) return <p>Imóvel não encontrado ou sem autorização.</p>;
  const canEdit = p.owner_id === me.user.id;

  return (
    <div className="space-y-5">
      <Link to="/painel" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <div>
        <h1 className="text-3xl font-bold">{p.title}</h1>
        <p className="text-sm text-muted-foreground">{[p.address, p.city].filter(Boolean).join(" · ")}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{p.bedrooms} quartos</span>
          <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{p.bathrooms} banheiros</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{p.guests} hóspedes</span>
          <span className="font-semibold text-accent">Diária padrão {brl(p.base_price)}</span>
        </div>
      </div>

      <Tabs defaultValue="cal">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="cal">Calendário</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
          {canEdit && <TabsTrigger value="acesso">Autorizações</TabsTrigger>}
          <TabsTrigger value="termo">Termo</TabsTrigger>
        </TabsList>
        <TabsContent value="cal" className="pt-4">
          {canEdit && <p className="mb-3 text-sm text-muted-foreground">Toque nos dias para selecionar, depois bloqueie ou altere o valor.</p>}
          <PropertyCalendar propertyId={p.id} basePrice={Number(p.base_price)} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="fotos" className="pt-4"><Photos p={p} canEdit={canEdit} /></TabsContent>
        <TabsContent value="info" className="pt-4">{canEdit ? <InfoForm p={p} /> : <p className="whitespace-pre-line text-sm">{p.description || "Sem descrição."}</p>}</TabsContent>
        {canEdit && <TabsContent value="acesso" className="pt-4"><Access propertyId={p.id} /></TabsContent>}
        <TabsContent value="termo" className="pt-4"><div className="rounded-2xl border bg-card p-5"><TermsText /></div></TabsContent>
      </Tabs>
    </div>
  );
}

function InfoForm({ p }: { p: Property }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("properties")
      .update({
        title: String(f.get("title")),
        description: String(f.get("description")),
        address: String(f.get("address")),
        city: String(f.get("city")),
        bedrooms: Number(f.get("bedrooms")),
        bathrooms: Number(f.get("bathrooms")),
        guests: Number(f.get("guests")),
        base_price: Number(f.get("base_price")),
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Informações salvas");
    qc.invalidateQueries({ queryKey: ["property", p.id] });
  }
  async function remove() {
    if (!confirm("Excluir este imóvel e todo o calendário?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/painel" });
  }
  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <F label="Nome" name="title" v={p.title} />
      <F label="Cidade" name="city" v={p.city} />
      <div className="sm:col-span-2"><F label="Endereço" name="address" v={p.address} /></div>
      <F label="Quartos" name="bedrooms" v={p.bedrooms} type="number" />
      <F label="Banheiros" name="bathrooms" v={p.bathrooms} type="number" />
      <F label="Hóspedes" name="guests" v={p.guests} type="number" />
      <F label="Diária padrão (R$)" name="base_price" v={p.base_price} type="number" />
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Descrição, regras e comodidades</Label>
        <Textarea name="description" rows={6} defaultValue={p.description ?? ""} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button>Salvar</Button>
        <Button type="button" variant="ghost" className="text-destructive" onClick={remove}><Trash2 /> Excluir imóvel</Button>
      </div>
    </form>
  );
}

function F({ label, name, v, type = "text" }: { label: string; name: string; v: string | number | null; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} step={type === "number" ? "0.01" : undefined} defaultValue={v ?? ""} />
    </div>
  );
}

function Photos({ p, canEdit }: { p: Property; canEdit: boolean }) {
  const qc = useQueryClient();
  const urls = usePhotoUrls(p.photos);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${p.owner_id}/${p.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
      if (error) toast.error(error.message);
      else added.push(path);
    }
    await supabase.from("properties").update({ photos: [...p.photos, ...added] }).eq("id", p.id);
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["property", p.id] });
  }
  async function remove(path: string) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    await supabase.from("properties").update({ photos: p.photos.filter((x) => x !== path) }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["property", p.id] });
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted">
          <ImagePlus className="h-5 w-5" /> {busy ? "Enviando…" : "Adicionar fotos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
      )}
      {p.photos.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma foto ainda.</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {p.photos.map((path) => (
          <div key={path} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {urls.data?.[path] && <img src={urls.data[path]} alt="" loading="lazy" className="h-full w-full object-cover" />}
            {canEdit && (
              <button onClick={() => remove(path)} aria-label="Remover foto" className="absolute right-1.5 top-1.5 rounded-full bg-card/90 p-1.5 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Access({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const agents = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_approved_agents");
      if (error) throw error;
      return data;
    },
  });
  const auths = useQuery({
    queryKey: ["auths", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("authorizations").select("agent_id").eq("property_id", propertyId);
      return new Set((data ?? []).map((a) => a.agent_id));
    },
  });

  const requests = useQuery({
    queryKey: ["requests", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("access_requests").select("*").eq("property_id", propertyId).eq("status", "pending");
      return data ?? [];
    },
  });
  const [pendingAgent, setPendingAgent] = useState<{ id: string; requestId?: string } | null>(null);

  async function authorize() {
    if (!pendingAgent) return;
    const { error } = await supabase.from("authorizations").insert({
      property_id: propertyId, agent_id: pendingAgent.id, owner_accepted_terms_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("access_requests").update({ status: "approved" }).eq("property_id", propertyId).eq("agent_id", pendingAgent.id);
    toast.success("Autorização concedida");
    setPendingAgent(null);
    qc.invalidateQueries({ queryKey: ["auths", propertyId] });
    qc.invalidateQueries({ queryKey: ["requests"] });
  }
  async function reject(requestId: string) {
    await supabase.from("access_requests").update({ status: "rejected" }).eq("id", requestId);
    qc.invalidateQueries({ queryKey: ["requests"] });
  }
  async function revoke(agentId: string) {
    const { error } = await supabase.from("authorizations").delete().eq("property_id", propertyId).eq("agent_id", agentId);
    if (error) { toast.error(error.message); return; }
    await supabase.from("access_requests").delete().eq("property_id", propertyId).eq("agent_id", agentId);
    qc.invalidateQueries({ queryKey: ["auths", propertyId] });
  }

  const byId = new Map((agents.data ?? []).map((a) => [a.id, a]));
  const list = (agents.data ?? []).filter((a) =>
    [a.full_name, a.company_name, a.city, a.creci].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {(requests.data?.length ?? 0) > 0 && (
        <div className="space-y-2 rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-sm font-semibold">Pedidos de acesso</p>
          {requests.data!.map((r) => {
            const a = byId.get(r.agent_id);
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">{a ? a.company_name || a.full_name : "Profissional"} {a && <span className="text-muted-foreground">· CRECI {a.creci}/{a.creci_uf}</span>}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => setPendingAgent({ id: r.agent_id, requestId: r.id })}>Autorizar</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Recusar</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-sm text-muted-foreground">Corretores e imobiliárias com CRECI aprovado. Ao autorizar, o profissional vê o calendário e os valores deste imóvel, seus contatos e a foto de capa dos seus outros imóveis.</p>
      <Input placeholder="Buscar por nome, cidade ou CRECI" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum profissional encontrado.</p>}
      <div className="space-y-2">
        {list.map((a) => {
          const on = auths.data?.has(a.id) ?? false;
          return (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <b className="truncate">{a.company_name || a.full_name}</b>
                  <Badge variant="secondary">{accountLabel[a.account_type]}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">CRECI {a.creci}/{a.creci_uf} {a.city ? `· ${a.city}` : ""} {a.phone ? `· ${a.phone}` : ""}</p>
              </div>
              <Button size="sm" variant={on ? "success" : "outline"} onClick={() => (on ? revoke(a.id) : setPendingAgent({ id: a.id }))}>
                {on ? <><Check /> Autorizado</> : "Autorizar"}
              </Button>
            </div>
          );
        })}
      </div>
      <TermsAcceptDialog
        open={!!pendingAgent}
        onOpenChange={(o) => !o && setPendingAgent(null)}
        onAccept={authorize}
        confirmLabel="Aceitar e autorizar"
        header={pendingAgent && <p className="text-sm">Autorizando <b>{byId.get(pendingAgent.id)?.company_name || byId.get(pendingAgent.id)?.full_name}</b> a intermediar este imóvel.</p>}
      />
    </div>
  );
}
