import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDown, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { accountLabel } from '@/lib/me';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_authenticated/profissionais')({
  head: () => ({ meta: [{ title: 'Cadastro de profissionais — PropKey' }, { name: 'description', content: 'Corretores e imobiliárias com CRECI aprovado.' }, { property: 'og:title', content: 'Cadastro de profissionais — PropKey' }, { property: 'og:description', content: 'Pesquise profissionais por nome ou CRECI.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Profissionais,
});

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function Profissionais() {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'nome' | 'creci'>('nome');
  const [open, setOpen] = useState<string | null>(null);
  const agents = useQuery({ queryKey: ['agents-details'], queryFn: async () => { const { data, error } = await supabase.rpc('list_approved_agents_details'); if (error) throw error; return data; } });
  const name = (a: { company_name: string | null; full_name: string }) => a.company_name || a.full_name;
  const list = (agents.data ?? [])
    .filter((a) => mode === 'creci' ? norm(`${a.creci ?? ''}${a.creci_uf ?? ''}`).includes(norm(q.replace(/[\s/-]/g, ''))) : norm(`${a.full_name} ${a.company_name ?? ''}`).includes(norm(q)))
    .sort((a, b) => name(a).localeCompare(name(b), 'pt-BR'));
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Cadastro de profissionais</h1>
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <Input placeholder={mode === 'creci' ? 'Digite o número do CRECI' : 'Digite o nome'} value={q} onChange={(e) => setQ(e.target.value)} />
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'nome' | 'creci')} className="flex gap-6">
          <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="creci" />Pesquisar por CRECI</Label>
          <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="nome" />Pesquisar por Nome</Label>
        </RadioGroup>
      </div>
      {agents.isSuccess && !list.length && <p className="text-sm text-muted-foreground">Nenhum profissional encontrado.</p>}
      <div className="space-y-2">
        {list.map((a) => (
          <div key={a.id} className="rounded-xl border bg-card p-3">
            <button type="button" className="flex w-full items-center gap-2 text-left" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === a.id ? 'rotate-180' : ''}`} />
              <span className="min-w-0"><b className="block truncate">{name(a)}</b><span className="block text-xs text-muted-foreground">{accountLabel[a.account_type]} · CRECI {a.creci}/{a.creci_uf}</span></span>
            </button>
            {open === a.id && <div className="mt-3 grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
              {a.company_name && <p className="sm:col-span-2 text-muted-foreground">Responsável: {a.full_name}</p>}
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{a.phone || '—'}</p>
              <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />{a.whatsapp || '—'}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{a.email || '—'}</p>
              <p className="flex items-center gap-2"><Globe className="h-4 w-4" />{a.website ? <a className="hover:text-primary" href={a.website} target="_blank" rel="noreferrer">{a.website}</a> : '—'}</p>
              <p className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4" />{a.address || a.city || '—'}</p>
              <p className="sm:col-span-2"><b>CRECI:</b> {a.creci}/{a.creci_uf}</p>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
