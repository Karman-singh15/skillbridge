import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { RoleSwitcher } from "./role-switcher";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const isAdmin =
    dbUser.email.toLowerCase().includes("admin") ||
    dbUser.name.toLowerCase().includes("admin");

  // Human-readable role tags
  const roleLabels: Record<string, string> = {
    STUDENT: "Student Profile",
    TRAINER: "Trainer Account",
    INSTITUTION: "Institution Partner",
    PROGRAMME_MANAGER: "Programme Manager",
    MONITORING_OFFICER: "Monitoring Officer (Read-Only)",
  };

  const roleColors: Record<string, string> = {
    STUDENT: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    TRAINER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    INSTITUTION: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    PROGRAMME_MANAGER: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    MONITORING_OFFICER: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Dynamic glow backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent hover:opacity-90 transition-all"
            >
              SkillBridge
            </Link>
            <span
              className={`hidden sm:inline-block px-3 py-1 text-xs font-semibold rounded-full border ${
                roleColors[dbUser.role] || "bg-zinc-800 text-zinc-400"
              }`}
            >
              {roleLabels[dbUser.role] || dbUser.role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && <RoleSwitcher currentRole={dbUser.role} />}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-zinc-100">{dbUser.name}</p>
              <p className="text-xs text-zinc-500">{dbUser.email}</p>
            </div>
            <div className="h-8 w-8 rounded-full border border-zinc-800 overflow-hidden flex items-center justify-center bg-zinc-900">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
