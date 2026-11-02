import { describe, expect, it } from 'vitest';
import { canEditPropertyInfo } from '@/lib/property-editing';
describe('Edição de informações', () => {
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