import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name cannot exceed 200 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug cannot exceed 200 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase alphanumeric characters and hyphens (e.g. linen-summer-shirt)"
    ),
  description: z.string().trim().max(5000).optional().nullable(),
  sku: z.string().trim().max(100).optional().nullable(),
  price: z.number().min(0, "Selling price must be greater than or equal to 0"),
  compareAtPrice: z
    .number()
    .min(0, "Original price must be greater than or equal to 0")
    .optional()
    .nullable(),
  categoryId: z.string().min(1, "Please select a valid category"),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1, "Image URL is required"),
        altText: z.string().trim().max(200).optional().nullable(),
        displayOrder: z.number().int().min(0).default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
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
    .min(1, "Please configure at least one size variant for this product"),
});

export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const categoryId = searchParams.get("categoryId")?.trim();
  const stockStatus = searchParams.get("stockStatus")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));

  try {
    type ProductWhereInput = NonNullable<
      Parameters<typeof prisma.product.findMany>[0]
    >["where"];
    const where: NonNullable<ProductWhereInput> = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    const [totalCount, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
          variants: {
            select: {
              id: true,
              size: true,
              color: true,
              stockQuantity: true,
            },
          },
          _count: {
            select: { orderItems: true },
          },
        },
      }),
    ]);

    let products = rawProducts.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: null,
        price: Number(p.price),
        compareAtPrice: null,
        category: p.category,
        isFeatured: false,
        isActive: p.status === "ACTIVE",
        imageUrl: p.images[0]?.url || null,
        totalStock,
        variantsCount: p.variants.length,
        orderCount: p._count.orderItems,
        createdAt: p.createdAt,
      };
    });

    if (stockStatus === "OUT_OF_STOCK") {
      products = products.filter((p) => p.totalStock === 0);
    } else if (stockStatus === "LOW_STOCK") {
      products = products.filter((p) => p.totalStock > 0 && p.totalStock <= 5);
    } else if (stockStatus === "IN_STOCK") {
      products = products.filter((p) => p.totalStock > 0);
    }

    return NextResponse.json({
      success: true,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      products,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to retrieve products from database." },
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
    const parseResult = productCreateSchema.safeParse(body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || "Invalid product details.",
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          error: `The URL slug "${data.slug}" is already in use by another product. Please choose a unique slug.`,
        },
        { status: 400 }
      );
    }

    // Validate category existence
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });

    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected category does not exist.",
        },
        { status: 400 }
      );
    }

    // Atomic transaction: create product, images, and variants
    const totalStock = data.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          price: data.price.toFixed(2),
          stock: totalStock,
          status: data.isActive ? "ACTIVE" : "INACTIVE",
          categoryId: data.categoryId,
          images: {
            create: data.images.map((img, idx) => ({
              url: img.url,
              displayOrder: img.isPrimary ? 0 : (img.displayOrder ?? idx + 1),
            })),
          },
          variants: {
            create: data.variants.map((v) => ({
              size: v.size,
              color: v.color || "",
              stockQuantity: v.stockQuantity,
            })),
          },
        },
        include: {
          images: true,
          variants: true,
          category: true,
        },
      });

      return product;
    });

    return NextResponse.json({
      success: true,
      message: `Product "${newProduct.name}" created successfully.`,
      product: {
        id: newProduct.id,
        name: newProduct.name,
        slug: newProduct.slug,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product in database.",
      },
      { status: 500 }
    );
  }
}
