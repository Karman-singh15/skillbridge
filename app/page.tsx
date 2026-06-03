import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

interface HomeProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { userId } = await auth();
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-10 py-16">
        {/* Error Banner */}
        {error === "invalid_invite" && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl animate-bounce">
            ⚠️ The invitation link you used is invalid or expired. Please request a new one from your trainer.
          </div>
        )}

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-teal-400 tracking-wider uppercase">
            🚀 SkillBridge Programme
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-teal-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent leading-none">
            SkillBridge
          </h1>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed">
            A state-level skilling attendance and batch management platform connecting students, trainers, institutions, and state monitoring units.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {userId ? (
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-teal-500/10 hover:scale-[1.02] transition-all cursor-pointer"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-teal-500/10 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-200 font-bold rounded-2xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full pt-10 text-left">
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-teal-400 text-sm">Students</h3>
            <p className="text-xs text-zinc-500 mt-2">Self-mark attendance and view logging metrics.</p>
          </div>
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-emerald-400 text-sm">Trainers</h3>
            <p className="text-xs text-zinc-500 mt-2">Manage batches, schedule sessions, and invite trainees.</p>
          </div>
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-blue-400 text-sm">Institutions</h3>
            <p className="text-xs text-zinc-500 mt-2">Manage trainer assignments and run aggregate performance analytics.</p>
          </div>
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-purple-400 text-sm">Managers</h3>
            <p className="text-xs text-zinc-500 mt-2">Oversee state-wide regional datasets and operational summaries.</p>
          </div>
          <div className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md col-span-2 sm:col-span-1">
            <h3 className="font-bold text-amber-400 text-sm">Monitors</h3>
            <p className="text-xs text-zinc-500 mt-2">Audit all program metrics with safe read-only clearances.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
