import { describe, expect, it } from 'vitest';
import { groupOwnerProperties } from '@/lib/owner-properties';
import type { Property } from '@/lib/me';

const property = (id: string, owner_id: string, segments: string[]) => ({ id, owner_id, segments } as Property);
describe('Imóveis autorizados por proprietário', () => {
  it('não mistura os imóveis de outro proprietário', () => {
    const groups = groupOwnerProperties([property('a', 'marina', ['venda']), property('b', 'outro', ['venda'])], 'marina');
    expect(groups[0]?.properties.map(p => p.id)).toEqual(['a']);
  });
  it('mostra o mesmo imóvel nos segmentos aos quais pertence, sem duplicar dentro do segmento', () => {
    const groups = groupOwnerProperties([property('a', 'marina', ['anual', 'temporada'])], 'marina');
    expect(groups.map(g => [g.segment, g.properties.map(p => p.id)])).toEqual([['venda', []], ['anual', ['a']], ['temporada', ['a']]]);
  });
});