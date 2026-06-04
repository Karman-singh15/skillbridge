import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const pendingInviteCode = cookieStore.get("pending_invite_code")?.value;

  if (!pendingInviteCode) {
    redirect("/dashboard");
  }

  let redirectUrl: string | null = null;

  if (dbUser.role === Role.STUDENT) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find matching invite first
        const invite = await tx.invite.findUnique({
          where: { code: pendingInviteCode },
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
          // Fallback: search Batch directly by code
          batch = await tx.batch.findUnique({
            where: { code: pendingInviteCode },
            include: {
              students: true,
            },
          });
        }

        if (!batch) {
          throw new Error("Invalid invite token.");
        }

        // Check if student is already enrolled in this specific batch
        const alreadyEnrolled = await tx.batchStudent.findFirst({
          where: {
            studentId: dbUser.id,
            batchId: batch.id,
          },
        });

        if (alreadyEnrolled) {
          return { alreadyEnrolled: true, batchName: batch.name };
        }

        // Check capacity limit
        if (batch.maxStudents !== null && batch.students.length >= batch.maxStudents) {
          throw new Error("This batch has reached its maximum student capacity.");
        }

        // Enroll student
        await tx.batchStudent.create({
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

        return { success: true, batchName: batch.name };
      });

      // Clear the cookie inside the Route Handler (fully allowed)
      cookieStore.delete("pending_invite_code");

      if ("alreadyEnrolled" in result) {
        redirectUrl = `/dashboard/student?info=${encodeURIComponent(`You are already enrolled in ${result.batchName}.`)}`;
      } else {
        redirectUrl = `/dashboard/student?joined=${encodeURIComponent(result.batchName)}`;
      }
    } catch (error: any) {
      // Clear cookie on failure too to prevent redirect loops
      cookieStore.delete("pending_invite_code");
      redirectUrl = `/dashboard/student?error=${encodeURIComponent(error.message || "Failed to auto-enroll in batch.")}`;
    }
  } else {
    // User is not a STUDENT (e.g. Trainer or PM) - invite links are only for students
    cookieStore.delete("pending_invite_code");
    
    const roleDashboard = dbUser.role.toLowerCase().replace("_", "-");
    redirectUrl = `/dashboard/${roleDashboard}?error=${encodeURIComponent("Only students can join batches via invite links.")}`;
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
