"use client";

import React, { useState } from "react";
import ProductImage from "@/components/ui/ProductImage";

interface ProductImageItem {
  id: string;
  url: string;
  altText?: string | null;
}

interface ProductGalleryProps {
  images: ProductImageItem[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeImage = images[selectedIndex] || images[0];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Primary Large Image */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shadow-warm-xs">
        <ProductImage
          src={activeImage?.url}
          alt={activeImage?.altText || `${productName} - View ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
          className="object-contain object-center transition-all duration-300"
          fallbackText="Ezone4u Atelier Edition"
        />
      </div>

      {/* Thumbnails (shown only if more than 1 image exists) */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`View image ${idx + 1} of ${images.length} for ${productName}`}
                className={`relative w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEA] border transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58] ${isSelected
                    ? "border-[#B88B58] ring-2 ring-[#B88B58]/30 shadow-warm-xs"
                    : "border-[#E8DFD8] opacity-75 hover:opacity-100 hover:border-[#DDD4CA]"
                  }`}
              >
                <ProductImage
                  src={img.url}
                  alt={img.altText || `${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
