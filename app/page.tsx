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
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-12 py-16">
        {/* Error Banner */}
        {error === "invalid_invite" && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-2xl">
            ⚠️ The invitation link you used is invalid or expired. Please request a new one from your trainer.
          </div>
        )}

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900/60 border border-zinc-850 text-xs font-semibold text-zinc-300 tracking-wider uppercase">
            ⚡ SkillBridge Programme
          </div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-white uppercase leading-none">
            SkillBridge
          </h1>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-light">
            A state-level skilling attendance and batch management platform connecting students, trainers, institutions, and state monitoring units.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {userId ? (
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm tracking-tight"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm tracking-tight"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-black border border-zinc-850 text-zinc-300 hover:bg-zinc-900 hover:text-white font-bold rounded-xl shadow-md transition-all text-sm tracking-tight cursor-pointer"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full pt-10 text-left">
          <div className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-white text-sm">Students</h3>
            <p className="text-xs text-zinc-500 mt-2 font-light">Self-mark attendance and view logging metrics.</p>
          </div>
          <div className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-orange-400 text-sm">Trainers</h3>
            <p className="text-xs text-zinc-500 mt-2 font-light">Manage batches, schedule sessions, and invite trainees.</p>
          </div>
          <div className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-blue-400 text-sm">Institutions</h3>
            <p className="text-xs text-zinc-500 mt-2 font-light">Manage trainer assignments and run aggregate performance analytics.</p>
          </div>
          <div className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-purple-400 text-sm">Managers</h3>
            <p className="text-xs text-zinc-500 mt-2 font-light">Oversee state-wide regional datasets and operational summaries.</p>
          </div>
          <div className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl backdrop-blur-md col-span-2 sm:col-span-1">
            <h3 className="font-bold text-amber-400 text-sm">Monitors</h3>
            <p className="text-xs text-zinc-500 mt-2 font-light">Audit all program metrics with safe read-only clearances.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
