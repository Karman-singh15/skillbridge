import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { z } from "zod";

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

export async function POST(request: Request) {
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Trainer
  if (dbUser.role !== Role.TRAINER) {
    return Response.json(
      { error: "Forbidden: Only Trainers can schedule sessions" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = sessionSchema.safeParse(body);
  if (!validation.success) {
    return Response.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = validation.data;

  // Verify Trainer is assigned to this batch
  const isAssigned = await prisma.batchTrainer.findFirst({
    where: {
      batchId: input.batchId,
      trainerId: dbUser.id,
    },
  });
  if (!isAssigned) {
    return Response.json(
      { error: "Forbidden: You are not assigned to this batch" },
      { status: 403 }
    );
  }

  try {
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

    return Response.json(session, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}
