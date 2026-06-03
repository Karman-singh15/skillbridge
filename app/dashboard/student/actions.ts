"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
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

      // Check if student is already in a batch
      const alreadyJoined = await tx.batchStudent.findFirst({
        where: { studentId: dbUser.id },
      });

      if (alreadyJoined) {
        throw new Error("You are already enrolled in a batch.");
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
