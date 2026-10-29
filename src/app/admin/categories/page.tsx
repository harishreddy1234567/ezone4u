import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import CategoryManagement, {
  CategoryItem,
} from "@/components/admin/CategoryManagement";

export const metadata = {
  title: "Categories Management | Ezone4u Operations",
  description: "Organize, add, edit, and manage apparel categories and collections.",
};

async function CategoriesContent() {
  await requireAdminSession();

  let categories: CategoryItem[] = [];

  try {
    const rawCategories = await prisma.category.findMany({
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

    categories = rawCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      _count: c._count,
    }));
  } catch {
    categories = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
            Categories &amp; Collections
          </h1>
          <p className="text-xs text-[#786E65] mt-1 font-light">
            Manage your store catalogue taxonomy, category slugs, and organize apparel editions.
          </p>
        </div>
      </div>

      <CategoryManagement initialCategories={categories} />
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#9E958C]">Loading categories directory...</p>
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
