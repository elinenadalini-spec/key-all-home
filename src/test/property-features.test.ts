import { describe, expect, it } from 'vitest';
import { changeSchema } from '@/lib/segments';
const propertyId = '00000000-0000-4000-8000-000000000001';
describe('Características do imóvel', () => {
  it('salva características marcadas e permite desmarcar todas', () => {
    expect(changeSchema.parse({ propertyId, patch: { amenities: ['Cozinha', 'Piscina', 'Energia solar'] } }).patch.amenities).toEqual(['Cozinha', 'Piscina', 'Energia solar']);
    expect(changeSchema.parse({ propertyId, patch: { amenities: [] } }).patch.amenities).toEqual([]);
  });
  for (const field of ['suites', 'bedrooms', 'bathrooms', 'garage_spaces', 'guests']) {
    it(`${field} aceita quantidades inteiras e rejeita frações/negativos`, () => {
      expect(changeSchema.parse({ propertyId, patch: { [field]: 3 } }).patch).toEqual({ [field]: 3 });
      expect(changeSchema.safeParse({ propertyId, patch: { [field]: -1 } }).success).toBe(false);
      expect(changeSchema.safeParse({ propertyId, patch: { [field]: 1.5 } }).success).toBe(false);
    });
  }
});