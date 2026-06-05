"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role, AttendanceStatus } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const joinBatchSchema = z.object({
  code: z.string().min(4, "Invite token or code must be at least 4 characters"),
});

export async function joinBatch(rawInput: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!dbUser) throw new Error("User not found");
    requireRole(dbUser.role, [Role.STUDENT]);

    const validation = joinBatchSchema.safeParse(rawInput);
    if (!validation.success) {
      return { error: validation.error.flatten().fieldErrors.code?.[0] || "Invalid invite token" };
    }

    const { code } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // Find matching invite first
      const invite = await tx.invite.findUnique({
        where: { code },
        include: {
          batch: {
            include: {
              students: true,
            },
          },
        },
      });

      let batch;
      if (invite) {
        if (invite.isOneTime && invite.isUsed) {
          throw new Error("This invite token has already been used.");
        }
        batch = invite.batch;
      } else {
        // Fallback to searching Batch directly by code
        batch = await tx.batch.findUnique({
          where: { code },
          include: {
            students: true,
          },
        });
      }

      if (!batch) {
        throw new Error("Invalid invite token or batch code.");
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

      // Mark invite as used if one-time
      if (invite && invite.isOneTime) {
        await tx.invite.update({
          where: { id: invite.id },
          data: { isUsed: true },
        });
      }

      return enrollment;
    });

    return { success: true, batchId: result.batchId };
  } catch (error: any) {
    return { error: error.message || "Failed to join batch." };
  }
}

export async function markAttendance(sessionId: string, clientOffset?: number) {
  try {
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
    const sessionDate = new Date(session.date);
    const year = sessionDate.getUTCFullYear();
    const month = sessionDate.getUTCMonth();
    const date = sessionDate.getUTCDate();

    const [startH, startM] = session.startTime.split(":").map(Number);
    const [endH, endM] = session.endTime.split(":").map(Number);

    let start: Date;
    let end: Date;

    if (typeof clientOffset === "number") {
      // Calculate UTC timestamps representing the session start and end times in the client's timezone.
      // Date.UTC returns epoch time in UTC. Adding clientOffset (in minutes) converted to ms aligns it to the client's local time.
      const startUtcMs = Date.UTC(year, month, date, startH, startM, 0, 0);
      const endUtcMs = Date.UTC(year, month, date, endH, endM, 0, 0);
      start = new Date(startUtcMs + clientOffset * 60 * 1000);
      end = new Date(endUtcMs + clientOffset * 60 * 1000);
    } else {
      // Fallback to local server timezone if offset not provided
      start = new Date(year, month, date, startH, startM, 0, 0);
      end = new Date(year, month, date, endH, endM, 0, 0);
    }

    const now = new Date();

    // Evaluate current time against window
    if (now < start) {
      throw new Error("Session has not started yet. You cannot mark attendance before the start time.");
    }

    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (now > end) {
      if (session.isStrict) {
        throw new Error("This is a strict session. You cannot mark attendance after the deadline.");
      }
      status = AttendanceStatus.LATE;
    }

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

export async function leaveBatch(batchId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!dbUser) throw new Error("User not found");
    requireRole(dbUser.role, [Role.STUDENT]);

    // Remove user enrollment for this batch
    await prisma.batchStudent.deleteMany({
      where: {
        batchId,
        studentId: dbUser.id,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to leave the batch." };
  }
}

