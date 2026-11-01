import { describe, expect, it } from 'vitest';
import { inventoryOwnerFilter } from '@/lib/property-inventory';

describe('Escopo da carteira de imóveis', () => {
  it('não limita o administrador aos imóveis da própria conta, mesmo tendo papel de proprietário', () => {
    expect(inventoryOwnerFilter({ isAdmin: true, isOwner: true, user: { id: 'admin-owner' } })).toBeNull();
  });
  it('mantém o proprietário comum limitado aos imóveis dele', () => {
    expect(inventoryOwnerFilter({ isAdmin: false, isOwner: true, user: { id: 'owner' } })).toBe('owner');
  });
  it('deixa a autorização individual dos profissionais sob controle das políticas de acesso', () => {
    expect(inventoryOwnerFilter({ isAdmin: false, isOwner: false, user: { id: 'agent' } })).toBeNull();
  });
});