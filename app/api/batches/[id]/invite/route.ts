import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;
  const dbUser = await getCurrentUser(request);
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role validation: Trainer
  if (dbUser.role !== Role.TRAINER) {
    return Response.json(
      { error: "Forbidden: Only Trainers can generate invite links" },
      { status: 403 }
    );
  }

  // Verify Trainer is assigned to this batch
  const isAssigned = await prisma.batchTrainer.findFirst({
    where: {
      batchId,
      trainerId: dbUser.id,
    },
  });
  if (!isAssigned) {
    return Response.json(
      { error: "Forbidden: You are not assigned to this batch" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    body = {}; // Body is optional
  }

  const isOneTime = typeof body.isOneTime === "boolean" ? body.isOneTime : false;
  const code = crypto.randomUUID();

  try {
    const invite = await prisma.invite.create({
      data: {
        batchId,
        code,
        isOneTime,
      },
    });

    const url = new URL(request.url);
    const inviteLink = `${url.origin}/invite/${code}`;

    return Response.json(
      {
        message: "Invite generated successfully",
        token: code,
        inviteLink,
        isOneTime,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to generate invite" },
      { status: 500 }
    );
  }
}
