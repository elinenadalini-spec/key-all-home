import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/me';
import { filterOwners, type OwnerContact } from '@/lib/owner-directory';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function OwnerDirectory() {
  const { data: me } = useMe();
  const [search, setSearch] = useState('');
  const owners = useQuery({
    queryKey: ['owner-directory', me?.user.id, me?.isAdmin, me?.isAgent],
    enabled: !!me,
    queryFn: async (): Promise<OwnerContact[]> => {
      if (!me) return [];
      if (me.isAdmin) {
        const [profiles, contacts] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email, phone, city, address').eq('account_type', 'owner'),
          supabase.from('owner_directory').select('*'),
        ]);
        if (profiles.error) throw profiles.error;
        if (contacts.error) throw contacts.error;
        return [...(profiles.data ?? []), ...(contacts.data ?? [])];
      }
      if (me.isAgent) {
        const { data, error } = await supabase.rpc('agent_owner_contacts');
        if (error) throw error;
        return data ?? [];
      }
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, phone, city, address').eq('id', me.user.id);
      if (error) throw error;
      return data ?? [];
    },
  });
  const list = filterOwners(owners.data ?? [], search);
  return <section className="space-y-4 border-b pb-6">
    <h2 className="text-xl font-semibold">Proprietários</h2>
    <div className="max-w-lg space-y-2">
      <Label htmlFor="owner-search">Pesquisar proprietários</Label>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="owner-search" className="pl-9" placeholder="Nome, cidade, e-mail ou telefone" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    </div>
    {owners.isPending ? <p className="text-sm text-muted-foreground">Carregando proprietários…</p> : owners.isError ? <p className="text-sm text-destructive">Não foi possível carregar os proprietários.</p> : <>
      <p className="text-sm text-muted-foreground">{list.length} {list.length === 1 ? 'proprietário' : 'proprietários'}</p>
      <ul className="divide-y">
        {list.map((owner) => <li key={owner.id} className="space-y-1 py-3">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{owner.full_name}</h3>{owner.is_demo && <Badge variant="secondary">Fictício</Badge>}</div>
          <p className="break-words text-sm text-muted-foreground">{[owner.city, owner.phone, owner.email].filter(Boolean).join(' · ')}</p>
          {owner.address && <p className="break-words text-sm text-muted-foreground">{owner.address}</p>}
        </li>)}
      </ul>
      {!list.length && <p className="text-sm text-muted-foreground">Nenhum proprietário encontrado.</p>}
    </>}
  </section>;
}