"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Sparkles } from "lucide-react";

interface ProductImageProps extends Omit<ImageProps, "src" | "onError"> {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  containerClassName?: string;
}

export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export default function ProductImage({
  src,
  alt,
  fallbackText = "Ezone4u Edition",
  className = "",
  containerClassName = "",
  ...props
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedSrc = normalizeImageUrl(src);

  if (!normalizedSrc || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-[#F4EFEA] text-[#9E958C] p-4 text-center select-none ${containerClassName}`}
      >
        <Sparkles className="w-5 h-5 text-[#B88B58] opacity-50 mb-1" />
        <span className="text-[11px] font-medium tracking-wider uppercase text-[#786E65]">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
