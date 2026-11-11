import type { TermKey } from './terms';
export type TermRecord = { title: string; address: string | null; city: string | null; owner_name: string | null; owner_document: string | null; owner_email: string | null; accepted_at: string | null; accepted_ip: string | null };
export function buildTermText(terms: Record<TermKey, { title: string; body: string }>, r: TermRecord, agentName: string) {
  const when = r.accepted_at ? new Date(r.accepted_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'não registrado';
  return [terms.geral.title.toUpperCase(), '',
    `Imóvel: ${r.title}`, `Endereço: ${[r.address, r.city].filter(Boolean).join(' - ') || '—'}`,
    `Proprietário: ${r.owner_name || '—'}${r.owner_document ? ` (doc. ${r.owner_document})` : ''}${r.owner_email ? ` · ${r.owner_email}` : ''}`,
    `Profissional autorizado: ${agentName}`,
    `Autorização concedida em: ${when} (horário de Brasília)`,
    `IP do autorizador: ${r.accepted_ip || 'não disponível'}`, '',
    terms.geral.body, '', terms.proprietario.title, terms.proprietario.body, '', terms.corretor.title, terms.corretor.body, ''].join('\n');
}
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
