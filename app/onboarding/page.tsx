import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Double check if user is already in DB
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  });

  // If already in DB, redirect to dashboard
  if (dbUser) {
    redirect("/dashboard");
  }

  // Fetch institutions dynamically from Neon DB
  const institutions = await prisma.user.findMany({
    where: { role: Role.INSTITUTION },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-zinc-900 to-black p-4 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-2xl">
        <OnboardingForm
          institutions={institutions}
          defaultEmail={user.emailAddresses[0]?.emailAddress || ""}
          defaultName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
        />
      </div>
    </div>
  );
}
