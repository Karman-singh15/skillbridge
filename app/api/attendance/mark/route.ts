import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, AttendanceStatus } from "@/lib/generated/prisma/enums";

export async function POST(request: Request) {
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Student
  if (dbUser.role !== Role.STUDENT) {
    return Response.json(
      { error: "Forbidden: Only Students can mark attendance" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId || typeof sessionId !== "string") {
    return Response.json({ error: "Session ID is required" }, { status: 400 });
  }

  // Fetch session
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify student is enrolled in the batch for this session
  const enrollment = await prisma.batchStudent.findFirst({
    where: {
      batchId: session.batchId,
      studentId: dbUser.id,
    },
  });
  if (!enrollment) {
    return Response.json(
      { error: "Forbidden: You are not enrolled in the batch for this session" },
      { status: 403 }
    );
  }

  // Verify attendance not already marked
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      sessionId,
      studentId: dbUser.id,
    },
  });
  if (existingAttendance) {
    return Response.json(
      { error: "Attendance already marked for this session" },
      { status: 400 }
    );
  }

  // Compute time bounds in local system time
  const year = session.date.getUTCFullYear();
  const month = session.date.getUTCMonth();
  const date = session.date.getUTCDate();

  const [startH, startM] = session.startTime.split(":").map(Number);
  const [endH, endM] = session.endTime.split(":").map(Number);

  const start = new Date(year, month, date, startH, startM, 0, 0);
  const end = new Date(year, month, date, endH, endM, 0, 0);
  const now = new Date();

  if (now < start) {
    return Response.json(
      { error: "Session has not started yet. You cannot mark attendance before the start time." },
      { status: 400 }
    );
  }

  let status: AttendanceStatus = AttendanceStatus.PRESENT;
  if (now > end) {
    if (session.isStrict) {
      return Response.json(
        { error: "This is a strict session. You cannot mark attendance after the deadline." },
        { status: 400 }
      );
    }
    status = AttendanceStatus.LATE;
  }

  try {
    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        studentId: dbUser.id,
        status,
      },
    });

    return Response.json(
      {
        message: "Attendance marked successfully",
        status: status === AttendanceStatus.PRESENT ? "PRESENT" : "LATE",
        attendance,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
