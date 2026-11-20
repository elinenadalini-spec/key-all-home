import logoIcon from '@/assets/e-imovel-icone.png.asset.json';
import { segmentLabels, type Segment } from './segments';

export type TermPdfData = {
  authId: string; acceptedAt: string | null;
  property: { title: string; address: string | null; neighborhood: string | null; zip_code: string | null; city: string | null; segments: Segment[]; sale_commission_pct: number | null; seasonal_commission_pct: number | null; annual_first_rent_pct: number | null; annual_admin_fee_pct: number | null };
  owner: { name: string; document: string | null; phone: string | null; email: string | null };
  agent: { name: string; creci: string | null; creci_uf: string | null; phone: string | null; email: string | null };
};

export function validationCode(authId: string) { return authId.replace(/-/g, '').slice(0, 12).toUpperCase().replace(/(.{4})(?=.)/g, '$1-'); }
export function validationLink(authId: string, origin: string) { return `${origin}/validar-termo/${validationCode(authId)}`; }

export function percentLines(p: TermPdfData['property']) {
  return p.segments.map((s) => s === 'anual'
    ? `Anual: primeiro aluguel ${p.annual_first_rent_pct ?? '—'}% · taxa de administração ${p.annual_admin_fee_pct ?? '—'}%`
    : `${segmentLabels[s]}: ${(s === 'venda' ? p.sale_commission_pct : p.seasonal_commission_pct) ?? '—'}%`);
}

async function loadLogoDataUrl(origin: string) {
  const response = await fetch(new URL(logoIcon.url, origin));
  if (!response.ok) throw new Error('Não foi possível carregar o logotipo.');
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function downloadTermPdf(d: TermPdfData, origin: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let brandTextX = 15;
  try {
    const logo = await loadLogoDataUrl(origin);
    const image = doc.getImageProperties(logo);
    const width = 18;
    const height = width * image.height / image.width;
    doc.addImage(logo, 'PNG', 15, 14, width, height);
    brandTextX = 39;
  } catch {
    // O termo continua disponível com o nome da marca se a imagem não carregar.
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('e-imóvel', brandTextX, 25);
  doc.setDrawColor(190);
  doc.line(15, 35, 195, 35);
  let y = 43;
  const write = (text: string, opts: { bold?: boolean; size?: number } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(opts.size ?? 10);
    for (const line of doc.splitTextToSize(text, 180) as string[]) { if (y > 280) { doc.addPage(); y = 18; } doc.text(line, 15, y); y += (opts.size ?? 10) * 0.5; }
    y += 2;
  };
  const p = d.property;
  write('TERMO DE AUTORIZAÇÃO DE INTERMEDIAÇÃO IMOBILIÁRIA', { bold: true, size: 13 });
  write('IMÓVEL', { bold: true });
  write(`${p.title}\nEndereço: ${p.address || '—'}\nBairro: ${p.neighborhood || '—'} · CEP: ${p.zip_code || '—'}${p.city ? ` · ${p.city}` : ''}`);
  write('PROPRIETÁRIO', { bold: true });
  write(`${d.owner.name}\nCPF: ${d.owner.document || '—'} · Telefone: ${d.owner.phone || '—'} · E-mail: ${d.owner.email || '—'}`);
  write('PROFISSIONAL AUTORIZADO', { bold: true });
  write(`${d.agent.name}\nCRECI: ${d.agent.creci ? `${d.agent.creci}/${d.agent.creci_uf ?? ''}` : '—'} · Telefone: ${d.agent.phone || '—'} · E-mail: ${d.agent.email || '—'}`);
  write('SEGMENTOS AUTORIZADOS E PERCENTUAIS', { bold: true });
  write(percentLines(p).join('\n'));
  write('Prazo: indeterminado, válido até revogação pelo proprietário no app.');
  write('CONDIÇÕES', { bold: true });
  write('1. Os valores divulgados pelo profissional não podem ser superiores ao valor definido pelo proprietário no app acrescido da porcentagem acima.');
  write('2. Nas divulgações devem ser utilizadas as fotos constantes no cadastro do imóvel, bem como as informações do imóvel registradas no app.');
  write('3. O profissional deve atualizar-se constantemente no app, consultando valores e disponibilidade, para não trabalhar de forma desatualizada.');
  write(`Autorização concedida em: ${d.acceptedAt ? new Date(d.acceptedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'não registrado'} (horário de Brasília)`);
  write('VALIDAÇÃO', { bold: true });
  write(`Código: ${validationCode(d.authId)}\n${validationLink(d.authId, origin)}`);
  doc.save(`termo-${p.title.replace(/[^\w]+/g, '-').toLowerCase()}-${d.agent.name.replace(/[^\w]+/g, '-').toLowerCase()}.pdf`);
}
