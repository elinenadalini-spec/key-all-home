import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/me';
import { Button } from '@/components/ui/button';

export function PropertyNotifications() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const recipient = me?.user.id;
  const notices = useQuery({ queryKey: ['property-notifications', recipient], enabled: !!recipient, queryFn: async () => {
    if (!recipient) return [];
    const { data, error } = await supabase.from('property_notifications').select('*, properties(title)').eq('recipient_id', recipient).eq('status', 'delivered').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data;
  } });
  useEffect(() => {
    if (!recipient) return;
    const channel = supabase.channel(`notices-${recipient}-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'property_notifications', filter: `recipient_id=eq.${recipient}` }, () => qc.invalidateQueries({ queryKey: ['property-notifications'] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recipient, qc]);
  async function markRead(id: string) {
    const { error } = await supabase.rpc('mark_property_notification_read', { _id: id });
    if (error) { toast.error('Não foi possível marcar como lida.'); return; }
    qc.invalidateQueries({ queryKey: ['property-notifications'] });
  }
  return <section className="space-y-3"><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell className="h-5 w-5" />Notificações</h2>
    {notices.isError && <p role="alert">Não foi possível carregar os avisos.</p>}
    {notices.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma alteração recebida.</p>}
    <div className="divide-y">{notices.data?.map((n) => <div key={n.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <div><Link to="/imovel/$id" params={{ id: n.property_id }} className="font-semibold text-primary">{n.properties?.title ?? 'Imóvel atualizado'}</Link><p>O proprietário atualizou este imóvel.</p><time className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('pt-BR')}</time></div>
      {n.read_at ? <span className="text-xs text-muted-foreground">Lida</span> : <Button size="sm" variant="outline" onClick={() => markRead(n.id)}><Check />Marcar como lida</Button>}
    </div>)}</div>
  </section>;
}