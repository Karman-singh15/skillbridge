import "dotenv/config";
import { prisma } from "../lib/prisma";
import { Role } from "../lib/generated/prisma/client";

async function main() {
  console.log("Seeding started...");

  // Seed Institutions
  const inst1 = await prisma.user.upsert({
    where: { email: "delhi.skill@skillbridge.org" },
    update: {},
    create: {
      clerkUserId: "seed_inst_delhi",
      name: "Delhi Skill and Entrepreneurship University",
      email: "delhi.skill@skillbridge.org",
      role: Role.INSTITUTION,
    },
  });

  const inst2 = await prisma.user.upsert({
    where: { email: "mumbai.vocational@skillbridge.org" },
    update: {},
    create: {
      clerkUserId: "seed_inst_mumbai",
      name: "Mumbai Vocational Training Institute",
      email: "mumbai.vocational@skillbridge.org",
      role: Role.INSTITUTION,
    },
  });

  const inst3 = await prisma.user.upsert({
    where: { email: "bangalore.academy@skillbridge.org" },
    update: {},
    create: {
      clerkUserId: "seed_inst_bangalore",
      name: "Bangalore Skill Academy",
      email: "bangalore.academy@skillbridge.org",
      role: Role.INSTITUTION,
    },
  });

  // Seed Monitoring Officer
  await prisma.user.upsert({
    where: { email: "monitoring@skillbridge.gov.in" },
    update: {},
    create: {
      clerkUserId: "seed_monitoring_officer",
      name: "State Monitoring Unit",
      email: "monitoring@skillbridge.gov.in",
      role: Role.MONITORING_OFFICER,
    },
  });

  console.log("Seeding finished successfully!");
  console.log("Seeded Institutions:", [inst1.name, inst2.name, inst3.name]);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // pg adapter/pool handles closing if needed, but Prisma Client handles it automatically
  });
