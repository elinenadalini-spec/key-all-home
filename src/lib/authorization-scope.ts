export type Scope = 'all' | 'some' | 'none';
export function authorizationScope(propertyIds: string[], authorized: Set<string>): Scope {
  const n = propertyIds.filter((id) => authorized.has(id)).length;
  if (n === 0) return 'none';
  return n === propertyIds.length ? 'all' : 'some';
}
export const scopeLabel: Record<Scope, string> = { all: 'Todos os imóveis', some: 'Apenas alguns imóveis', none: 'Não autorizado' };
