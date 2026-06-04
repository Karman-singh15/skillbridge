import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import crypto from "crypto";

export async function POST(request: Request) {
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Trainer or Institution
  if (dbUser.role !== Role.TRAINER && dbUser.role !== Role.INSTITUTION) {
    return Response.json(
      { error: "Forbidden: Caller must be a Trainer or Institution" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, maxStudents } = body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "Batch name is required" }, { status: 400 });
  }

  // Resolve institutionId
  let instId: string;
  if (dbUser.role === Role.TRAINER) {
    if (!dbUser.institutionId) {
      return Response.json(
        { error: "Trainer must belong to an institution to create batches" },
        { status: 400 }
      );
    }
    instId = dbUser.institutionId;
  } else {
    instId = dbUser.id; // Institution user's own ID
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generate a unique UUID for the invite token code
      const code = crypto.randomUUID();

      const batch = await tx.batch.create({
        data: {
          name: name.trim(),
          code,
          maxStudents: typeof maxStudents === "number" ? maxStudents : null,
          institutionId: instId,
        },
      });

      // If Trainer, automatically link them to this batch
      if (dbUser.role === Role.TRAINER) {
        await tx.batchTrainer.create({
          data: {
            batchId: batch.id,
            trainerId: dbUser.id,
          },
        });
      }

      return batch;
    });

    return Response.json(result, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to create batch" },
      { status: 500 }
    );
  }
}
