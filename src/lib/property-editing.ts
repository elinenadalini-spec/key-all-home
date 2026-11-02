export function canEditPropertyInfo(ownerId: string, userId: string, isOwner: boolean, isAdmin: boolean): boolean {
  return isAdmin || (isOwner && ownerId === userId);
}