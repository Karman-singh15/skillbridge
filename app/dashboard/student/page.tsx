import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { JoinBatchForm } from "./join-batch-form";
import { StudentSessionItem } from "./student-session-item";

interface PageProps {
  searchParams: Promise<{ batchId?: string; join?: string }>;
}

export default async function StudentDashboard({ searchParams }: PageProps) {
  const { batchId, join } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) redirect("/onboarding");
  requireRole(dbUser.role, [Role.STUDENT]);

  // Find all batches the student is enrolled in
  const batchStudents = await prisma.batchStudent.findMany({
    where: { studentId: dbUser.id },
    include: {
      batch: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const batches = batchStudents.map((bs) => bs.batch);
  const hasBatches = batches.length > 0;

  // Selected batch logic
  const activeBatchId = batchId || (hasBatches ? batches[0].id : undefined);
  const activeBatch = hasBatches
    ? (batches.find((b) => b.id === activeBatchId) || batches[0])
    : undefined;

  // Fetch sessions for active batch
  const sessions = activeBatch
    ? await prisma.session.findMany({
        where: { batchId: activeBatch.id },
        include: {
          attendance: {
            where: { studentId: dbUser.id },
          },
        },
        orderBy: {
          date: "desc",
        },
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-radial from-teal-950/20 to-zinc-950 border border-teal-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            Welcome back, {dbUser.name}!
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track your classes, self-mark attendance, and view your records.
          </p>
        </div>
        {activeBatch ? (
          <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm">
            <span className="text-zinc-400">Viewing Batch: </span>
            <strong className="text-teal-400">{activeBatch.name}</strong>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            No batch assigned yet.
          </div>
        )}
      </div>

      {/* Batch Switcher Tabs & Join Another Batch trigger */}
      {hasBatches && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
          {batches.map((b) => {
            const isActive = activeBatch && b.id === activeBatch.id;
            return (
              <Link
                key={b.id}
                href={`/dashboard/student?batchId=${b.id}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  isActive
                    ? "bg-teal-500/15 text-teal-400 border-teal-500/30 font-bold"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-250"
                }`}
              >
                {b.name}
              </Link>
            );
          })}
          <Link
            href={`/dashboard/student?batchId=${activeBatchId || ""}&join=true`}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-dashed border-zinc-800 bg-zinc-950/20 hover:border-teal-500/50 hover:bg-teal-500/5 hover:text-teal-400 text-zinc-500 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Join Another Batch</span>
          </Link>
        </div>
      )}

      {/* Join Batch Overlay Modal */}
      {join === "true" && activeBatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <JoinBatchForm
              showCancel
              cancelHref={`/dashboard/student?batchId=${activeBatch.id}`}
            />
          </div>
        </div>
      )}

      {/* Conditional Layout */}
      {!hasBatches ? (
        <div className="py-6">
          <JoinBatchForm />
        </div>
      ) : (
        <>
          {/* Attendance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Sessions</p>
              <p className="text-4xl font-extrabold text-zinc-100 mt-2">{sessions.length}</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">On Time Count</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                {sessions.filter((s) => s.attendance[0]?.status === "PRESENT").length}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Attendance Rate</p>
              <p className="text-4xl font-extrabold text-teal-400 mt-2">
                {sessions.length > 0
                  ? `${Math.round(
                      (sessions.filter((s) => s.attendance[0]?.status === "PRESENT").length /
                        sessions.length) *
                        100
                    )}%`
                  : "0%"}
              </p>
            </div>
          </div>

          {/* Session List */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-zinc-100 mb-6">Upcoming & Recent Sessions</h2>
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No sessions scheduled for this batch yet.
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <StudentSessionItem key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
