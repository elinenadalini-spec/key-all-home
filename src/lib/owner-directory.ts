export type OwnerContact = { id: string; full_name: string; email: string | null; phone: string | null; city: string | null; whatsapp?: string | null; address?: string | null; is_demo?: boolean };

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
export function filterOwners(owners: OwnerContact[], search: string) {
  const query = normalize(search);
  return owners.filter((owner) => normalize([owner.full_name, owner.email, owner.phone, owner.city].filter(Boolean).join(' ')).includes(query))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
}