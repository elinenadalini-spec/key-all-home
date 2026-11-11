import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { accountLabel, useMe } from '@/lib/me';
import { setAgentAuthorizations } from '@/lib/authorizations.functions';
import { authorizationScope, scopeLabel } from '@/lib/authorization-scope';
import { TermsAcceptDialog } from '@/components/TermsAccept';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export function ProfessionalsManager() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const setAuth = useServerFn(setAgentAuthorizations);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<{ agentId: string; ids: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const props = useQuery({
    queryKey: ['manage-props', me?.user.id, me?.isAdmin], enabled: !!me,
    queryFn: async () => {
      let qb = supabase.from('properties').select('id, title, owner_id, segments').order('title');
      if (!me!.isAdmin) qb = qb.eq('owner_id', me!.user.id);
      const { data, error } = await qb; if (error) throw error; return data;
    },
  });
  const ids = (props.data ?? []).map((p) => p.id);
  const agents = useQuery({ queryKey: ['agents'], queryFn: async () => { const { data, error } = await supabase.rpc('list_approved_agents'); if (error) throw error; return data; } });
  const auths = useQuery({
    queryKey: ['manage-auths', ids.join(',')], enabled: ids.length > 0,
    queryFn: async () => { const { data, error } = await supabase.from('authorizations').select('agent_id, property_id').in('property_id', ids); if (error) throw error; return data; },
  });
  if (!me || (!me.isOwner && !me.isAdmin)) return null;
  const byAgent = new Map<string, Set<string>>();
  (auths.data ?? []).forEach((a) => { if (!byAgent.has(a.agent_id)) byAgent.set(a.agent_id, new Set()); byAgent.get(a.agent_id)!.add(a.property_id); });
  const list = (agents.data ?? []).filter((a) => [a.full_name, a.company_name, a.city, a.creci].join(' ').toLowerCase().includes(q.toLowerCase()));

  async function run(agentId: string, propertyIds: string[], enabled: boolean) {
    setBusy(true);
    try { await setAuth({ data: { agentId, propertyIds, enabled } }); toast.success(enabled ? 'Autorização concedida' : 'Autorização revogada'); }
    catch { toast.error('Não foi possível alterar a autorização.'); }
    finally { setBusy(false); setPending(null); qc.invalidateQueries({ queryKey: ['manage-auths'] }); qc.invalidateQueries({ queryKey: ['auths'] }); }
  }
  const nameOf = (id: string) => { const a = agents.data?.find((x) => x.id === id); return a?.company_name || a?.full_name || 'Profissional'; };

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Profissionais autorizados</h2>
      <p className="text-sm text-muted-foreground">Escolha corretores e imobiliárias com CRECI aprovado para trabalhar {me.isAdmin ? 'os imóveis da carteira' : 'seus imóveis'}: todos ou apenas alguns.</p>
      <Input placeholder="Buscar por nome, cidade ou CRECI" value={q} onChange={(e) => setQ(e.target.value)} />
      {!ids.length && <p className="text-sm text-muted-foreground">Cadastre um imóvel para autorizar profissionais.</p>}
      <div className="space-y-2">
        {ids.length > 0 && list.map((a) => {
          const set = byAgent.get(a.id) ?? new Set<string>();
          const scope = authorizationScope(ids, set);
          const count = ids.filter((id) => set.has(id)).length;
          return (
            <div key={a.id} className="rounded-xl border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" className="flex min-w-0 items-center gap-2 text-left" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === a.id ? 'rotate-180' : ''}`} />
                  <span className="min-w-0"><b className="block truncate">{a.company_name || a.full_name}</b>
                    <span className="block truncate text-xs text-muted-foreground">{accountLabel[a.account_type]} · CRECI {a.creci}/{a.creci_uf}{a.city ? ` · ${a.city}` : ''}</span></span>
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant={scope === 'all' ? 'default' : scope === 'some' ? 'secondary' : 'outline'}>{scope === 'some' ? `${scopeLabel.some} (${count}/${ids.length})` : scopeLabel[scope]}</Badge>
                  {scope !== 'all'
                    ? <Button size="sm" variant="success" disabled={busy} onClick={() => setPending({ agentId: a.id, ids: ids.filter((id) => !set.has(id)) })}>Autorizar todos</Button>
                    : <Button size="sm" variant="outline" disabled={busy} onClick={() => run(a.id, ids, false)}>Revogar todos</Button>}
                </div>
              </div>
              {open === a.id && <ul className="mt-3 space-y-2 border-t pt-3">
                {(props.data ?? []).map((p) => (
                  <li key={p.id}><label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={set.has(p.id)} disabled={busy} onCheckedChange={(v) => v === true ? setPending({ agentId: a.id, ids: [p.id] }) : run(a.id, [p.id], false)} />
                    {p.title}</label></li>
                ))}
              </ul>}
            </div>
          );
        })}
      </div>
      <TermsAcceptDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)} confirmLabel="Aceitar e autorizar"
        onAccept={() => pending ? run(pending.agentId, pending.ids, true) : undefined}
        header={pending && <p className="text-sm">Autorizando <b>{nameOf(pending.agentId)}</b> em {pending.ids.length} {pending.ids.length === 1 ? 'imóvel' : 'imóveis'}.</p>} />
    </section>
  );
}
