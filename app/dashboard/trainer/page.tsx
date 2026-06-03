import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { TrainerClient } from "./trainer-client";

export default async function TrainerDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) redirect("/onboarding");
  requireRole(dbUser.role, [Role.TRAINER]);

  // Query batches for this trainer
  const batchTrainers = await prisma.batchTrainer.findMany({
    where: { trainerId: dbUser.id },
    include: {
      batch: {
        include: {
          students: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const batches = batchTrainers.map((bt) => ({
    id: bt.batch.id,
    name: bt.batch.name,
    code: bt.batch.code,
    maxStudents: bt.batch.maxStudents,
    studentCount: bt.batch.students.length,
  }));

  // Query sessions created by this trainer
  const sessions = await prisma.session.findMany({
    where: { trainerId: dbUser.id },
    include: {
      batch: true,
      attendance: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const mappedSessions = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date.toISOString().split("T")[0],
    startTime: s.startTime,
    endTime: s.endTime,
    batchName: s.batch.name,
    attendanceCount: s.attendance.length,
  }));

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-radial from-emerald-950/20 to-zinc-950 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            Trainer Workspace
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your batches, schedule training sessions, and onboard students.
          </p>
        </div>
      </div>

      <TrainerClient initialBatches={batches} initialSessions={mappedSessions} />
    </div>
  );
}
