"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { z } from "zod";

const onboardingSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(Role.STUDENT),
    name: z.string().min(2, "Name must be at least 2 characters"),
  }),
  z.object({
    role: z.literal(Role.TRAINER),
    name: z.string().min(2, "Name must be at least 2 characters"),
    institutionId: z.string().min(1, "Please select an institution"),
  }),
  z.object({
    role: z.literal(Role.INSTITUTION),
    name: z.string().min(2, "Institution name must be at least 2 characters"),
  }),
  z.object({
    role: z.literal(Role.PROGRAMME_MANAGER),
    name: z.string().min(2, "Name must be at least 2 characters"),
    region: z.string().min(2, "Region must be at least 2 characters"),
  }),
  z.object({
    role: z.literal(Role.MONITORING_OFFICER),
    name: z.string().min(2, "Name must be at least 2 characters"),
  }),
]);

export async function submitOnboarding(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found in Clerk");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User email not found in Clerk");
  }

  const validation = onboardingSchema.safeParse(rawInput);
  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const input = validation.data;

  try {
    // Start transaction to create/update user
    await prisma.$transaction(async (tx) => {
      let institutionId: string | null = null;

      if (input.role === Role.TRAINER) {
        institutionId = input.institutionId;
      }

      // Check if user with this email already exists (e.g. seeded or previous manual DB entries)
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            clerkUserId: userId,
            name: input.name,
            role: input.role,
            institutionId: input.role === Role.INSTITUTION ? existingUser.id : institutionId,
          },
        });
      } else {
        const user = await tx.user.create({
          data: {
            clerkUserId: userId,
            name: input.name,
            email: email,
            role: input.role,
            institutionId: institutionId,
          },
        });

        // Special case: For Institution role, set their own user ID as their institutionId
        if (input.role === Role.INSTITUTION) {
          await tx.user.update({
            where: { id: user.id },
            data: { institutionId: user.id },
          });
        }
      }
    });

    // Update Clerk Metadata to mark user as onboarded
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboarded: true,
        role: input.role,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Onboarding transaction error:", error);
    return { error: { global: [error.message || "Failed to onboard user. Email may already be registered."] } };
  }
}
