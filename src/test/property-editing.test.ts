import { describe, expect, it } from 'vitest';
import { canEditPropertyCalendar, canEditPropertyInfo } from '@/lib/property-editing';
describe('Edição de informações', () => {
  it('permite ao administrador alterar diárias e datas de Temporada de outro proprietário', () => {
    expect(canEditPropertyCalendar('owner', 'admin', false, true, 'temporada')).toBe(true);
  });
  it('permite ao proprietário alterar seu calendário de Temporada', () => {
    expect(canEditPropertyCalendar('owner', 'owner', true, false, 'temporada')).toBe(true);
  });
  it('mantém o calendário somente leitura para profissionais e outros proprietários', () => {
    expect(canEditPropertyCalendar('owner', 'agent', false, false, 'temporada')).toBe(false);
    expect(canEditPropertyCalendar('owner', 'other', true, false, 'temporada')).toBe(false);
  });
  it('não permite editar calendário nos segmentos Venda e Anual', () => {
    expect(canEditPropertyCalendar('owner', 'admin', false, true, 'venda')).toBe(false);
    expect(canEditPropertyCalendar('owner', 'admin', false, true, 'anual')).toBe(false);
  });
  it('permite ao administrador editar imóveis de outros proprietários', () => {
    expect(canEditPropertyInfo('owner', 'admin', false, true)).toBe(true);
  });
  it('permite ao proprietário editar seu imóvel', () => {
    expect(canEditPropertyInfo('owner', 'owner', true, false)).toBe(true);
  });
  it('não permite editar imóvel de outro proprietário', () => {
    expect(canEditPropertyInfo('other', 'owner', true, false)).toBe(false);
  });
  it('mantém corretor e imobiliária apenas com leitura', () => {
    expect(canEditPropertyInfo('owner', 'agent', false, false)).toBe(false);
  });
});