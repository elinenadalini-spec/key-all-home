export function canEditPropertyInfo(ownerId: string, userId: string, isOwner: boolean, isAdmin: boolean): boolean {
  return isAdmin || (isOwner && ownerId === userId);
}

export function canEditPropertyCalendar(ownerId: string, userId: string, isOwner: boolean, isAdmin: boolean, segment: string | string[]): boolean {
  return (Array.isArray(segment) ? segment.includes('temporada') : segment === 'temporada') && canEditPropertyInfo(ownerId, userId, isOwner, isAdmin);
}