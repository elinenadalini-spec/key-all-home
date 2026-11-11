import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/me';
import { useTerms } from '@/lib/terms';
import { buildTermText, downloadText } from '@/lib/term-download';
import { Button } from '@/components/ui/button';

export function AgentTermDownload({ propertyId }: { propertyId: string }) {
  const { data: me } = useMe();
  const { data: terms } = useTerms();
  const rec = useQuery({
    queryKey: ['agent-term', propertyId, me?.user.id], enabled: !!me?.isAgent,
    queryFn: async () => { const { data, error } = await supabase.rpc('agent_authorization_terms'); if (error) throw error; return data.find((r) => r.property_id === propertyId) ?? null; },
  });
  if (!me?.isAgent || !rec.data || !terms) return null;
  const r = rec.data;
  const agent = me.profile?.company_name || me.profile?.full_name || me.user.email || 'Profissional';
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
      <div><p className="font-semibold">Autorizado por {r.owner_name || 'proprietário'}</p>
        <p className="text-muted-foreground">{r.accepted_at ? new Date(r.accepted_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'} · IP {r.accepted_ip || 'não disponível'}</p></div>
      <Button size="sm" onClick={() => downloadText(`termo-${r.title.replace(/[^\w]+/g, '-').toLowerCase()}.txt`, buildTermText(terms, r, agent))}><Download /> Baixar termo</Button>
    </div>
  );
}
