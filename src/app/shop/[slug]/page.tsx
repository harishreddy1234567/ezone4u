import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { ChevronRight, ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import ProductImage from "@/components/ui/ProductImage";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductPurchaseSection, {
  ProductPurchaseData,
} from "@/components/shop/ProductPurchaseSection";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        name: true,
        description: true,
        category: { select: { name: true } },
      },
    });

    if (!product) {
      return {
        title: "Product Not Found | Ezone4u",
      };
    }

    return {
      title: `${product.name} | Ezone4u`,
      description:
        product.description?.slice(0, 160) ||
        `Shop contemporary ${product.category?.name || "fashion"} apparel at Ezone4u.`,
    };
  } catch {
    return {
      title: "Product Collection | Ezone4u",
    };
  }
}

async function ProductDetailsContent({ params }: ProductPageProps) {
  await connection();
  const { slug } = await params;

  let product = null;
  let isDbError = false;

  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { displayOrder: "asc" },
        },
        variants: {
          orderBy: { size: "asc" },
        },
      },
    });
  } catch {
    isDbError = true;
  }

  // Graceful database unavailable fallback
  if (isDbError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl text-[#2D2723]">
          Catalogue Temporarily Unavailable
        </h1>
        <p className="text-sm text-[#786E65] max-w-md mx-auto">
          We are unable to load this product at this moment. Please check back shortly or explore our collection.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  // Trigger proper 404 if product not found or inactive
  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const purchaseData: ProductPurchaseData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    compareAtPrice: null,
    category: product.category,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
    })),
    primaryImageUrl: product.images[0]?.url,
  };

  // Fetch up to 4 related products for the 2-column mobile recommendations grid
  let relatedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string }>;
  }> = [];

  try {
    const rawRelated = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      take: 4,
      include: {
        images: {
          orderBy: { displayOrder: "asc" },
          take: 1,
        },
      },
    });

    let pool = rawRelated;
    if (pool.length === 0) {
      pool = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          id: { not: product.id },
        },
        take: 4,
        include: {
          images: {
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
        },
      });
    }

    relatedProducts = pool.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      images: p.images.map((img) => ({ url: img.url })),
    }));
  } catch {
    relatedProducts = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-14 w-full space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#786E65] overflow-x-auto no-scrollbar">
        <Link
          href="/"
          className="hover:text-[#2D2723] transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#9E958C]" />
        <Link
          href="/shop"
          className="hover:text-[#2D2723] transition-colors"
        >
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#9E958C]" />
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-[#2D2723] transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-[#9E958C]" />
        <span className="text-[#2D2723] font-medium truncate max-w-[180px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main 2-Column Product Layout: Gallery (Left) & Information (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Left Column: Image Gallery (6 cols on lg) */}
        <div className="lg:col-span-6 w-full">
          <ProductGallery
            images={product.images}
            productName={product.name}
          />
        </div>

        {/* Right Column: Product Information & Purchase Controls (6 cols on lg) */}
        <div className="lg:col-span-6 w-full space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            {product.category && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-[11px] uppercase tracking-wider text-[#B88B58] font-semibold hover:underline"
              >
                {product.category.name}&apos;s Collection
              </Link>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing, Variants, Quantity, and Add to Cart */}
          <ProductPurchaseSection product={purchaseData} />

          {/* Product Description */}
          {product.description && (
            <div className="pt-6 border-t border-[#ECEAE6] space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723]">
                Design & Fabric Details
              </h2>
              <div className="text-sm text-[#5C534B] leading-relaxed font-light space-y-3 whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Back to Catalog Link */}
          <div className="pt-4 border-t border-[#ECEAE6]">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all collections</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Related Products / Recommendations (Strict 2-Column Mobile Grid) */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 sm:pt-14 border-t border-[#E8DFD8] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#B88B58]">
                Curated Recommendations
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2D2723] font-normal tracking-wide mt-1">
                You May Also Like
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5C534B] hover:text-[#B88B58] transition-colors self-start sm:self-auto"
            >
              <span>Explore All</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {relatedProducts.map((relProduct) => (
              <Link
                key={relProduct.id}
                href={`/shop/${relProduct.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs hover:shadow-warm-md hover:border-[#DDD4CA] transition-all"
              >
                <div className="relative aspect-[3/4] w-full bg-[#F4EFEA] overflow-hidden">
                  <ProductImage
                    src={relProduct.images[0]?.url}
                    alt={relProduct.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain object-center group-hover:scale-103 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5 sm:p-3.5 md:p-4 space-y-1">
                  <h3 className="text-xs sm:text-sm font-medium text-[#2D2723] group-hover:text-[#B88B58] transition-colors truncate">
                    {relProduct.name}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                    <span className="text-[#2D2723]">
                      ₹{relProduct.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ProductDetailsPage({ params }: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full text-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#9E958C]">Loading product details...</p>
        </div>
      }
    >
      <ProductDetailsContent params={params} />
    </Suspense>
  );
}
