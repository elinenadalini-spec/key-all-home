import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BedDouble, Clock, Home, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl, useMe, type Property } from "@/lib/me";
import { usePhotoUrls } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Meus imóveis — Temporada" }, { name: "description", content: "Painel de imóveis de temporada." }] }),
  component: Painel,
});

function Painel() {
  const { data: me } = useMe();
  const props = useQuery({
    queryKey: ["properties", me?.user.id, me?.isOwner],
    enabled: !!me,
    queryFn: async () => {
      let q = supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (me!.isOwner) q = q.eq("owner_id", me!.user.id);
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
          <h1 className="text-3xl font-bold">{me.isOwner ? "Meus imóveis" : "Imóveis autorizados"}</h1>
        </div>
        {me.isOwner && <NewProperty />}
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

      {props.data && props.data.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Home className="mx-auto mb-2 h-8 w-8" />
          {me.isOwner ? "Cadastre seu primeiro imóvel para começar." : "Nenhum proprietário autorizou você ainda."}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {props.data?.map((p) => <PropertyCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function PropertyCard({ p }: { p: Property }) {
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
          <span className="font-semibold text-accent">{brl(p.base_price)}<span className="text-xs text-muted-foreground">/noite</span></span>
        </div>
      </div>
    </Link>
  );
}

function NewProperty() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: me } = useMe();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { data, error } = await supabase
      .from("properties")
      .insert({
        owner_id: me!.user.id,
        title: String(f.get("title")),
        city: String(f.get("city")),
        base_price: Number(f.get("base_price") || 0),
      })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    setOpen(false);
    navigate({ to: "/imovel/$id", params: { id: data.id } });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent"><Plus /> Imóvel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo imóvel</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label>Nome do imóvel</Label><Input name="title" required placeholder="Casa Pé na Areia" /></div>
          <div className="space-y-1.5"><Label>Cidade</Label><Input name="city" placeholder="Ubatuba - SP" /></div>
          <div className="space-y-1.5"><Label>Diária padrão (R$)</Label><Input name="base_price" type="number" step="0.01" min="0" required /></div>
          <Button className="w-full">Criar e abrir</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
