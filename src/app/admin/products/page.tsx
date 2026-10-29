import React, { Suspense } from "react";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  AlertCircle,
  Package,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import ProductRowActions from "@/components/admin/ProductRowActions";
import { formatINR } from "@/lib/constants";

interface AdminProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stock?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 15;

async function AdminProductsContent({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdminSession();
  const params = await searchParams;

  const searchQuery = params?.q?.trim() || "";
  const categoryFilter = params?.category?.trim() || "ALL";
  const stockFilter = params?.stock?.trim() || "ALL";
  const currentPage = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  let totalCount = 0;
  let activeCount = 0;
  let outOfStockCount = 0;
  let categories: Array<{ id: string; name: string; slug: string }> = [];
  let products: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    price: number;
    compareAtPrice: number | null;
    category: { name: string; slug: string };
    imageUrl: string | null;
    isFeatured: boolean;
    isActive: boolean;
    totalStock: number;
    variantSummary: string;
    orderCount: number;
    createdAt: Date;
  }> = [];

  let dbError: string | null = null;

  try {
    // Fetch categories for filter dropdown
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });

    type ProductQueryArgs = NonNullable<
      Parameters<typeof prisma.product.findMany>[0]
    >;

    const where: NonNullable<ProductQueryArgs["where"]> = {};

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery } },
        { slug: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ];
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      where.category = { slug: categoryFilter };
    }

    const [count, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          category: {
            select: { name: true, slug: true },
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

    totalCount = count;

    products = rawProducts.map((p) => {
      const totalStock = p.variants.reduce(
        (sum, v) => sum + v.stockQuantity,
        0
      );
      const variantSummary = p.variants
        .map((v) => `${v.size}: ${v.stockQuantity}`)
        .join(", ");

      if (p.status === "ACTIVE") activeCount++;
      if (totalStock === 0) outOfStockCount++;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: null,
        price: Number(p.price),
        compareAtPrice: null,
        category: p.category,
        imageUrl: p.images[0]?.url || null,
        isFeatured: false,
        isActive: p.status === "ACTIVE",
        totalStock,
        variantSummary: variantSummary || "No variants configured",
        orderCount: p._count.orderItems,
        createdAt: p.createdAt,
      };
    });

    // Apply stock filter
    if (stockFilter === "IN_STOCK") {
      products = products.filter((p) => p.totalStock > 0);
    } else if (stockFilter === "LOW_STOCK") {
      products = products.filter((p) => p.totalStock > 0 && p.totalStock <= 5);
    } else if (stockFilter === "OUT_OF_STOCK") {
      products = products.filter((p) => p.totalStock === 0);
    }
  } catch {
    dbError =
      "Unable to fetch product catalogue from database. Please verify your MySQL connection.";
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function createPageLink(targetPage: number) {
    const p = new URLSearchParams();
    if (searchQuery) p.set("q", searchQuery);
    if (categoryFilter !== "ALL") p.set("category", categoryFilter);
    if (stockFilter !== "ALL") p.set("stock", stockFilter);
    if (targetPage > 1) p.set("page", targetPage.toString());
    const query = p.toString();
    return `/admin/products${query ? `?${query}` : ""}`;
  }

  return (
    <div className="pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Add Product Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
              Product Catalogue
            </h1>
            <p className="text-xs text-[#786E65] mt-1">
              Add new apparel collections, manage variants, adjust stock levels, and control storefront availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#2D2723] shadow-warm-xs">
              Total: <strong className="font-semibold text-[#B88B58]">{totalCount}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#4A6B53] shadow-warm-xs">
              Published: <strong className="font-semibold">{activeCount}</strong>
            </span>
            {outOfStockCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-[#FAF0F0] border border-[#F0D5D5] text-xs font-medium text-[#874F4C] shadow-warm-xs">
                Out of Stock: <strong className="font-semibold">{outOfStockCount}</strong>
              </span>
            )}
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors shadow-warm-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Link>
          </div>
        </div>

        {/* Database Warning Banner */}
        {dbError && (
          <div className="p-4 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] flex items-start gap-3 text-xs text-[#874F4C]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{dbError}</p>
              <p className="font-light text-[#5C534B]">
                Ensure your MySQL service is active and the database connection is reachable.
              </p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-4 sm:p-5 shadow-warm-xs space-y-4">
          <form method="GET" action="/admin/products" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
            {/* Search Input (6 cols on md, 2 on sm) */}
            <div className="sm:col-span-2 md:col-span-6 relative">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by Product Name, Slug, or SKU..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
              <Search className="w-4 h-4 text-[#786E65] absolute left-3.5 top-2.5" />
            </div>

            {/* Category Filter Dropdown (3 cols on md, 1 on sm) */}
            <div className="sm:col-span-1 md:col-span-3">
              <select
                name="category"
                defaultValue={categoryFilter}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Dropdown (2 cols on md, 1 on sm) */}
            <div className="sm:col-span-1 md:col-span-2">
              <select
                name="stock"
                defaultValue={stockFilter}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              >
                <option value="ALL">All Stock</option>
                <option value="IN_STOCK">In Stock (&gt;0)</option>
                <option value="LOW_STOCK">Low Stock (1–5)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>
            </div>

            {/* Submit Button (1 col on md, 2 on sm) */}
            <div className="sm:col-span-2 md:col-span-1 flex items-center gap-1.5">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors shadow-warm-xs"
              >
                Filter
              </button>
            </div>
          </form>

          {/* Active Filter Chips */}
          {(searchQuery || categoryFilter !== "ALL" || stockFilter !== "ALL") && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#ECEAE6] text-xs text-[#786E65]">
              <Filter className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Filters active.</span>
              <Link
                href="/admin/products"
                className="text-xs text-[#B88B58] hover:underline ml-1"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </div>

        {/* Products Table Card */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 sm:p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#2D2723]">
                No products found in catalogue.
              </p>
              <p className="text-xs text-[#786E65]">
                {searchQuery || categoryFilter !== "ALL" || stockFilter !== "ALL"
                  ? "Try resetting your search or filter options."
                  : "Click 'Add New Product' above to create your first apparel piece."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ECEAE6] bg-[#FAF7F2] text-[#786E65] uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Product</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Price</th>
                    <th className="py-3.5 px-4">Inventory</th>
                    <th className="py-3.5 px-4">Visibility</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE6]">
                  {products.map((product) => {
                    const isOutOfStock = product.totalStock === 0;
                    const isLowStock = product.totalStock > 0 && product.totalStock <= 5;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-[#FAF7F2]/60 transition-colors"
                      >
                        {/* Product Thumbnail & Title */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shrink-0">
                              <ProductImage
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover object-center"
                                fallbackText=""
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="font-medium text-[#2D2723] hover:text-[#B88B58] transition-colors line-clamp-1 text-xs sm:text-sm"
                              >
                                {product.name}
                              </Link>
                              <div className="flex items-center gap-2 text-[10px] text-[#786E65] mt-0.5">
                                <span className="font-mono text-[#9E958C]">
                                  /{product.slug}
                                </span>
                                {product.sku && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#E8DFD8]">
                                      SKU: {product.sku}
                                    </span>
                                  </>
                                )}
                                {product.isFeatured && (
                                  <span className="text-[#B88B58] font-semibold">
                                    ★ Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF7F2] border border-[#E8DFD8] text-[#5C534B]">
                            {product.category?.name || "Uncategorized"}
                          </span>
                        </td>

                        {/* Price & Original Price */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <span className="font-semibold text-[#2D2723] text-xs sm:text-sm block">
                            {formatINR(product.price)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-[10px] text-[#9E958C] line-through block">
                              {formatINR(product.compareAtPrice)}
                            </span>
                          )}
                        </td>

                        {/* Inventory & Variants */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isOutOfStock
                                  ? "text-[#874F4C]"
                                  : isLowStock
                                  ? "text-[#B88B58]"
                                  : "text-[#4A6B53]"
                              }`}
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>{product.totalStock} in stock</span>
                            </span>
                            <span className="block text-[10px] text-[#786E65] truncate max-w-[180px]" title={product.variantSummary}>
                              {product.variantSummary}
                            </span>
                          </div>
                        </td>

                        {/* Active / Inactive Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {product.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F2F7F2] border border-[#D6E6D7] text-[#4A6B53]">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] border border-[#E8DFD8] text-[#786E65]">
                              Archived (Hidden)
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                          <ProductRowActions
                            productId={product.id}
                            productName={product.name}
                            isActive={product.isActive}
                            orderCount={product.orderCount}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 sm:px-6 border-t border-[#ECEAE6] flex items-center justify-between text-xs text-[#786E65]">
              <span>
                Page {currentPage} of {totalPages} ({totalCount} total products)
              </span>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={createPageLink(currentPage - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#2D2723] hover:bg-[#F4EFEA] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#9E958C] cursor-not-allowed opacity-50">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={createPageLink(currentPage + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#2D2723] hover:bg-[#F4EFEA] transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#9E958C] cursor-not-allowed opacity-50">
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminProductsContent searchParams={searchParams} />
    </Suspense>
  );
}
