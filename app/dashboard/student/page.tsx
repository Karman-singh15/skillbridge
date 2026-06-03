import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { JoinBatchForm } from "./join-batch-form";

export default async function StudentDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) redirect("/onboarding");
  requireRole(dbUser.role, [Role.STUDENT]);

  // Find the student's batch
  const batchStudent = await prisma.batchStudent.findFirst({
    where: { studentId: dbUser.id },
    include: {
      batch: {
        include: {
          sessions: {
            include: {
              attendance: {
                where: { studentId: dbUser.id },
              },
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      },
    },
  });

  const batch = batchStudent?.batch;
  const sessions = batch?.sessions || [];

  if (!batch) {
    return (
      <div className="space-y-8">
        <div className="p-8 rounded-3xl bg-radial from-teal-950/20 to-zinc-950 border border-teal-500/20">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            Welcome back, {dbUser.name}!
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            You are not currently enrolled in any skilling batch.
          </p>
        </div>
        <JoinBatchForm />
      </div>
    );
  }

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
        <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm">
          <span className="text-zinc-400">Batch: </span>
          <strong className="text-teal-400">{batch.name}</strong>
        </div>
      </div>

      {/* Attendance Summary */}
      {batch && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Sessions</p>
            <p className="text-4xl font-extrabold text-zinc-100 mt-2">{sessions.length}</p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Present Count</p>
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
      )}

      {/* Session List */}
      <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Upcoming & Recent Sessions</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No sessions scheduled for this batch yet.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const attendance = session.attendance[0];
              const isToday = new Date(session.date).toDateString() === new Date().toDateString();

              return (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl bg-zinc-950/50 border border-zinc-900 hover:border-zinc-850 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <h3 className="font-bold text-zinc-100">{session.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1">
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                      <span>
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {attendance ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          attendance.status === "PRESENT"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : attendance.status === "LATE"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {attendance.status}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 mr-2">Unmarked</span>
                        {isToday && (
                          <button className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer">
                            Self-Mark Present
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
