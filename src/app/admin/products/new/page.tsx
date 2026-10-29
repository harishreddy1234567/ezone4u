import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import ProductForm from "@/components/admin/ProductForm";

async function AdminNewProductContent() {
  await requireAdminSession();

  let categories: Array<{ id: string; name: string; slug: string }> = [];

  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
  } catch {
    categories = [];
  }

  return (
    <div className="pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Products</span>
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
              Create Apparel Product
            </h1>
            <p className="text-xs text-[#786E65] mt-1 font-light">
              Add a new contemporary garment to the Ezone4u luxury collection with custom sizes and pricing.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center shadow-warm-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Product Creation Form */}
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}

export default function AdminNewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminNewProductContent />
    </Suspense>
  );
}
