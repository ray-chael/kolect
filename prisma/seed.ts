/**
 * Seed script: creates the initial admin user and sample categories.
 *
 * Usage:  npx tsx prisma/seed.ts
 *
 * Reads ADMIN_PASSWORD from .env (default "P@55word").
 */

import "dotenv/config";
import { prisma } from "../lib/db";
import { auth } from "../lib/auth";

async function main() {
  const email = "abiodunrachael18@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "P@55word";
  const name = "Ade (Admin)";

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Ensure they have admin role
    if (existing.role !== "CRIMSON") {
      await prisma.user.update({
        where: { email },
        data: { role: "CRIMSON" },
      });
      console.log(`✓ Updated ${email} role to CRIMSON (admin)`);
    } else {
      console.log(`✓ Admin user ${email} already exists`);
    }
    return;
  }

  // Create user via Better Auth so password is hashed correctly
  const ctx = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (!ctx?.user) {
    throw new Error("Failed to create admin user via Better Auth");
  }

  // Promote to admin
  await prisma.user.update({
    where: { id: ctx.user.id },
    data: { role: "CRIMSON" },
  });

  console.log(`✓ Admin user created: ${email} (role: CRIMSON)`);
}

async function seedCategories() {
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log(`✓ Categories already seeded (${existing} found)`);
    return;
  }

  const topLevel = [
    { name: "Electronics", slug: "electronics" },
    { name: "Fashion", slug: "fashion" },
    { name: "Home & Living", slug: "home-living" },
  ];

  for (const cat of topLevel) {
    await prisma.category.create({ data: cat });
  }

  const electronics = await prisma.category.findUnique({ where: { slug: "electronics" } });
  const fashion = await prisma.category.findUnique({ where: { slug: "fashion" } });

  if (electronics) {
    await prisma.category.createMany({
      data: [
        { name: "Phones", slug: "phones", parentId: electronics.id },
        { name: "Laptops", slug: "laptops", parentId: electronics.id },
        { name: "Accessories", slug: "accessories", parentId: electronics.id },
      ],
    });
  }

  if (fashion) {
    await prisma.category.createMany({
      data: [
        { name: "Men", slug: "men", parentId: fashion.id },
        { name: "Women", slug: "women", parentId: fashion.id },
      ],
    });
  }

  console.log("✓ Categories seeded");
}

main()
  .then(() => seedCategories())
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
