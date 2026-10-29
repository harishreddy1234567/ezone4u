import React, { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import ProductImage from "@/components/ui/ProductImage";
import { Sparkles, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import prisma from "@/lib/prisma";
import ShopControls from "@/components/shop/ShopControls";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 24;

async function ShopCatalog({ searchParams }: ShopPageProps) {
  await connection();
  const params = await searchParams;
  const categoryParam = params?.category?.toLowerCase()?.trim() || "";
  const searchParam = (params?.search || params?.q)?.trim() || "";
  const sortParam = params?.sort?.toLowerCase()?.trim() || "featured";
  const currentPage = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  let totalCount = 0;
  let products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    category?: { name: string; slug: string } | null;
    images: Array<{ url: string; altText?: string | null }>;
  }> = [];

  let activeCategoryName: string | null = null;

  type ProductQueryArgs = NonNullable<Parameters<typeof prisma.product.findMany>[0]>;

  try {
    let matchingCategoryIds: string[] | null = null;

    if (categoryParam) {
      // Resolve category and all descendant subcategories dynamically
      const allCategories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true, parentId: true },
      });

      const targetCategory = allCategories.find(
        (c) => c.slug.toLowerCase() === categoryParam
      );

      if (targetCategory) {
        activeCategoryName = targetCategory.name;
        const matchedIds = new Set<string>([targetCategory.id]);

        // Match subcategories whose slug starts with `${categoryParam}-` (e.g. men-shirts)
        for (const c of allCategories) {
          if (c.slug.toLowerCase().startsWith(`${categoryParam}-`)) {
            matchedIds.add(c.id);
          }
        }

        // Recursively resolve all child categories by parentId
        let addedNew = true;
        while (addedNew) {
          addedNew = false;
          for (const c of allCategories) {
            if (c.parentId && matchedIds.has(c.parentId) && !matchedIds.has(c.id)) {
              matchedIds.add(c.id);
              addedNew = true;
            }
          }
        }

        matchingCategoryIds = Array.from(matchedIds);
      } else {
        // Unknown category slug in query -> ensure 0 matching products
        matchingCategoryIds = [];
      }
    }

    const where: NonNullable<ProductQueryArgs["where"]> = {
      status: "ACTIVE",
    };

    if (matchingCategoryIds !== null) {
      where.categoryId = {
        in: matchingCategoryIds,
      };
    }

    if (searchParam) {
      where.OR = [
        { name: { contains: searchParam } },
        { description: { contains: searchParam } },
      ];
    }

    // Determine sort ordering
    let orderBy: ProductQueryArgs["orderBy"];
    switch (sortParam) {
      case "newest":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "price_asc":
        orderBy = [{ price: "asc" }];
        break;
      case "price_desc":
        orderBy = [{ price: "desc" }];
        break;
      case "featured":
      default:
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    const [count, dbProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
        },
      }),
    ]);

    totalCount = count;
    products = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: null,
      category: p.category,
      images: p.images.map((img) => ({
        url: img.url,
        altText: p.name,
      })),
    }));
  } catch {
    // Database empty or connection error fallback
    totalCount = 0;
    products = [];
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function createPageUrl(targetPage: number) {
    const p = new URLSearchParams();
    if (categoryParam) p.set("category", categoryParam);
    if (searchParam) p.set("search", searchParam);
    if (sortParam && sortParam !== "featured") p.set("sort", sortParam);
    if (targetPage > 1) p.set("page", targetPage.toString());
    const query = p.toString();
    return `/shop${query ? `?${query}` : ""}`;
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="border-b border-[#E8DFD8] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
                Explore Our Collection
              </h1>
              <p className="text-sm text-[#786E65] mt-1 font-light">
                Discover contemporary clothing tailored for everyday comfort, effortless elegance, and natural textures.
              </p>
            </div>
            {categoryParam && (
              <span className="self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[11px] uppercase tracking-wider font-medium text-[#B88B58]">
                {categoryParam === "kids"
                  ? "Kids' Edition"
                  : categoryParam === "men"
                    ? "Men's Edition"
                    : categoryParam === "women"
                      ? "Women's Edition"
                      : `${activeCategoryName || categoryParam} Edition`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search, Filters, and Sorting Bar */}
      <ShopControls
        currentCategory={categoryParam}
        currentSearch={searchParam}
        currentSort={sortParam}
        totalCount={totalCount}
      />

      {/* Product Catalog Grid or Friendly Empty State */}
      {products.length > 0 ? (
        <div className="space-y-12">
          {/* Responsive columns: exactly 2 on mobile, 2-3 on tablet, 4 on laptop, up to 5 on large desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-5 lg:gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs hover:shadow-warm-md hover:border-[#DDD4CA] transition-all"
              >
                {/* Product image container with 3:4 proportion */}
                <div className="relative aspect-[3/4] w-full bg-[#F4EFEA] overflow-hidden">
                  <ProductImage
                    src={product.images[0]?.url}
                    alt={product.images[0]?.altText || product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    className="object-contain object-center group-hover:scale-103 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="p-2.5 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between space-y-1.5">
                  <div className="space-y-1">
                    {product.category?.name && (
                      <span className="text-[10px] uppercase tracking-wider text-[#9E958C] font-medium block truncate">
                        {product.category.name}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-medium text-[#2D2723] group-hover:text-[#B88B58] transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-1 flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#2D2723]">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <span className="text-[10px] sm:text-xs text-[#9E958C] line-through font-light">
                          ₹{product.compareAtPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-[#ECEAE6] flex items-center justify-between gap-4">
              <div className="text-xs text-[#786E65]">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={createPageUrl(currentPage - 1)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#2D2723] hover:bg-[#F4EFEA] hover:border-[#B88B58] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#F4EFEA] border border-[#E8DFD8] text-xs font-medium text-[#9E958C] opacity-60 cursor-not-allowed">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </span>
                )}

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => {
                    const isCurrent = pg === currentPage;
                    return (
                      <Link
                        key={pg}
                        href={createPageUrl(pg)}
                        className={`min-w-8 h-8 px-2 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${isCurrent
                            ? "bg-[#2D2723] text-[#FAF7F2]"
                            : "bg-[#FFFDF9] border border-[#E8DFD8] text-[#5C534B] hover:bg-[#F4EFEA]"
                          }`}
                      >
                        {pg}
                      </Link>
                    );
                  })}
                </div>

                {currentPage < totalPages ? (
                  <Link
                    href={createPageUrl(currentPage + 1)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#2D2723] hover:bg-[#F4EFEA] hover:border-[#B88B58] transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#F4EFEA] border border-[#E8DFD8] text-xs font-medium text-[#9E958C] opacity-60 cursor-not-allowed">
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Friendly Empty State */
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-10 sm:p-16 text-center max-w-xl mx-auto space-y-4 shadow-warm-xs">
          <div className="w-12 h-12 rounded-full bg-[#F4EFEA] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl text-[#2D2723] font-normal">
              {searchParam
                ? "No matching pieces found"
                : categoryParam
                  ? "No products found in this category"
                  : "Curated Catalogue Updating"}
            </h2>
            <p className="text-sm text-[#786E65] leading-relaxed">
              {searchParam
                ? `We could not find any items matching "${searchParam}". Try adjusting your keywords or clearing filters.`
                : categoryParam
                  ? `We are currently curating and photographing pieces for this collection. Please check back shortly.`
                  : `Our atelier is cataloguing our latest pieces. Explore our available categories or return home.`}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {(categoryParam || searchParam || sortParam !== "featured") && (
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
              >
                Clear All Filters
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-[#2D2723] text-xs uppercase tracking-wider font-medium hover:bg-[#F4EFEA] transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16 w-full">
      <Suspense
        fallback={
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#F4EFEA] animate-pulse mx-auto" />
            <p className="text-xs text-[#9E958C]">Loading curated collection...</p>
          </div>
        }
      >
        <ShopCatalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
