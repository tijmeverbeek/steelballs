import { prisma } from "./db";

export async function isOrganisatorOrAdmin(userId: string, poule: { organisatorId: string | null }): Promise<boolean> {
  if (poule.organisatorId === userId) return true;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return user?.isAdmin === true;
}
