import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Trainer
  if (dbUser.role !== Role.TRAINER) {
    return Response.json(
      { error: "Forbidden: Only Trainers can view detailed session attendance lists" },
      { status: 403 }
    );
  }

  // Fetch session
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      batch: {
        include: {
          students: true,
          trainers: true,
        },
      },
      attendance: true,
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify trainer is assigned to this session's batch
  const isAssigned = session.batch.trainers.some(
    (t) => t.trainerId === dbUser.id
  );
  if (!isAssigned) {
    return Response.json(
      { error: "Forbidden: You are not assigned to this batch" },
      { status: 403 }
    );
  }

  // Fetch student details
  const studentIds = session.batch.students.map((s) => s.studentId);
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Map student attendance status
  const attendanceList = session.batch.students.map((bs) => {
    const studentUser = students.find((std) => std.id === bs.studentId);
    const att = session.attendance.find((a) => a.studentId === bs.studentId);
    return {
      studentId: bs.studentId,
      name: studentUser?.name || "Unknown Student",
      email: studentUser?.email || "",
      status: att ? att.status : "UNMARKED",
      markedAt: att ? att.markedAt : null,
    };
  });

  return Response.json(
    {
      sessionId,
      sessionTitle: session.title,
      date: session.date.toISOString().split("T")[0],
      startTime: session.startTime,
      endTime: session.endTime,
      attendance: attendanceList,
    },
    { status: 200 }
  );
}
