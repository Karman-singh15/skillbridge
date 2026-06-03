import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import { requireRole } from "@/lib/auth";

export default async function ProgrammeManagerDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) redirect("/onboarding");
  requireRole(dbUser.role, [Role.PROGRAMME_MANAGER]);

  // Fetch all institutions
  const institutions = await prisma.user.findMany({
    where: {
      role: Role.INSTITUTION,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all batches across the program with their students and sessions
  const batches = await prisma.batch.findMany({
    include: {
      students: true,
      sessions: {
        include: {
          attendance: true,
        },
      },
    },
  });

  // Compute metrics
  const totalInstitutions = institutions.length;
  const totalBatches = batches.length;
  let totalStudents = 0;
  let totalPresent = 0;
  let totalMarked = 0;

  batches.forEach((b) => {
    totalStudents += b.students.length;
    b.sessions.forEach((s) => {
      s.attendance.forEach((att) => {
        totalMarked++;
        if (att.status === "PRESENT") {
          totalPresent++;
        }
      });
    });
  });

  const regionalAttendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // Group batch data by institutionId
  const instAnalytics = institutions.map((inst) => {
    const instBatches = batches.filter((b) => b.institutionId === inst.id);
    let instStudents = 0;
    let instPresent = 0;
    let instMarked = 0;

    instBatches.forEach((b) => {
      instStudents += b.students.length;
      b.sessions.forEach((s) => {
        s.attendance.forEach((att) => {
          instMarked++;
          if (att.status === "PRESENT") instPresent++;
        });
      });
    });

    const instRate = instMarked > 0 ? Math.round((instPresent / instMarked) * 100) : 0;

    return {
      id: inst.id,
      name: inst.name,
      email: inst.email,
      batchesCount: instBatches.length,
      studentsCount: instStudents,
      attendanceRate: instRate,
    };
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-radial from-purple-950/20 to-zinc-950 border border-purple-500/20">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Programme Manager Console
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          State-wide skilling metrics and institutional summaries.
        </p>
      </div>

      {/* Analytics Grid */}
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
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Students</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{totalStudents}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Programme Avg Attendance</p>
          <p className="text-4xl font-extrabold text-purple-400 mt-2">{regionalAttendanceRate}%</p>
        </div>
      </div>

      {/* Institutions Breakdown */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-6">
        <h2 className="text-xl font-bold text-zinc-100">Institutional Performance</h2>
        {instAnalytics.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-12">No institutions onboarded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="py-4">Institution Name</th>
                  <th className="py-4">Batches</th>
                  <th className="py-4">Students Enrolled</th>
                  <th className="py-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {instAnalytics.map((inst) => (
                  <tr key={inst.id} className="hover:bg-zinc-900/20 transition-all">
                    <td className="py-4 font-bold text-zinc-200">{inst.name}</td>
                    <td className="py-4 text-zinc-400">{inst.batchesCount}</td>
                    <td className="py-4 text-zinc-400">{inst.studentsCount}</td>
                    <td className="py-4 text-right font-extrabold text-purple-400">
                      {inst.attendanceRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
