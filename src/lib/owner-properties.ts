import { propertySegments, segments } from './segments';
import type { Property } from './me';

// Input comes exclusively from the RLS-protected properties read, never the cover network.
export function groupOwnerProperties(properties: Property[], ownerId: string) {
  return segments.map((segment) => ({ segment, properties: properties.filter((property) => property.owner_id === ownerId && propertySegments(property).includes(segment)) }));
}