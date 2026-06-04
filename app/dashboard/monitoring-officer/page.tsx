import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import { requireRole } from "@/lib/auth";

export default async function MonitoringOfficerDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) redirect("/onboarding");
  requireRole(dbUser.role, [Role.MONITORING_OFFICER]);

  // Fetch all data for read-only view
  const institutions = await prisma.user.findMany({
    where: { role: Role.INSTITUTION },
    orderBy: { name: "asc" },
  });

  const batches = await prisma.batch.findMany({
    include: {
      students: true,
      trainers: {
        include: {
          batch: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const sessions = await prisma.session.findMany({
    include: {
      batch: true,
      trainer: true,
      attendance: true,
    },
    orderBy: [
      { date: "desc" },
      { startTime: "desc" },
    ],
  });

  // Calculate totals
  const totalInstitutions = institutions.length;
  const totalBatches = batches.length;
  const totalSessions = sessions.length;

  let totalPresent = 0;
  let totalMarked = 0;
  sessions.forEach((s) => {
    s.attendance.forEach((att) => {
      totalMarked++;
      if (att.status === "PRESENT") totalPresent++;
    });
  });

  const overallAttendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="p-8 rounded-3xl bg-radial from-amber-950/20 to-zinc-950 border border-amber-500/20">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Monitoring Officer Portal
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Programme-wide audit console. You have <strong className="text-amber-400">Read-Only Access</strong> to all operational databases.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Institutions</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{totalInstitutions}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Batches</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{totalBatches}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Sessions</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{totalSessions}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Programme Attendance Rate</p>
          <p className="text-4xl font-extrabold text-amber-400 mt-2">{overallAttendanceRate}%</p>
        </div>
      </div>

      {/* Sessions Audit Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-6">
        <h2 className="text-xl font-bold text-zinc-100">Live Session Log</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-12">No sessions logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="py-4">Session Title</th>
                  <th className="py-4">Batch</th>
                  <th className="py-4">Trainer</th>
                  <th className="py-4">Date & Time</th>
                  <th className="py-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {sessions.map((session) => {
                  let sPresent = 0;
                  let sMarked = 0;
                  session.attendance.forEach((a) => {
                    sMarked++;
                    if (a.status === "PRESENT") sPresent++;
                  });
                  const sRate = sMarked > 0 ? Math.round((sPresent / sMarked) * 100) : 0;

                  return (
                    <tr key={session.id} className="hover:bg-zinc-900/20 transition-all">
                      <td className="py-4 font-bold text-zinc-200">{session.title}</td>
                      <td className="py-4 text-zinc-400">{session.batch.name}</td>
                      <td className="py-4 text-zinc-400">{session.trainer.name}</td>
                      <td className="py-4 text-zinc-400">
                        {session.date.toISOString().split("T")[0]} ({session.startTime} - {session.endTime})
                      </td>
                      <td className="py-4 text-right font-extrabold text-amber-400">
                        {sMarked > 0 ? `${sRate}%` : "No attendance marked"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
