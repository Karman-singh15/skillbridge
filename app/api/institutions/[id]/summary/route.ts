import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: institutionId } = await params;
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Programme Manager
  if (dbUser.role !== Role.PROGRAMME_MANAGER) {
    return Response.json(
      { error: "Forbidden: Only Programme Managers can view institution summaries" },
      { status: 403 }
    );
  }

  // Verify target institution exists
  const targetInstitution = await prisma.user.findFirst({
    where: {
      id: institutionId,
      role: Role.INSTITUTION,
    },
  });
  if (!targetInstitution) {
    return Response.json({ error: "Institution not found" }, { status: 404 });
  }

  // Fetch all batches for this institution
  const batches = await prisma.batch.findMany({
    where: { institutionId },
    include: {
      students: true,
      sessions: {
        include: {
          attendance: true,
        },
      },
    },
  });

  // Calculate metrics
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

  const averageAttendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // Batch breakdown details
  const batchBreakdown = batches.map((b) => {
    let batchPresent = 0;
    let batchMarked = 0;
    b.sessions.forEach((s) => {
      s.attendance.forEach((att) => {
        batchMarked++;
        if (att.status === "PRESENT") batchPresent++;
      });
    });
    const batchRate =
      batchMarked > 0 ? Math.round((batchPresent / batchMarked) * 100) : 0;

    return {
      batchId: b.id,
      name: b.name,
      code: b.code,
      studentCount: b.students.length,
      sessionsCount: b.sessions.length,
      attendanceRate: batchRate,
    };
  });

  return Response.json(
    {
      institutionId,
      institutionName: targetInstitution.name,
      institutionEmail: targetInstitution.email,
      totalBatches,
      totalStudents,
      averageAttendanceRate,
      batches: batchBreakdown,
    },
    { status: 200 }
  );
}
