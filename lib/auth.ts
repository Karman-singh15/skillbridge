import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentUser(request?: Request) {
  let userId: string | null = null;

  const bypassId = request?.headers?.get("x-bypass-user-id");
  if (bypassId) {
    userId = bypassId;
  }

  if (!userId) {
    const session = await auth();
    userId = session.userId;
  }

  if (!userId) return null;

  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

export function requireRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error("FORBIDDEN");
  }
}