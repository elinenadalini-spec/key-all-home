import { describe, expect, it } from 'vitest';
import { authorizationScope } from '@/lib/authorization-scope';
describe('authorizationScope', () => {
  it('all when every property authorized', () => expect(authorizationScope(['a', 'b'], new Set(['a', 'b']))).toBe('all'));
  it('some when only one of two', () => expect(authorizationScope(['a', 'b'], new Set(['a']))).toBe('some'));
  it('none when no property', () => expect(authorizationScope(['a'], new Set())).toBe('none'));
});
