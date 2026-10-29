import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hashPassword } from "../src/lib/auth-crypto";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not defined in .env");
    process.exit(1);
  }

  const adapter = new PrismaMariaDb(databaseUrl);
  const prisma = new PrismaClient({ adapter });

  const adminEmail = process.env.ADMIN_EMAIL || "admin@ezone4u.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Ezone4uAdmin@2026";
  const adminName = process.env.ADMIN_NAME || "Ezone4u SuperAdmin";

  console.log(`Checking admin existence for: ${adminEmail}`);

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (existing) {
      console.log(`Admin account (${adminEmail}) already exists. No action needed.`);
      await prisma.$disconnect();
      return;
    }

    const passwordHash = hashPassword(adminPassword);

    const created = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log("---------------------------------------------------------");
    console.log("✅ Initial Admin Account Created Successfully!");
    console.log(`ID: ${created.id}`);
    console.log(`Email: ${created.email}`);
    console.log(`Name: ${created.name}`);
    console.log(`Role: ${created.role}`);
    console.log("---------------------------------------------------------");
    console.log("Keep your credentials secure. Public admin registration is disabled.");
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
