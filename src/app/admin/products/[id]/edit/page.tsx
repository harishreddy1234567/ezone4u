import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Edit } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import ProductForm, {
  CategoryOption,
  ProductFormData,
} from "@/components/admin/ProductForm";

interface AdminEditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function AdminEditProductContent({
  params,
}: AdminEditProductPageProps) {
  await requireAdminSession();
  const { id } = await params;

  let product;
  let categories: CategoryOption[] = [];

  try {
    const [dbProduct, dbCategories] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { displayOrder: "asc" } },
          variants: { orderBy: { createdAt: "asc" } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    product = dbProduct;
    categories = dbCategories;
  } catch {
    product = null;
  }

  if (!product) {
    notFound();
  }

  const initialData: ProductFormData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: "",
    categoryId: product.categoryId,
    description: product.description || "",
    price: Number(product.price).toString(),
    compareAtPrice: "",
    isFeatured: false,
    isActive: product.status === "ACTIVE",
    images: product.images.map((img, idx) => ({
      id: img.id,
      url: img.url,
      altText: product.name,
      isPrimary: idx === 0,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color || "",
      stockQuantity: v.stockQuantity,
      sku: "",
    })),
  };

  return (
    <div className="pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Storefront Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Products</span>
          </Link>

          {product.status === "ACTIVE" && (
            <Link
              href={`/shop/${product.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-[#B88B58] hover:underline"
            >
              <span>View on Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
              Edit: {product.name}
            </h1>
            <p className="text-xs text-[#786E65] mt-1 font-light">
              Update pricing, variant inventory levels, photography references, and storefront visibility.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center shadow-warm-xs">
            <Edit className="w-5 h-5" />
          </div>
        </div>

        {/* Edit Form */}
        <ProductForm
          initialData={initialData}
          categories={categories}
          isEditing={true}
        />
      </div>
    </div>
  );
}

export default function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminEditProductContent params={params} />
    </Suspense>
  );
}
