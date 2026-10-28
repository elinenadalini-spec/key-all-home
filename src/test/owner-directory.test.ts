import { describe, expect, it } from 'vitest';
import { filterOwners, type OwnerContact } from '@/lib/owner-directory';

const owners: OwnerContact[] = [
  { id: '1', full_name: 'João Oliveira', city: 'Florianópolis', email: 'joao@example.com', phone: null },
  { id: '2', full_name: 'Ana Almeida', city: 'São José', email: 'ana@example.com', phone: null },
  { id: '3', full_name: 'Bruno Carvalho', city: null, email: null, phone: '(00) 00000-0002' },
];
describe('pesquisa de proprietários', () => {
  it('mantém todos em ordem alfabética sem pesquisa', () => {
    expect(filterOwners(owners, '').map(owner => owner.full_name)).toEqual(['Ana Almeida', 'Bruno Carvalho', 'João Oliveira']);
  });
  it('pesquisa nomes e cidades sem exigir acentos', () => {
    expect(filterOwners(owners, 'joao').map(owner => owner.id)).toEqual(['1']);
    expect(filterOwners(owners, 'sao jose').map(owner => owner.id)).toEqual(['2']);
  });
});