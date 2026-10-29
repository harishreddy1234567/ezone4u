import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hashPassword } from "../src/lib/auth-crypto";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL is required in .env");
    process.exit(1);
  }

  const adapter = new PrismaMariaDb(databaseUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Seeding initial store setup in ezone4u_store...");

    // 1. Seed Admin Accounts
    const admins = [
      {
        email: "admin@ezone4u.com",
        name: "Ezone4u Administrator",
        password: "Ezone4uAdmin@2026",
      },
      {
        email: "info@ezone4u.com",
        name: "Ezone4u Store Admin",
        password: "Ezone4uAdmin@2026",
      },
    ];

    for (const a of admins) {
      const existing = await prisma.adminUser.findUnique({ where: { email: a.email } });
      if (!existing) {
        const passwordHash = hashPassword(a.password);
        await prisma.adminUser.create({
          data: {
            email: a.email,
            name: a.name,
            passwordHash,
            role: "ADMIN",
          },
        });
        console.log(`✅ Admin account created: ${a.email}`);
      } else {
        console.log(`ℹ️ Admin account already exists: ${a.email}`);
      }
    }

    // 2. Seed Core Categories
    const categories = [
      { name: "Men", slug: "men" },
      { name: "Women", slug: "women" },
      { name: "Kids", slug: "kids" },
      { name: "Casual Wear", slug: "casual-wear" },
      { name: "Formal Wear", slug: "formal-wear" },
      { name: "Ethnic Wear", slug: "ethnic-wear" },
      { name: "Accessories", slug: "accessories" },
    ];

    for (const cat of categories) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
          },
        });
        console.log(`✅ Category created: ${cat.name} (${cat.slug})`);
      } else {
        console.log(`ℹ️ Category already exists: ${cat.name}`);
      }
    }

    console.log("🎉 Initial setup complete for ezone4u_store!");
  } catch (err) {
    console.error("Error during store seeding:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

