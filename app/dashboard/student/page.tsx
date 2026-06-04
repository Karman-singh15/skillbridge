import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { JoinBatchForm } from "./join-batch-form";
import { StudentSessionItem } from "./student-session-item";
import { LeaveBatchButton } from "./leave-batch-button";

interface PageProps {
  searchParams: Promise<{
    batchId?: string;
    join?: string;
    joined?: string;
    error?: string;
    info?: string;
  }>;
}

export default async function StudentDashboard({ searchParams }: PageProps) {
  const { batchId, join, joined, error, info } = await searchParams;
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

  // Find next batch to fallback to if this batch is left
  const nextBatch = activeBatch ? batches.find((b) => b.id !== activeBatch.id) : undefined;

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

  const mappedSessions = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    attendance: s.attendance.map((a) => ({
      id: a.id,
      status: a.status,
    })),
  }));

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {joined && (
        <div className="p-4 bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-2xl flex items-center gap-3 animate-fadeIn">
          <svg className="w-5 h-5 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">
            Successfully enrolled and joined batch: <strong className="text-white font-bold">{joined}</strong>!
          </span>
        </div>
      )}

      {info && (
        <div className="p-4 bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-2xl flex items-center gap-3 animate-fadeIn">
          <svg className="w-5 h-5 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">{info}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-zinc-900 border border-zinc-850 text-red-400 rounded-2xl flex items-center gap-3 animate-fadeIn">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-zinc-900/10 border border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {dbUser.name}!
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track your classes, self-mark attendance, and view your records.
          </p>
        </div>
        {activeBatch ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-900 text-sm">
              <span className="text-zinc-400">Viewing Batch: </span>
              <strong className="text-white font-bold">{activeBatch.name}</strong>
            </div>
            <LeaveBatchButton
              batchId={activeBatch.id}
              batchName={activeBatch.name}
              nextBatchId={nextBatch?.id}
            />
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
                    ? "bg-white text-black border-white font-bold"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-250"
                }`}
              >
                {b.name}
              </Link>
            );
          })}
          <Link
            href={`/dashboard/student?batchId=${activeBatchId || ""}&join=true`}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-dashed border-zinc-800 bg-zinc-950/20 hover:border-zinc-500 hover:bg-zinc-900/40 hover:text-white text-zinc-500 flex items-center gap-1.5 transition-all cursor-pointer"
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
              <p className="text-4xl font-extrabold text-white mt-2">
                {sessions.filter((s) => s.attendance[0]?.status === "PRESENT").length}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Attendance Rate</p>
              <p className="text-4xl font-extrabold text-white mt-2">
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
                {mappedSessions.map((session) => (
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
