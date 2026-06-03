"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role, AttendanceStatus } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const joinBatchSchema = z.object({
  code: z.string().length(4, "Batch code must be exactly 4 digits").regex(/^\d+$/, "Code must be numeric"),
});

export async function joinBatch(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!dbUser) throw new Error("User not found");
  requireRole(dbUser.role, [Role.STUDENT]);

  const validation = joinBatchSchema.safeParse(rawInput);
  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.code?.[0] || "Invalid batch code" };
  }

  const { code } = validation.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the batch by its unique 4-digit code
      const batch = await tx.batch.findUnique({
        where: { code },
        include: {
          students: true,
        },
      });

      if (!batch) {
        throw new Error("No batch found with this 4-digit code.");
      }

      // Check if student is already enrolled in this specific batch
      const alreadyEnrolled = await tx.batchStudent.findFirst({
        where: {
          studentId: dbUser.id,
          batchId: batch.id,
        },
      });

      if (alreadyEnrolled) {
        throw new Error("You are already enrolled in this batch.");
      }

      // Check capacity limit
      if (batch.maxStudents !== null && batch.students.length >= batch.maxStudents) {
        throw new Error("This batch has reached its maximum student capacity.");
      }

      // Join student to batch
      const enrollment = await tx.batchStudent.create({
        data: {
          batchId: batch.id,
          studentId: dbUser.id,
        },
      });

      return enrollment;
    });

    return { success: true, batchId: result.batchId };
  } catch (error: any) {
    return { error: error.message || "Failed to join batch." };
  }
}

export async function markAttendance(sessionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!dbUser) throw new Error("User not found");
  requireRole(dbUser.role, [Role.STUDENT]);

  // Fetch session details
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new Error("Session not found");
  }

  // Verify student is enrolled in the batch for this session
  const enrollment = await prisma.batchStudent.findFirst({
    where: {
      studentId: dbUser.id,
      batchId: session.batchId,
    },
  });
  if (!enrollment) {
    throw new Error("You are not enrolled in the batch for this session.");
  }

  // Verify attendance not already marked
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      sessionId,
      studentId: dbUser.id,
    },
  });
  if (existingAttendance) {
    throw new Error("Attendance already marked for this session.");
  }

  // Calculate session start & end time
  const year = session.date.getUTCFullYear();
  const month = session.date.getUTCMonth();
  const date = session.date.getUTCDate();

  const [startH, startM] = session.startTime.split(":").map(Number);
  const [endH, endM] = session.endTime.split(":").map(Number);

  const start = new Date(year, month, date, startH, startM, 0, 0);
  const end = new Date(year, month, date, endH, endM, 0, 0);
  const now = new Date();

  // Evaluate current time against window
  if (now < start) {
    throw new Error("Session has not started yet. You cannot mark attendance before the start time.");
  }

  let status: AttendanceStatus = AttendanceStatus.PRESENT;
  if (now > end) {
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

    return { success: true, attendance };
  } catch (error: any) {
    return { error: error.message || "Failed to mark attendance." };
  }
}

