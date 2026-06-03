import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  // If user not in database, redirect to onboarding
  if (!dbUser) {
    redirect("/onboarding");
  }

  // Route to the appropriate role-based dashboard
  switch (dbUser.role) {
    case Role.STUDENT:
      redirect("/dashboard/student");
    case Role.TRAINER:
      redirect("/dashboard/trainer");
    case Role.INSTITUTION:
      redirect("/dashboard/institution");
    case Role.PROGRAMME_MANAGER:
      redirect("/dashboard/programme-manager");
    case Role.MONITORING_OFFICER:
      redirect("/dashboard/monitoring-officer");
    default:
      redirect("/onboarding");
  }
}
