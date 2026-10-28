import { describe, expect, it } from 'vitest';
import { asSegment, calendarDayChange, changeSchema, priceSuffix, segmentLabels } from '@/lib/segments';

describe('Segmentos e valores', () => {
  it('preserva observações e diária ao bloquear ou liberar uma data', () => {
    const current = { day: '2026-10-30', price: 650.25, blocked: false, note: 'Observação do proprietário' };
    expect(calendarDayChange(current.day, current, { blocked: true })).toEqual({ ...current, blocked: true });
    expect(calendarDayChange(current.day, { ...current, blocked: true }, { blocked: false })).toEqual(current);
  });
  it('preserva observações e bloqueio ao alterar ou restaurar a diária', () => {
    const current = { day: '2026-10-30', price: 650.25, blocked: true, note: 'Observação do proprietário' };
    expect(calendarDayChange(current.day, current, { price: 700.50 })).toEqual({ ...current, price: 700.50 });
    expect(calendarDayChange(current.day, current, { price: null })).toEqual({ ...current, price: null });
  });
  it('aceita os três segmentos solicitados e rejeita outros', () => {
    expect(['venda','anual','temporada'].map(asSegment)).toEqual(['venda','anual','temporada']);
    expect(() => asSegment('comercial')).toThrow();
    expect(segmentLabels).toEqual({ venda: 'Venda', anual: 'Anual', temporada: 'Temporada' });
  });
  it('usa valor total em Venda, mensal em Anual e diária em Temporada', () => {
    expect(priceSuffix('venda')).toBe('');
    expect(priceSuffix('anual')).toBe('/mês');
    expect(priceSuffix('temporada')).toBe('/noite');
  });
  it('valida atualização de valores sem permitir valor negativo', () => {
    const data = { propertyId: '00000000-0000-4000-8000-000000000001', patch: { base_price: 350000.50, segment: 'venda' } };
    expect(changeSchema.parse(data).patch.base_price).toBe(350000.50);
    expect(() => changeSchema.parse({ ...data, patch: { base_price: -1 } })).toThrow();
  });
  it('não aceita propriedade de outro dono nem IP dentro dos campos alteráveis', () => {
    const propertyId = '00000000-0000-4000-8000-000000000001';
    expect(() => changeSchema.parse({ propertyId, patch: { owner_id: propertyId } })).toThrow();
    expect(() => changeSchema.parse({ propertyId, patch: { observed_ip: '127.0.0.1' } })).toThrow();
  });
});