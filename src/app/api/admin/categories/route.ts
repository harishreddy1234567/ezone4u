import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens (e.g. linen-shirts)"
    ),
  parentId: z.string().trim().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load categories from database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = categorySchema.safeParse(body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || "Invalid category details provided.",
        },
        { status: 400 }
      );
    }

    const { name, slug, parentId } = parseResult.data;

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `The category slug "${slug}" is already in use. Please choose a unique slug.`,
        },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Category "${newCategory.name}" created successfully.`,
        category: newCategory,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create category in database." },
      { status: 500 }
    );
  }
}
