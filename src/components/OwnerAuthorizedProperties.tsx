import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe, brl, type Property } from '@/lib/me';
import { groupOwnerProperties } from '@/lib/owner-properties';
import { segmentLabels, propertyPrice, priceSuffix } from '@/lib/segments';
import { usePhotoUrls } from '@/lib/photos';

export function OwnerAuthorizedProperties({ ownerId }: { ownerId: string }) {
  const { data: me } = useMe();
  const properties = useQuery({
    queryKey: ['properties', 'authorized-owner', me?.user.id, ownerId],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('owner_id', ownerId).order('title');
      if (error) throw error;
      return data as Property[];
    },
  });
  const photos = usePhotoUrls((properties.data ?? []).flatMap((property) => property.photos.slice(0, 1)));
  if (properties.isPending) return <p className="py-3 text-sm text-muted-foreground">Carregando imóveis…</p>;
  if (properties.isError) return <p className="py-3 text-sm text-destructive">Não foi possível carregar os imóveis autorizados.</p>;
  return <div className="space-y-4 py-4">
    {groupOwnerProperties(properties.data ?? [], ownerId).map(({ segment, properties: list }) => <section key={segment} className="space-y-2">
      <h4 className="font-semibold">{segmentLabels[segment]} <span className="text-sm text-muted-foreground">({list.length})</span></h4>
      {!list.length ? <p className="text-sm text-muted-foreground">Nenhum imóvel autorizado neste segmento.</p> : <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((property) => <li key={property.id}><Link to="/imovel/$id" params={{ id: property.id }} className="flex items-center gap-3 rounded-lg border p-2 hover:bg-muted">
          {photos.data?.[property.photos[0] ?? ''] && <img src={photos.data[property.photos[0] ?? '']} alt={property.title} className="h-16 w-20 shrink-0 rounded object-cover" />}
          <div className="min-w-0"><p className="break-words font-medium">{property.title}</p><p className="text-sm text-muted-foreground">{brl(propertyPrice(property, segment))}{priceSuffix(segment)}</p></div>
        </Link></li>)}
      </ul>}
    </section>)}
  </div>;
}