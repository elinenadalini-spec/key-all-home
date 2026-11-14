const prefixes = /^(rua|r\.|avenida|av\.?|alameda|al\.?|travessa|tv\.?|servid[aã]o|serv\.?|rodovia|rod\.?|estrada|est\.?|pra[cç]a|p[cç]\.?|largo|via|beco)\s+/i;
/** Street name without the logradouro type (Rua, Av., Servidão…), for alphabetical sorting. */
export function streetKey(address: string | null | undefined) {
  return (address ?? '').trim().replace(prefixes, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
export function sortByStreet<T extends { address: string | null; title?: string }>(items: T[]) {
  return [...items].sort((a, b) => (streetKey(a.address) || '\uffff').localeCompare(streetKey(b.address) || '\uffff', 'pt-BR', { numeric: true }) || (a.title ?? '').localeCompare(b.title ?? '', 'pt-BR'));
}
export function percentInput(value: string, max = 99) { return value === '' ? null : Math.min(max, Math.max(0, Math.trunc(Number(value)))); }
