import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { TrainerClient } from "./trainer-client";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function TrainerDashboard({ searchParams }: PageProps) {
  const { error } = await searchParams;
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

  // Get all unique student IDs in all batches of this trainer
  const studentIds = Array.from(
    new Set(batchTrainers.flatMap((bt) => bt.batch.students.map((s) => s.studentId)))
  );

  // Fetch student user details (name, email)
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Query sessions created by this trainer
  const sessions = await prisma.session.findMany({
    where: { trainerId: dbUser.id },
    include: {
      batch: {
        include: {
          students: true,
        },
      },
      attendance: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const mappedSessions = sessions.map((s) => {
    // Map students in the target batch of this session
    const studentList = s.batch.students.map((bs) => {
      const studentUser = students.find((std) => std.id === bs.studentId);
      const att = s.attendance.find((a) => a.studentId === bs.studentId);
      return {
        id: bs.studentId,
        name: studentUser?.name || "Unknown Student",
        email: studentUser?.email || "",
        status: att ? att.status : "UNMARKED",
        markedAt: att ? att.markedAt.toISOString() : null,
      };
    });

    return {
      id: s.id,
      title: s.title,
      date: s.date.toISOString().split("T")[0],
      startTime: s.startTime,
      endTime: s.endTime,
      batchName: s.batch.name,
      attendanceCount: s.attendance.length,
      students: studentList,
    };
  });

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

      <TrainerClient initialBatches={batches} initialSessions={mappedSessions} error={error} />
    </div>
  );
}
