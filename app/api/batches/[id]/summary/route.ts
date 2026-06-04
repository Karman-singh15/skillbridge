import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Institution
  if (dbUser.role !== Role.INSTITUTION) {
    return Response.json(
      { error: "Forbidden: Only Institutions can access batch summaries" },
      { status: 403 }
    );
  }

  // Fetch batch
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      students: true,
      sessions: {
        include: {
          attendance: true,
        },
      },
    },
  });

  if (!batch) {
    return Response.json({ error: "Batch not found" }, { status: 404 });
  }

  // Verify batch belongs to this institution
  if (batch.institutionId !== dbUser.id) {
    return Response.json(
      { error: "Forbidden: This batch does not belong to your institution" },
      { status: 403 }
    );
  }

  // Fetch student user names/emails
  const studentIds = batch.students.map((s) => s.studentId);
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Calculate metrics
  const totalSessions = batch.sessions.length;
  const totalStudents = batch.students.length;
  let totalPresent = 0;
  let totalMarked = 0;

  batch.sessions.forEach((s) => {
    s.attendance.forEach((att) => {
      totalMarked++;
      if (att.status === "PRESENT") {
        totalPresent++;
      }
    });
  });

  const averageAttendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // Session-wise attendance breakdown
  const sessionBreakdown = batch.sessions.map((s) => {
    let sessionPresent = 0;
    s.attendance.forEach((att) => {
      if (att.status === "PRESENT") sessionPresent++;
    });
    const sessionRate =
      s.attendance.length > 0
        ? Math.round((sessionPresent / s.attendance.length) * 100)
        : 0;

    return {
      sessionId: s.id,
      title: s.title,
      date: s.date.toISOString().split("T")[0],
      markedCount: s.attendance.length,
      attendanceRate: sessionRate,
    };
  });

  // Student-wise attendance rate
  const studentBreakdown = batch.students.map((bs) => {
    const studentUser = students.find((std) => std.id === bs.studentId);
    let studentPresent = 0;
    let studentSessionsCount = 0;

    batch.sessions.forEach((s) => {
      const att = s.attendance.find((a) => a.studentId === bs.studentId);
      if (att) {
        studentSessionsCount++;
        if (att.status === "PRESENT") studentPresent++;
      }
    });

    const studentRate =
      studentSessionsCount > 0
        ? Math.round((studentPresent / studentSessionsCount) * 100)
        : 0;

    return {
      studentId: bs.studentId,
      name: studentUser?.name || "Unknown Student",
      email: studentUser?.email || "",
      attendanceRate: studentRate,
      sessionsAttended: studentPresent,
    };
  });

  return Response.json(
    {
      batchId,
      batchName: batch.name,
      code: batch.code,
      totalSessions,
      totalStudents,
      averageAttendanceRate,
      sessions: sessionBreakdown,
      students: studentBreakdown,
    },
    { status: 200 }
  );
}
