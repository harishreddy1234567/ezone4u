import React, { Suspense } from "react";
import Image from "next/image";
import ProductImage from "@/components/ui/ProductImage";
import Link from "next/link";
import { ArrowRight, Truck, Sparkles, ShieldCheck, MapPin } from "lucide-react";
import { connection } from "next/server";
import prisma from "@/lib/prisma";

async function FeaturedProductsSection() {
  await connection();
  let featuredProducts: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images: Array<{ url: string; altText?: string | null }>;
  }> = [];

  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 8,
      include: {
        images: {
          orderBy: { displayOrder: "asc" },
          take: 1,
        },
      },
    });

    featuredProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: null,
      images: p.images.map((img) => ({
        url: img.url,
        altText: p.name,
      })),
    }));
  } catch {
    featuredProducts = [];
  }

  if (featuredProducts.length === 0) {
    return (
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-warm-xs">
        <div className="w-12 h-12 rounded-full bg-[#F4EFEA] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif text-xl sm:text-2xl text-[#2D2723] font-normal">
            New Season Launching Shortly
          </h3>
          <p className="text-sm text-[#786E65] max-w-md mx-auto leading-relaxed">
            Our new seasonal collection is arriving shortly. Browse our curated
            categories above or explore our wardrobe editions.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/shop?category=men"
            className="px-4 py-2 rounded-lg bg-[#FAF7F2] text-[#5C534B] hover:text-[#2D2723] hover:bg-[#F4EFEA] border border-[#E8DFD8] text-xs font-medium tracking-wide transition-colors"
          >
            Men
          </Link>
          <Link
            href="/shop?category=women"
            className="px-4 py-2 rounded-lg bg-[#FAF7F2] text-[#5C534B] hover:text-[#2D2723] hover:bg-[#F4EFEA] border border-[#E8DFD8] text-xs font-medium tracking-wide transition-colors"
          >
            Women
          </Link>
          <Link
            href="/shop?category=kids"
            className="px-4 py-2 rounded-lg bg-[#FAF7F2] text-[#5C534B] hover:text-[#2D2723] hover:bg-[#F4EFEA] border border-[#E8DFD8] text-xs font-medium tracking-wide transition-colors"
          >
            Kids
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-grid-two-column">
      {featuredProducts.map((product) => (
        <Link
          key={product.id}
          href={`/shop/${product.slug}`}
          className="group flex flex-col rounded-xl overflow-hidden bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs hover:shadow-warm-md transition-all"
        >
          <div className="relative aspect-[3/4] w-full bg-[#F4EFEA] overflow-hidden">
            <ProductImage
              src={product.images[0]?.url}
              alt={product.images[0]?.altText || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain object-center group-hover:scale-103 transition-transform duration-300"
            />
          </div>
          <div className="p-2.5 sm:p-3.5 md:p-4 space-y-1">
            <h3 className="text-xs sm:text-sm font-medium text-[#2D2723] group-hover:text-[#B88B58] transition-colors truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
              <span className="text-[#2D2723]">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-[#9E958C] line-through">
                  ₹{product.compareAtPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-8 text-center max-w-2xl mx-auto space-y-3 shadow-warm-xs">
      <div className="w-8 h-8 rounded-full bg-[#F4EFEA] animate-pulse mx-auto" />
      <p className="text-xs text-[#9E958C]">Loading curated collection...</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] text-[#2D2723] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[75vh] md:min-h-[82vh] flex items-center justify-start overflow-hidden bg-[#FAF7F2]">
        {/* Editorial Fashion Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/ezone4u-fashion-hero.jpg"
            alt="Ezone4u Contemporary Fashion Campaign in Warm Pastels and Linens"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%] md:object-[center_15%]"
          />
          {/* Subtle warm luxury gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/90 via-[#FAF7F2]/60 to-transparent md:w-3/5 lg:w-1/2" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2]/90 border border-[#E8DFD8] backdrop-blur-xs text-[11px] sm:text-xs font-medium tracking-wider uppercase text-[#786E65]">
              <Sparkles className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Contemporary Atelier 2026</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#2D2723] font-normal tracking-tight leading-[1.15]">
              Style That Feels <br className="hidden sm:inline" />
              <span className="italic text-[#5C534B]">Like You</span>
            </h1>

            <p className="text-base sm:text-lg text-[#5C534B] leading-relaxed max-w-md font-light">
              Discover contemporary clothing designed for everyday comfort,
              effortless style, and timeless appeal. Crafted in tranquil pastels
              and natural textures.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] hover:bg-[#3C3530] text-xs sm:text-sm font-medium tracking-wider uppercase shadow-warm-md hover:shadow-warm-lg transition-all"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 text-[#E8DFD8]" />
              </Link>

              <Link
                href="/shop?category=women"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#FFFDF9]/95 text-[#2D2723] hover:bg-[#F4EFEA] border border-[#E8DFD8] text-xs sm:text-sm font-medium tracking-wider uppercase shadow-warm-xs transition-colors backdrop-blur-xs"
              >
                Shop Women
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY — MEN, WOMEN, KIDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#B88B58]">
            Curated Categories
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
            Explore Our Collections
          </h2>
          <p className="text-sm sm:text-base text-[#786E65]">
            Find your style, your comfort, your everyday essentials.
          </p>
        </div>

        {/* Exactly 3 Primary Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Card 1: Men */}
          <Link
            href="/shop?category=men"
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs hover:shadow-warm-lg transition-all duration-300"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4EFEA]">
              <Image
                src="/images/men-collection.jpg"
                alt="Ezone4u Men's Contemporary Fashion Collection"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D2723]/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-[#FAF7F2] space-y-1.5">
                <span className="text-[10px] tracking-[0.2em] uppercase font-light text-[#E8DFD8]">
                  Curated Wardrobe
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide">
                  Men
                </h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-[#FFFDF9] border-t border-[#ECEAE6]">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5C534B] group-hover:text-[#B88B58] transition-colors">
                Explore Men
              </span>
              <ArrowRight className="w-4 h-4 text-[#B88B58] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Women */}
          <Link
            href="/shop?category=women"
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs hover:shadow-warm-lg transition-all duration-300"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4EFEA]">
              <Image
                src="/images/women-collection.jpg"
                alt="Ezone4u Women's Contemporary Fashion Collection"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D2723]/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-[#FAF7F2] space-y-1.5">
                <span className="text-[10px] tracking-[0.2em] uppercase font-light text-[#E8DFD8]">
                  Serene Silhouettes
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide">
                  Women
                </h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-[#FFFDF9] border-t border-[#ECEAE6]">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5C534B] group-hover:text-[#B88B58] transition-colors">
                Explore Women
              </span>
              <ArrowRight className="w-4 h-4 text-[#B88B58] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Kids */}
          <Link
            href="/shop?category=kids"
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs hover:shadow-warm-lg transition-all duration-300"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4EFEA]">
              <Image
                src="/images/kids-collection.jpg"
                alt="Ezone4u Kids' Contemporary Fashion Collection"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D2723]/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-[#FAF7F2] space-y-1.5">
                <span className="text-[10px] tracking-[0.2em] uppercase font-light text-[#E8DFD8]">
                  Gentle Everyday Fits
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide">
                  Kids
                </h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-[#FFFDF9] border-t border-[#ECEAE6]">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5C534B] group-hover:text-[#B88B58] transition-colors">
                Explore Kids
              </span>
              <ArrowRight className="w-4 h-4 text-[#B88B58] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (Curated for Everyday) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-[#E8DFD8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#B88B58]">
              New Arrivals
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
              Curated for Everyday
            </h2>
            <p className="text-sm text-[#786E65]">
              Discover thoughtfully selected styles for every part of your day.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#5C534B] hover:text-[#B88B58] transition-colors self-start sm:self-auto"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Streaming suspense boundary */}
        <Suspense fallback={<ProductsLoadingSkeleton />}>
          <FeaturedProductsSection />
        </Suspense>
      </section>

      {/* 4. BRAND STORY SECTION */}
      <section className="bg-[#F4EFEA] border-y border-[#E8DFD8] py-16 sm:py-20 my-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.25em] font-medium text-[#B88B58]">
            The Ezone4u Philosophy
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
            Everyday Style, Thoughtfully Chosen
          </h2>
          <p className="text-base sm:text-lg text-[#5C534B] leading-relaxed font-light max-w-2xl mx-auto">
            At Ezone4u, we believe getting dressed should feel effortless.
            Explore contemporary styles that bring together comfort, versatility,
            and a refined everyday look.
          </p>
          <div className="pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FFFDF9] text-[#2D2723] hover:bg-[#FAF7F2] border border-[#E8DFD8] text-xs uppercase tracking-wider font-medium shadow-warm-xs hover:shadow-warm-sm transition-all"
            >
              <span>Discover Our Story</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B88B58]" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. SHOPPING BENEFITS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs">
            <div className="p-2.5 rounded-xl bg-[#F4EFEA] text-[#B88B58] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-[#2D2723]">
                Cash on Delivery
              </h3>
              <p className="text-xs text-[#786E65] leading-relaxed">
                Pay comfortably at your doorstep across India.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs">
            <div className="p-2.5 rounded-xl bg-[#F4EFEA] text-[#B88B58] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-[#2D2723]">
                Everyday Comfort
              </h3>
              <p className="text-xs text-[#786E65] leading-relaxed">
                Lightweight linens, breathable cottons, and relaxed fits.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs">
            <div className="p-2.5 rounded-xl bg-[#F4EFEA] text-[#B88B58] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-[#2D2723]">
                Carefully Selected Styles
              </h3>
              <p className="text-xs text-[#786E65] leading-relaxed">
                Thoughtful contemporary designs tailored for modern living.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs">
            <div className="p-2.5 rounded-xl bg-[#F4EFEA] text-[#B88B58] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-[#2D2723]">
                Nationwide Delivery
              </h3>
              <p className="text-xs text-[#786E65] leading-relaxed">
                Reliable delivery across all serviceable pincodes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
