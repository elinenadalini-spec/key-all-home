// Null means no additional owner filter; database policies still govern access.
export function inventoryOwnerFilter(viewer: { isAdmin: boolean; isOwner: boolean; user: { id: string } }): string | null {
  return viewer.isOwner && !viewer.isAdmin ? viewer.user.id : null;
}