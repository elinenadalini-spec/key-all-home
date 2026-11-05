import { useQuery } from '@tanstack/react-query';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/me';

export function PropertyOwnerContact({ ownerId }: { ownerId: string }) {
  const { data: me } = useMe();
  const owners = useQuery({
    queryKey: ['owner-contacts', me?.user.id],
    enabled: !!me?.isAgent,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('agent_owner_contacts');
      if (error) throw error;
      return data;
    },
  });
  if (!me?.isAgent) return null;
  const owner = owners.data?.find((contact) => contact.id === ownerId);
  return <section className="mb-6 space-y-2 border-b pb-5">
    <h2 className="text-lg font-semibold">Proprietário</h2>
    {owners.isPending ? <p className="text-sm text-muted-foreground">Carregando proprietário…</p>
      : owners.isError ? <p className="text-sm text-destructive">Não foi possível carregar o contato do proprietário.</p>
      : owner ? <>
        <p className="font-semibold">{owner.full_name}</p>
        {owner.city && <p className="text-sm text-muted-foreground">{owner.city}</p>}
        <div className="flex flex-col gap-2 text-sm">
          {owner.phone && <a className="flex items-center gap-2" href={`tel:${owner.phone}`}><Phone className="h-4 w-4" />{owner.phone}</a>}
          {owner.whatsapp && <a className="flex items-center gap-2" href={`https://wa.me/55${owner.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />{owner.whatsapp}</a>}
          {owner.email && <a className="flex items-center gap-2 break-all" href={`mailto:${owner.email}`}><Mail className="h-4 w-4 shrink-0" />{owner.email}</a>}
        </div>
      </> : <p className="text-sm text-muted-foreground">Contato indisponível.</p>}
  </section>;
}