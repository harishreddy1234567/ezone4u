import "dotenv/config";
import readline from "readline";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hashPassword, verifyPassword } from "../src/lib/auth-crypto";
import { signAdminToken, verifyAdminToken } from "../src/lib/admin-auth";

function getPrisma(): PrismaClient {
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
  return new PrismaClient({ adapter });
}

function askQuestion(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

function updateEnvRegistration(enabled: boolean) {
  const envPath = path.resolve(process.cwd(), ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  const lineRegex = /^ALLOW_ADMIN_REGISTRATION=.*$/m;
  const newLine = `ALLOW_ADMIN_REGISTRATION="${enabled ? "true" : "false"}"`;

  if (lineRegex.test(content)) {
    content = content.replace(lineRegex, newLine);
  } else {
    content = content.trimEnd() + `\nALLOW_ADMIN_REGISTRATION="${enabled ? "true" : "false"}"\n`;
  }

  fs.writeFileSync(envPath, content, "utf-8");
  console.log(`\n🔒 Registration setting updated in .env: ALLOW_ADMIN_REGISTRATION="${enabled ? "true" : "false"}"`);
}

async function runReplacement(fullName: string, email: string, password: string, confirmPassword: string) {
  const nameTrimmed = fullName.trim();
  const emailTrimmed = email.trim().toLowerCase();

  // 1. Validation
  if (nameTrimmed.length < 2) {
    console.error("❌ Error: Full name must be at least 2 characters long.");
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    console.error("❌ Error: Please provide a valid email address.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  if (password !== confirmPassword) {
    console.error("❌ Error: Password and Confirm Password do not match.");
    process.exit(1);
  }

  const prisma = getPrisma();

  try {
    console.log("\n==================================================================");
    console.log("       EZONE4U SECURE LOCAL ADMINISTRATOR REPLACEMENT             ");
    console.log("==================================================================");
    console.log("Connecting to MySQL database...");

    // Step A: Inspect existing administrators
    const existingAdmins = await prisma.adminUser.findMany();
    console.log(`Found ${existingAdmins.length} existing administrator(s) in database:`);
    for (const a of existingAdmins) {
      console.log(`- ID: ${a.id} | Email: ${a.email} | Name: ${a.name} | Role: ${a.role}`);
    }

    // Step B: If an old admin already holds this email, archive their email so the unique constraint does not fail,
    // WITHOUT deleting the old administrator yet!
    const conflicting = await prisma.adminUser.findUnique({
      where: { email: emailTrimmed },
    });

    if (conflicting) {
      const archivedEmail = `archived-${conflicting.id.slice(0, 8)}-${conflicting.email}`;
      console.log(`\nPreserving old account: Archiving email of (${conflicting.id}) to: ${archivedEmail}`);
      await prisma.adminUser.update({
        where: { id: conflicting.id },
        data: { email: archivedEmail },
      });
    }

    // Step C: Securely hash password with scrypt
    const passwordHash = hashPassword(password);

    // Step D: Insert the fresh administrator account into MySQL
    console.log(`\nCreating fresh administrator account for: ${emailTrimmed}...`);
    const newAdmin = await prisma.adminUser.create({
      data: {
        name: nameTrimmed,
        email: emailTrimmed,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log("✅ Fresh administrator record created successfully in MySQL!");
    console.log(`   New Admin ID:    ${newAdmin.id}`);
    console.log(`   New Admin Name:  ${newAdmin.name}`);
    console.log(`   New Admin Email: ${newAdmin.email}`);
    console.log(`   New Admin Role:  ${newAdmin.role}`);

    // Step E: Verification BEFORE removing old administrator
    console.log("\n------------------------------------------------------------------");
    console.log("VERIFYING NEW ADMINISTRATOR CREDENTIALS & ACCESS...");
    console.log("------------------------------------------------------------------");

    const verifyCheck = await prisma.adminUser.findUnique({
      where: { id: newAdmin.id },
    });

    if (!verifyCheck) {
      throw new Error("Verification failed: Could not retrieve newly created administrator!");
    }

    const isPasswordValid = verifyPassword(password, verifyCheck.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Verification failed: Password scrypt hash validation failed!");
    }

    const testToken = signAdminToken({
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
    });

    const decodedSession = verifyAdminToken(testToken);
    if (!decodedSession || decodedSession.id !== newAdmin.id) {
      throw new Error("Verification failed: HMAC-SHA256 session token could not be verified!");
    }

    console.log("✅ Authentication verification PASSED!");
    console.log("✅ Session token generation & decoding PASSED!");
    console.log("✅ Password scrypt constant-time validation PASSED!");

    // Step F: Safely remove old administrator account(s) only after successful verification
    console.log("\n------------------------------------------------------------------");
    console.log("CLEANING UP OLD ADMINISTRATOR ACCOUNT(S)...");
    console.log("------------------------------------------------------------------");

    const oldAdmins = await prisma.adminUser.findMany({
      where: {
        id: { not: newAdmin.id },
      },
    });

    for (const old of oldAdmins) {
      // Check foreign keys in orders table
      const orderCount = await prisma.order.count({
        where: { userId: old.id },
      });

      if (orderCount > 0) {
        console.warn(`⚠️ Note: Old administrator (${old.id}) is referenced by ${orderCount} orders. Preserving record.`);
      } else {
        await prisma.adminUser.delete({
          where: { id: old.id },
        });
        console.log(`✅ Old administrator account (${old.id} / ${old.name}) removed safely from MySQL.`);
      }
    }

    // Step G: Ensure public registration is closed
    updateEnvRegistration(false);

    console.log("\n==================================================================");
    console.log("🎉 SUCCESS: ADMINISTRATOR ACCOUNT REPLACED SUCCESSFULLY!");
    console.log("==================================================================");
    console.log(`You can now sign in at: http://localhost:3000/admin/login`);
    console.log(`Email:    ${newAdmin.email}`);
    console.log(`Password: (the password you just configured)`);
    console.log("Public registration: CLOSED (secure)");
    console.log("==================================================================\n");
  } catch (error) {
    console.error("❌ Error during replacement:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Flag to temporarily open registration page
  if (args[0] === "--open-registration" || args[0] === "--unlock") {
    updateEnvRegistration(true);
    console.log("✅ Administrator registration page is now UNLOCKED.");
    console.log("You can now open http://localhost:3000/admin/register in your browser.");
    console.log("After registering, run: npx tsx scripts/replace-admin.ts --close-registration");
    process.exit(0);
  }

  // Flag to close registration page
  if (args[0] === "--close-registration" || args[0] === "--lock") {
    updateEnvRegistration(false);
    console.log("✅ Administrator registration page is now LOCKED.");
    process.exit(0);
  }

  // CLI Arguments mode: <name> <email> <password> <confirmPassword>
  if (args.length >= 4) {
    const [fullName, email, password, confirmPassword] = args;
    await runReplacement(fullName, email, password, confirmPassword);
    return;
  }

  // If 1-3 arguments provided, show usage help
  if (args.length > 0 && args.length < 4) {
    console.log("==================================================================");
    console.log("       EZONE4U SECURE LOCAL ADMINISTRATOR REPLACEMENT TOOL        ");
    console.log("==================================================================");
    console.log("\nUsage Options:\n");
    console.log("Option 1 (Direct command line):");
    console.log('  npx tsx scripts/replace-admin.ts "<Full Name>" "<email>" "<password>" "<confirmPassword>"\n');
    console.log("Example:");
    console.log('  npx tsx scripts/replace-admin.ts "Darshan M" "admin@ezone4u.com" "MyStrongPass@2026" "MyStrongPass@2026"\n');
    console.log("Option 2 (Interactive terminal prompts):");
    console.log("  npx tsx scripts/replace-admin.ts\n");
    console.log("Option 3 (Temporarily unlock browser page /admin/register):");
    console.log("  npx tsx scripts/replace-admin.ts --open-registration\n");
    console.log("==================================================================");
    process.exit(1);
  }

  // Interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("==================================================================");
  console.log("       EZONE4U SECURE LOCAL ADMINISTRATOR REPLACEMENT TOOL        ");
  console.log("==================================================================");
  console.log("Please enter the credentials for your new administrator account:\n");

  const fullName = await askQuestion(rl, "1. Full Name: ");
  const email = await askQuestion(rl, "2. Email Address: ");
  const password = await askQuestion(rl, "3. Password (min 8 characters): ");
  const confirmPassword = await askQuestion(rl, "4. Confirm Password: ");

  rl.close();

  await runReplacement(fullName, email, password, confirmPassword);
}

main();

