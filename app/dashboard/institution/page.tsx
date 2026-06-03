import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import { requireRole } from "@/lib/auth";

export default async function InstitutionDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) redirect("/onboarding");
  requireRole(dbUser.role, [Role.INSTITUTION]);

  // Query trainers under this institution
  const trainers = await prisma.user.findMany({
    where: {
      role: Role.TRAINER,
      institutionId: dbUser.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Query batches under this institution
  const batches = await prisma.batch.findMany({
    where: {
      institutionId: dbUser.id,
    },
    include: {
      students: true,
      sessions: {
        include: {
          attendance: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Compute analytics
  let totalStudents = 0;
  let totalSessions = 0;
  let totalPresent = 0;
  let totalMarked = 0;

  batches.forEach((b) => {
    totalStudents += b.students.length;
    totalSessions += b.sessions.length;

    b.sessions.forEach((s) => {
      s.attendance.forEach((att) => {
        totalMarked++;
        if (att.status === "PRESENT") {
          totalPresent++;
        }
      });
    });
  });

  const overallAttendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="p-8 rounded-3xl bg-radial from-blue-950/20 to-zinc-950 border border-blue-500/20">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Institution Dashboard
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Managing trainers and batches for{" "}
          <strong className="text-blue-400">{dbUser.name}</strong>.
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Trainers</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{trainers.length}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Batches</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{batches.length}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Students</p>
          <p className="text-4xl font-extrabold text-zinc-100 mt-2">{totalStudents}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Average Attendance</p>
          <p className="text-4xl font-extrabold text-blue-400 mt-2">{overallAttendanceRate}%</p>
        </div>
      </div>

      {/* Batches & Trainers sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Batches list */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-6">
          <h2 className="text-xl font-bold text-zinc-100">Batches</h2>
          {batches.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">No batches registered.</p>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => {
                let batchPresent = 0;
                let batchMarked = 0;
                batch.sessions.forEach((s) => {
                  s.attendance.forEach((att) => {
                    batchMarked++;
                    if (att.status === "PRESENT") batchPresent++;
                  });
                });
                const batchRate = batchMarked > 0 ? Math.round((batchPresent / batchMarked) * 100) : 0;

                return (
                  <div
                    key={batch.id}
                    className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-zinc-200 text-base">{batch.name}</h3>
                      <div className="flex gap-4 text-xs text-zinc-500 mt-1">
                        <span>{batch.students.length} Students</span>
                        <span>{batch.sessions.length} Sessions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Attendance Rate</p>
                        <p className="text-sm font-bold text-blue-400">{batchRate}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trainers list */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl space-y-6">
          <h2 className="text-xl font-bold text-zinc-100">Institution Trainers</h2>
          {trainers.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">No onboarded trainers found.</p>
          ) : (
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div key={trainer.id} className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                  <h3 className="font-bold text-zinc-200 text-sm">{trainer.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{trainer.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
