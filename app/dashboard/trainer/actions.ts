"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const sessionSchema = z.object({
  title: z.string().min(2, "Session title is required"),
  date: z.string().transform((str) => new Date(str)),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time"),
  batchId: z.string().min(1, "Please select a batch"),
  isStrict: z.boolean().optional(),
}).refine((data) => {
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return startMinutes < endMinutes;
}, {
  message: "Start time must be before end time",
  path: ["startTime"],
});

const batchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  maxStudents: z.number().int().min(1, "Limit must be at least 1 student").optional().nullable(),
});

// Create a Session
export async function createSession(rawInput: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!dbUser) throw new Error("User not found");
    requireRole(dbUser.role, [Role.TRAINER]);

    const validation = sessionSchema.safeParse(rawInput);
    if (!validation.success) {
      return { error: validation.error.flatten().fieldErrors };
    }

    const input = validation.data;

    // Verify trainer is assigned to this batch
    const isAssigned = await prisma.batchTrainer.findFirst({
      where: {
        batchId: input.batchId,
        trainerId: dbUser.id,
      },
    });

    if (!isAssigned) {
      return { error: { global: ["You are not authorized to create sessions for this batch."] } };
    }

    const session = await prisma.session.create({
      data: {
        batchId: input.batchId,
        trainerId: dbUser.id,
        title: input.title,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        isStrict: !!input.isStrict,
      },
    });

    return { success: true, session };
  } catch (error: any) {
    return { error: { global: [error.message || "Failed to create session."] } };
  }
}

// Create a Batch and automatically link it to the trainer
export async function createBatch(rawInput: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!dbUser || !dbUser.institutionId) {
      return { error: { global: ["Trainer must belong to an institution to create batches."] } };
    }
    requireRole(dbUser.role, [Role.TRAINER]);

    const validation = batchSchema.safeParse(rawInput);
    if (!validation.success) {
      return { error: validation.error.flatten().fieldErrors };
    }

    const { name, maxStudents } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // Generate a unique UUID for the invite token code
      const code = crypto.randomUUID();

      // Create batch under the trainer's institution
      const batch = await tx.batch.create({
        data: {
          name,
          code,
          maxStudents,
          institutionId: dbUser.institutionId!,
        },
      });

      // Link trainer to batch
      await tx.batchTrainer.create({
        data: {
          batchId: batch.id,
          trainerId: dbUser.id,
        },
      });

      return batch;
    });

    return { success: true, batch: result };
  } catch (error: any) {
    return { error: { global: [error.message || "Failed to create batch."] } };
  }
}

