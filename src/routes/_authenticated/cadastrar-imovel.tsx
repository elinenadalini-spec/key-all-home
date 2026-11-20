import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/me';
import { segments, segmentLabels, priceLabels, segmentPriceFields, segmentPricePatch, type Segment } from '@/lib/segments';
import { percentInput } from '@/lib/street-sort';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_authenticated/cadastrar-imovel')({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: 'Cadastrar imóvel — e-imóvel' }, { name: 'description', content: 'Cadastre um imóvel em Venda, Anual ou Temporada.' }, { property: 'og:title', content: 'Cadastrar imóvel — e-imóvel' }, { property: 'og:description', content: 'Novo imóvel com segmentos e percentuais.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: CadastrarImovel,
});

type Pct = { venda: string; temporada: string; first: string; admin: string };

function PctField({ id, label, value, onChange, max = 99 }: { id: string; label: string; value: string; onChange: (v: string) => void; max?: number }) {
  return <div className="space-y-1"><div className="flex items-center gap-1.5"><Input id={id} inputMode="numeric" className="w-20 text-right" maxLength={String(max).length} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, String(max).length))} /><span className="font-semibold">%</span></div>
    <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{label}</Label></div>;
}

function CadastrarImovel() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Segment[]>([]);
  const [prices, setPrices] = useState<Partial<Record<Segment, string>>>({});
  const [pct, setPct] = useState<Pct>({ venda: '', temporada: '', first: '', admin: '' });
  const [saving, setSaving] = useState(false);
  if (!me) return null;
  if (!me.isOwner) return <p className="text-muted-foreground">Apenas proprietários cadastram imóveis.</p>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me || saving) return;
    if (!selected.length) { toast.error('Escolha ao menos um segmento.'); return; }
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const values = segmentPricePatch(selected, Object.fromEntries(selected.map((s) => [s, prices[s] ? Number(prices[s]) : undefined])));
      const has = (s: Segment) => selected.includes(s);
      const { data, error } = await supabase.from('properties').insert({
        owner_id: me.user.id, segments: selected, ...values,
        title: String(f.get('title')), address: String(f.get('address') || ''), neighborhood: String(f.get('neighborhood') || ''), zip_code: String(f.get('zip_code') || ''), city: String(f.get('city') || ''),
        sale_commission_pct: has('venda') ? percentInput(pct.venda) : null,
        seasonal_commission_pct: has('temporada') ? percentInput(pct.temporada) : null,
        annual_first_rent_pct: has('anual') ? percentInput(pct.first, 100) : null,
        annual_admin_fee_pct: has('anual') ? percentInput(pct.admin) : null,
      }).select('id').single();
      if (error) { toast.error(error.message); return; }
      toast.success('Imóvel cadastrado');
      navigate({ to: '/imovel/$id', params: { id: data.id } });
    } catch { toast.error('Confira os valores dos segmentos.'); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Cadastrar imóvel</h1>
      <fieldset className="space-y-3 rounded-2xl border bg-card p-4" disabled={saving}>
        <legend className="px-1 text-sm font-semibold">Segmentos</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {segments.map((s) => (
            <div key={s} className="space-y-3 rounded-xl border p-3">
              <Label className="flex items-center gap-2"><Checkbox checked={selected.includes(s)} onCheckedChange={(c) => setSelected(segments.filter((x) => x === s ? c === true : selected.includes(x)))} />{segmentLabels[s]}</Label>
              {s === 'anual'
                ? <div className="space-y-2"><PctField id="pct-first" max={100} label="Porcentagem Primeiro Aluguel" value={pct.first} onChange={(v) => setPct({ ...pct, first: v })} /><PctField id="pct-admin" label="Taxa Administração" value={pct.admin} onChange={(v) => setPct({ ...pct, admin: v })} /></div>
                : <PctField id={`pct-${s}`} label="Porcentagem" value={pct[s]} onChange={(v) => setPct({ ...pct, [s]: v })} />}
            </div>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Nome do imóvel</Label><Input name="title" required placeholder="Casa Pé na Areia" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Endereço (rua e número)</Label><Input name="address" placeholder="Rua das Gaivotas, 120" /></div>
        <div className="space-y-1.5"><Label>Bairro</Label><Input name="neighborhood" placeholder="Jurerê Internacional" /></div>
        <div className="space-y-1.5"><Label>CEP</Label><Input name="zip_code" placeholder="88053-300" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Cidade</Label><Input name="city" placeholder="Florianópolis - SC" /></div>
        {selected.map((s) => <div key={s} className="space-y-1.5"><Label htmlFor={segmentPriceFields[s]}>{priceLabels[s]}</Label><Input id={segmentPriceFields[s]} type="number" min="0" step="0.01" required value={prices[s] ?? ''} onChange={(e) => setPrices({ ...prices, [s]: e.target.value })} /></div>)}
      </div>
      <Button variant="accent" className="w-full sm:w-auto" disabled={saving || !selected.length}>{saving ? 'Cadastrando…' : 'Cadastrar imóvel'}</Button>
    </form>
  );
}
