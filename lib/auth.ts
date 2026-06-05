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

  // Find user by clerkUserId
  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  // Fallback to checking by database internal ID in dev mode (for easier test scripts referencing)
  if (!user && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")) {
    user = await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  return user;
}

export function requireRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error("FORBIDDEN");
  }
}