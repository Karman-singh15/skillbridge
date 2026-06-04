import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Student
  if (dbUser.role !== Role.STUDENT) {
    return Response.json(
      { error: "Forbidden: Only Students can join batches" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token } = body;
  if (!token || typeof token !== "string") {
    return Response.json({ error: "Invite token is required" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the invite token
      const invite = await tx.invite.findUnique({
        where: { code: token },
        include: {
          batch: {
            include: {
              students: true,
            },
          },
        },
      });

      if (!invite) {
        throw new Error("Invalid invite token");
      }

      if (invite.batchId !== batchId) {
        throw new Error("This invite is for a different batch");
      }

      if (invite.isOneTime && invite.isUsed) {
        throw new Error("This invite link has already been used");
      }

      // Check if student is already enrolled in this batch
      const alreadyJoined = await tx.batchStudent.findFirst({
        where: {
          batchId,
          studentId: dbUser.id,
        },
      });
      if (alreadyJoined) {
        throw new Error("You are already enrolled in this batch");
      }

      // Check capacity limit
      const batch = invite.batch;
      if (batch.maxStudents !== null && batch.students.length >= batch.maxStudents) {
        throw new Error("This batch has reached its maximum student capacity");
      }

      // Enroll student in batch
      await tx.batchStudent.create({
        data: {
          batchId,
          studentId: dbUser.id,
        },
      });

      // Mark invite as used if it is a one-time link
      if (invite.isOneTime) {
        await tx.invite.update({
          where: { id: invite.id },
          data: { isUsed: true },
        });
      }

      return { success: true, batchId, batchName: batch.name };
    });

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to join batch" },
      { status: 400 }
    );
  }
}
