import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const productUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name cannot exceed 200 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug cannot exceed 200 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase alphanumeric characters and hyphens"
    )
    .optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  sku: z.string().trim().max(100).optional().nullable(),
  price: z.number().min(0, "Selling price must be non-negative").optional(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, "Please select a valid category").optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  action: z.enum(["update", "toggle_active", "archive"]).optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string().trim().min(1, "Image URL is required"),
        altText: z.string().trim().max(200).optional().nullable(),
        displayOrder: z.number().int().min(0).default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string().trim().min(1, "Size is required"),
        color: z.string().trim().max(100).optional().nullable(),
        stockQuantity: z
          .number()
          .int()
          .min(0, "Stock quantity must be non-negative")
          .default(0),
        sku: z.string().trim().max(100).optional().nullable(),
      })
    )
    .optional(),
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
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { displayOrder: "asc" },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        sku: null,
        compareAtPrice: null,
        isFeatured: false,
        isActive: product.status === "ACTIVE",
        price: Number(product.price),
        orderCount: product._count.orderItems,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to retrieve product details." },
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
    const parseResult = productUpdateSchema.safeParse(body);

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

    // Fetch existing product
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product record not found." },
        { status: 404 }
      );
    }

    // Quick toggle active / archive action
    if (data.action === "toggle_active" || data.action === "archive") {
      const nextActive =
        data.action === "archive"
          ? "INACTIVE"
          : existing.status === "ACTIVE"
          ? "INACTIVE"
          : "ACTIVE";
      const updated = await prisma.product.update({
        where: { id },
        data: { status: nextActive },
      });

      return NextResponse.json({
        success: true,
        message:
          nextActive === "ACTIVE"
            ? `Product "${updated.name}" is now visible on storefront.`
            : `Product "${updated.name}" archived and hidden from storefront.`,
        isActive: nextActive === "ACTIVE",
      });
    }

    // Validate slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });

      if (slugTaken && slugTaken.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: `The URL slug "${data.slug}" is already in use by another product.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate category existence if provided
    if (data.categoryId) {
      const catExists = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      if (!catExists) {
        return NextResponse.json(
          { success: false, error: "Selected category does not exist." },
          { status: 400 }
        );
      }
    }

    // Atomic transaction for updating product, images, and variants
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic product fields
      const prod = await tx.product.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.slug ? { slug: data.slug } : {}),
          ...(data.description !== undefined
            ? { description: data.description || null }
            : {}),
          ...(data.price !== undefined
            ? { price: data.price.toFixed(2) }
            : {}),
          ...(data.categoryId ? { categoryId: data.categoryId } : {}),
          ...(data.isActive !== undefined
            ? { status: data.isActive ? "ACTIVE" : "INACTIVE" }
            : {}),
        },
      });

      // 2. Reconcile images if provided
      if (data.images) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img, idx) => ({
              productId: id,
              url: img.url,
              displayOrder: img.isPrimary ? 0 : (img.displayOrder ?? idx + 1),
            })),
          });
        }
      }

      // 3. Reconcile variants if provided
      if (data.variants && data.variants.length > 0) {
        // Track existing variant IDs
        const existingVariantIds = new Set(existing.variants.map((v) => v.id));
        const incomingVariantIds = new Set(
          data.variants.map((v) => v.id).filter(Boolean) as string[]
        );

        // Update or create incoming variants
        for (const variant of data.variants) {
          if (variant.id && existingVariantIds.has(variant.id)) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                size: variant.size,
                color: variant.color || "",
                stockQuantity: variant.stockQuantity,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                size: variant.size,
                color: variant.color || "",
                stockQuantity: variant.stockQuantity,
              },
            });
          }
        }

        // For removed variants: check if any are referenced by OrderItems
        for (const existingVar of existing.variants) {
          if (!incomingVariantIds.has(existingVar.id)) {
            const orderCount = await tx.orderItem.count({
              where: { productVariantId: existingVar.id },
            });

            if (orderCount === 0) {
              await tx.productVariant.delete({
                where: { id: existingVar.id },
              });
            } else {
              // Retain variant record for order integrity, but zero its stock
              await tx.productVariant.update({
                where: { id: existingVar.id },
                data: { stockQuantity: 0 },
              });
            }
          }
        }
        // Recalculate total product stock from active variants
        const updatedVariants = await tx.productVariant.findMany({
          where: { productId: id },
          select: { stockQuantity: true },
        });
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
        await tx.product.update({
          where: { id },
          data: { stock: totalStock },
        });
      }

      return prod;
    });

    return NextResponse.json({
      success: true,
      message: `Product "${updated.name}" updated successfully.`,
      product: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update product." },
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
    const existing = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    // Safety constraint: Never cascade-delete historical customer orders or order items
    if (existing._count.orderItems > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Product "${existing.name}" is referenced in ${existing._count.orderItems} past customer order item(s). To preserve order history and fulfillment audit records, this product cannot be hard deleted. Please archive/deactivate it instead to hide it from the customer storefront.`,
          isReferenced: true,
          orderCount: existing._count.orderItems,
        },
        { status: 400 }
      );
    }

    // If zero order items reference this product, safely delete product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Product "${existing.name}" and its associated variants have been safely removed.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
