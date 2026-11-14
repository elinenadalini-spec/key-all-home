import { describe, expect, it } from 'vitest';
import { percentInput, sortByStreet } from '@/lib/street-sort';
describe('ordem dos imóveis por rua', () => {
  it('ignora o logradouro ao ordenar', () => {
    const list = sortByStreet([{ address: 'Rua das Gaivotas, 10' }, { address: 'Av. dos Búzios, 5' }, { address: 'Servidão Albatroz, 2' }]);
    expect(list.map((p) => p.address)).toEqual(['Servidão Albatroz, 2', 'Rua das Gaivotas, 10', 'Av. dos Búzios, 5']);
  });
  it('percentual aceita no máximo 2 dígitos', () => { expect(percentInput('150')).toBe(99); expect(percentInput('05')).toBe(5); expect(percentInput('100', 100)).toBe(100); });
});
import { percentLines, validationCode } from '@/lib/term-pdf';
describe('termo de autorização', () => {
  it('mostra percentuais por segmento, com primeiro aluguel e taxa no Anual', () => {
    expect(percentLines({ segments: ['venda', 'anual', 'temporada'], sale_commission_pct: 5, seasonal_commission_pct: 15, annual_first_rent_pct: 100, annual_admin_fee_pct: 10 } as never))
      .toEqual(['Venda: 5%', 'Anual: primeiro aluguel 100% · taxa de administração 10%', 'Temporada: 15%']);
  });
  it('gera código de validação estável', () => { expect(validationCode('abcd1234-ef56-7890-0000-000000000000')).toBe('ABCD-1234-EF56'); });
});
