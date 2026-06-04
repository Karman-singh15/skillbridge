"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function switchRole(newRole: Role) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!dbUser) throw new Error("User not found");

    // Check if they are eligible for admin switcher (email or name contains "admin")
    const isAdmin =
      dbUser.email.toLowerCase().includes("admin") ||
      dbUser.name.toLowerCase().includes("admin");

    if (!isAdmin) {
      throw new Error("Only admin accounts can switch roles.");
    }

    // Update user's role in the database
    await prisma.user.update({
      where: { clerkUserId: userId },
      data: { role: newRole },
    });

    // Revalidate the dashboard paths to trigger correct client layout routing
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/trainer");
    revalidatePath("/dashboard/institution");
    revalidatePath("/dashboard/programme-manager");
    revalidatePath("/dashboard/monitoring-officer");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to switch role." };
  }
}
