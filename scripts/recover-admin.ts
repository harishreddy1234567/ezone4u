import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hashPassword } from "../src/lib/auth-crypto";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("==================================================================");
    console.log("       EZONE4U SECURE LOCAL ADMINISTRATOR RECOVERY TOOL          ");
    console.log("==================================================================");
    console.log("\nThis tool runs ONLY via local command line and is completely");
    console.log("inaccessible via HTTP, web requests, or deployed API endpoints.\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/recover-admin.ts <email> <new-password>\n");
    console.log("Example:");
    console.log("  npx tsx scripts/recover-admin.ts admin@ezone4u.com MyNewSecurePass@2026\n");
    process.exit(1);
  }

  const [targetEmail, newPassword] = args;

  if (newPassword.length < 8) {
    console.error("❌ Error: New password must be at least 8 characters long.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL is not configured in .env");
    process.exit(1);
  }

  const separator = databaseUrl.includes("?") ? "&" : "?";
  const urlWithParams = databaseUrl.includes("allowPublicKeyRetrieval")
    ? databaseUrl
    : `${databaseUrl}${separator}allowPublicKeyRetrieval=true`;

  const adapter = new PrismaMariaDb(urlWithParams);
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: targetEmail.toLowerCase().trim() },
    });

    if (!admin) {
      console.error(`❌ Error: No administrator found with email: ${targetEmail}`);
      console.log("\nRegistered administrators in database:");
      const allAdmins = await prisma.adminUser.findMany({
        select: { id: true, email: true, name: true, role: true },
      });
      console.table(allAdmins);
      process.exit(1);
    }

    const newHash = hashPassword(newPassword);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    console.log("==================================================================");
    console.log("✅ SUCCESS: Administrator password updated successfully!");
    console.log(`Administrator: ${admin.name} (${admin.email})`);
    console.log("Role:          " + admin.role);
    console.log("==================================================================");
    console.log("You can now sign in at http://localhost:3000/admin/login");
  } catch (error) {
    console.error("❌ Recovery failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
