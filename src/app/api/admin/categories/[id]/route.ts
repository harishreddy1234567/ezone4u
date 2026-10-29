import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  parentId: z.string().trim().optional().nullable(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve category." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parseResult = updateCategorySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Invalid update data.",
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 404 }
      );
    }

    // Check slug collision if changing slug
    if (data.slug && data.slug !== existing.slug) {
      const collision = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (collision && collision.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: `Slug "${data.slug}" is already taken by another category.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${updated.name}" updated successfully.`,
      category: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 404 }
      );
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Category "${existing.name}" cannot be deleted because it is assigned to ${existing._count.products} product(s). Reassign or remove those products before deleting this category.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${existing.name}" deleted successfully.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete category." },
      { status: 500 }
    );
  }
}

