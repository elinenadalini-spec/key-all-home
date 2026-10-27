import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { brl } from '@/lib/me';

export function PropertyHistory({ propertyId }: { propertyId: string }) {
  const history = useQuery({ queryKey: ['property-history', propertyId], queryFn: async () => {
    const [{ data, error }, { data: notifications, error: noticesError }] = await Promise.all([
      supabase.from('property_updates').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
      supabase.from('property_notifications').select('*').eq('property_id', propertyId),
    ]);
    if (error || noticesError) throw error ?? noticesError;
    return { updates: data ?? [], notifications: notifications ?? [] };
  } });
  if (history.isPending) return <p>Carregando histórico…</p>;
  if (history.isError) return <p role="alert">Não foi possível carregar o histórico.</p>;
  if (!history.data.updates.length) return <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>;
  return <div className="divide-y">{history.data.updates.map((event) => {
    const before = event.old_values as Record<string, unknown>;
    const after = event.new_values as Record<string, unknown>;
    const sent = history.data.notifications.filter((n) => n.update_id === event.id);
    return <article key={event.id} className="space-y-2 py-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><b>{event.kind === 'calendar' ? `Calendário · ${after.day}` : 'Dados do imóvel'}</b><time>{new Date(event.created_at).toLocaleString('pt-BR')}</time></div>
      {Object.keys(after).filter((key) => JSON.stringify(after[key]) !== JSON.stringify(before[key])).map((key) => <p key={key} className="break-words"><span className="text-muted-foreground">{({ base_price: 'Valor', price: 'Diária', blocked: 'Bloqueio', title: 'Nome', description: 'Descrição', address: 'Endereço', city: 'Cidade', bedrooms: 'Quartos', bathrooms: 'Banheiros', guests: 'Hóspedes', segment: 'Segmento', photos: 'Fotos', note: 'Observação' } as Record<string,string>)[key] ?? key}: </span>{key === 'base_price' || key === 'price' ? `${before[key] == null ? 'Padrão' : brl(Number(before[key]))} → ${after[key] == null ? 'Padrão' : brl(Number(after[key]))}` : key === 'photos' ? 'Fotos atualizadas' : `${before[key] ?? '—'} → ${after[key] ?? '—'}`}</p>)}
      <p className="text-xs text-muted-foreground">IP: {event.observed_ip ? String(event.observed_ip) : 'Não disponibilizado nesta conexão'}</p>
      <p className="text-xs text-muted-foreground">Avisos internos: {sent.filter((n) => n.status === 'delivered').length} enviados · {sent.filter((n) => n.read_at).length} lidos · {sent.filter((n) => n.status === 'disabled').length} desativados</p>
    </article>;
  })}</div>;
}