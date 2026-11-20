import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/me';
import { propertySegments, segmentLabels } from '@/lib/segments';
import { sortByStreet } from '@/lib/street-sort';
import { downloadTermPdf, validationCode } from '@/lib/term-pdf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfessionalsManager } from '@/components/ProfessionalsManager';

export const Route = createFileRoute('/_authenticated/autorizacoes')({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: 'Autorizações — e-imóvel' }, { name: 'description', content: 'Profissionais autorizados por imóvel e termos em PDF.' }, { property: 'og:title', content: 'Autorizações — e-imóvel' }, { property: 'og:description', content: 'Termos de autorização por imóvel.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Autorizacoes,
});

function Autorizacoes() {
  const { data: me } = useMe();
  const props = useQuery({
    queryKey: ['auth-page-props', me?.user.id], enabled: !!me,
    queryFn: async () => { const { data, error } = await supabase.from('properties').select('*').eq('owner_id', me!.user.id); if (error) throw error; return sortByStreet(data); },
  });
  const ids = (props.data ?? []).map((p) => p.id);
  const auths = useQuery({
    queryKey: ['auths', 'page', ids.join(',')], enabled: ids.length > 0,
    queryFn: async () => { const { data, error } = await supabase.from('authorizations').select('id, agent_id, property_id, owner_accepted_terms_at, created_at').in('property_id', ids); if (error) throw error; return data; },
  });
  const agents = useQuery({ queryKey: ['agents-details'], queryFn: async () => { const { data, error } = await supabase.rpc('list_approved_agents_details'); if (error) throw error; return data; } });
  if (!me?.profile) return null;
  const owner = me.profile;

  async function download(p: NonNullable<typeof props.data>[number], a: NonNullable<typeof auths.data>[number]) {
    const ag = agents.data?.find((x) => x.id === a.agent_id);
    try {
      await downloadTermPdf({
        authId: a.id, acceptedAt: a.owner_accepted_terms_at ?? a.created_at,
        property: { ...p, segments: propertySegments(p) },
        owner: { name: owner.full_name || me!.user.email || 'Proprietário', document: owner.document, phone: owner.phone, email: owner.email },
        agent: { name: ag?.company_name || ag?.full_name || 'Profissional', creci: ag?.creci ?? null, creci_uf: ag?.creci_uf ?? null, phone: ag?.phone ?? null, email: ag?.email ?? null },
      }, window.location.origin);
    } catch { toast.error('Não foi possível gerar o PDF.'); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Autorizações</h1>
      {props.isSuccess && !props.data.length && <p className="text-sm text-muted-foreground">Nenhum imóvel cadastrado.</p>}
      <div className="space-y-4">
        {props.data?.map((p) => {
          const list = (auths.data ?? []).filter((a) => a.property_id === p.id);
          const segs = propertySegments(p);
          return (
            <section key={p.id} className="rounded-2xl border bg-card p-4">
              <h2 className="text-lg font-semibold">{p.address || p.title}</h2>
              <p className="text-sm text-muted-foreground">{[p.title, p.neighborhood].filter(Boolean).join(' · ')}</p>
              {!list.length && <p className="mt-3 text-sm text-muted-foreground">Nenhum profissional autorizado.</p>}
              <ul className="mt-3 divide-y">
                {list.map((a) => {
                  const ag = agents.data?.find((x) => x.id === a.agent_id);
                  return (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span><b>{ag?.company_name || ag?.full_name || 'Profissional'}</b>{ag?.creci && <span className="text-muted-foreground"> · CRECI {ag.creci}/{ag.creci_uf}</span>}
                        <span className="mt-1 flex flex-wrap gap-1">{segs.map((s) => <Badge key={s} variant="secondary">{segmentLabels[s]}</Badge>)}</span></span>
                      <span className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Cód. {validationCode(a.id)}</span>
                        <Button size="sm" variant="outline" onClick={() => download(p, a)}><FileDown /> Termo PDF</Button></span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <ProfessionalsManager />
    </div>
  );
}
