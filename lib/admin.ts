import { getAuthUser } from "./supabase/server";
import { prisma } from "./db";

export async function getAdminUser() {
  const user = await getAuthUser();
  if (!user) return null;
  const profiel = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true, email: true },
  });
  if (!profiel?.isAdmin) return null;
  return { id: user.id, email: profiel.email };
}
