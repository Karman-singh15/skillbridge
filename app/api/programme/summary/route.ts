import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Programme Manager or Monitoring Officer
  if (
    dbUser.role !== Role.PROGRAMME_MANAGER &&
    dbUser.role !== Role.MONITORING_OFFICER
  ) {
    return Response.json(
      {
        error:
          "Forbidden: Only Programme Managers and Monitoring Officers can access system-wide summaries",
      },
      { status: 403 }
    );
  }

  // Fetch all institutions
  const institutions = await prisma.user.findMany({
    where: { role: Role.INSTITUTION },
  });

  // Fetch all batches
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

  // Calculate metrics
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

  const averageAttendanceRate =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // Institution detailed breakdown
  const institutionBreakdown = institutions.map((inst) => {
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
      institutionId: inst.id,
      name: inst.name,
      email: inst.email,
      batchesCount: instBatches.length,
      studentsCount: instStudents,
      attendanceRate: instRate,
    };
  });

  return Response.json(
    {
      totalInstitutions,
      totalBatches,
      totalStudents,
      averageAttendanceRate,
      institutions: institutionBreakdown,
    },
    { status: 200 }
  );
}
