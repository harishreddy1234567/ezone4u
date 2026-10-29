"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Check, AlertCircle, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { STORE_CONFIG, formatINR } from "@/lib/constants";

export interface ProductVariantItem {
  id: string;
  size: string;
  color?: string | null;
  stockQuantity: number;
}

export interface ProductPurchaseData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  category?: { name: string; slug: string } | null;
  variants: ProductVariantItem[];
  primaryImageUrl?: string;
}

interface ProductPurchaseSectionProps {
  product: ProductPurchaseData;
}

export default function ProductPurchaseSection({
  product,
}: ProductPurchaseSectionProps) {
  const { addItem, setIsCartDrawerOpen } = useCart();

  const hasVariants = product.variants && product.variants.length > 0;

  // Extract distinct sizes
  const uniqueSizes = useMemo(() => {
    if (!hasVariants) return [];
    const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
    return sizes;
  }, [hasVariants, product.variants]);

  // Initial selection: first available in-stock variant or null
  const firstAvailableVariant = useMemo(() => {
    if (!hasVariants) return null;
    return product.variants.find((v) => v.stockQuantity > 0) || product.variants[0] || null;
  }, [hasVariants, product.variants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstAvailableVariant?.id || null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Current active variant
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || null;
  }, [hasVariants, product.variants, selectedVariantId]);

  // Max stock available
  const availableStock = useMemo(() => {
    if (hasVariants) {
      return selectedVariant ? selectedVariant.stockQuantity : 0;
    }
    // If no explicit variant items exist in database, default available stock
    return 10;
  }, [hasVariants, selectedVariant]);

  const isOutOfStock = availableStock <= 0;

  // Handle size selection
  function handleSelectSize(size: string) {
    const matchingVariant = product.variants.find(
      (v) => v.size === size && v.stockQuantity > 0
    ) || product.variants.find((v) => v.size === size);

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
      setValidationError(null);
      // Reset quantity if it exceeds new variant's stock
      if (quantity > matchingVariant.stockQuantity && matchingVariant.stockQuantity > 0) {
        setQuantity(1);
      }
    }
  }

  // Handle quantity changes
  function handleDecrement() {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }

  function handleIncrement() {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1);
    }
  }

  // Handle Add to Cart
  function handleAddToCart() {
    if (hasVariants && !selectedVariant) {
      setValidationError("Please select an available size before adding to bag.");
      return;
    }

    if (isOutOfStock) {
      setValidationError("This option is currently out of stock.");
      return;
    }

    setValidationError(null);

    // Call existing CartContext addItem
    addItem(
      {
        id: `${product.id}-${selectedVariant?.id || "default"}`,
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        price: product.price,
        size: selectedVariant?.size,
        color: selectedVariant?.color || undefined,
        imageUrl: product.primaryImageUrl,
      },
      quantity
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
    }, 4000);
  }

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
        <span className="font-serif text-2xl sm:text-3xl font-medium text-[#2D2723]">
          {formatINR(product.price)}
        </span>
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="text-sm sm:text-base text-[#9E958C] line-through font-light">
            {formatINR(product.compareAtPrice)}
          </span>
        )}
        <span className="text-[11px] text-[#786E65] font-light">
          (Inclusive of all taxes)
        </span>
      </div>

      {/* Stock status indicator */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9EBEA] border border-[#E8DFD8] text-[11px] font-medium text-[#874F4C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#874F4C]" />
            Currently Out of Stock
          </span>
        ) : availableStock <= 3 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAEDE5] border border-[#E8DFD8] text-[11px] font-medium text-[#8C5F43]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C5F43] animate-pulse" />
            Only {availableStock} left in stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2EAE2] border border-[#E8DFD8] text-[11px] font-medium text-[#4A634E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A634E]" />
            In Stock & Ready to Dispatch
          </span>
        )}
      </div>

      {/* Size and Variant Selection */}
      {hasVariants && uniqueSizes.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[#ECEAE6]">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#2D2723] font-medium">
              Select Size
            </span>
            {selectedVariant && (
              <span className="text-xs text-[#786E65]">
                Selected: <strong className="text-[#2D2723] font-medium">{selectedVariant.size}</strong>
                {selectedVariant.color ? ` (${selectedVariant.color})` : ""}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {uniqueSizes.map((size) => {
              const variantForSize = product.variants.find((v) => v.size === size);
              const isSizeOutOfStock = (variantForSize?.stockQuantity || 0) <= 0;
              const isSelected = selectedVariant?.size === size;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={isSizeOutOfStock}
                  onClick={() => handleSelectSize(size)}
                  className={`min-w-10 sm:min-w-12 h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl text-xs font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58] ${isSelected
                      ? "bg-[#2D2723] text-[#FAF7F2] shadow-warm-xs border border-[#2D2723]"
                      : isSizeOutOfStock
                        ? "bg-[#F4EFEA] text-[#9E958C] border border-[#E8DFD8] opacity-50 cursor-not-allowed line-through"
                        : "bg-[#FFFDF9] text-[#5C534B] border border-[#E8DFD8] hover:border-[#B88B58] hover:text-[#2D2723]"
                    }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2 pt-2 border-t border-[#ECEAE6]">
        <span className="text-xs uppercase tracking-wider text-[#2D2723] font-medium block">
          Quantity
        </span>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="inline-flex items-center rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs p-1">
            <button
              type="button"
              disabled={quantity <= 1 || isOutOfStock}
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              className="p-2 text-[#5C534B] hover:text-[#2D2723] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-[#F4EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-medium text-xs sm:text-sm text-[#2D2723]">
              {quantity}
            </span>
            <button
              type="button"
              disabled={quantity >= availableStock || isOutOfStock}
              onClick={handleIncrement}
              aria-label="Increase quantity"
              className="p-2 text-[#5C534B] hover:text-[#2D2723] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-[#F4EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs text-[#786E65] font-light">
            Maximum {availableStock > 0 ? availableStock : 0} items per order
          </span>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Success Notification */}
      {isSuccess && (
        <div className="p-4 rounded-xl bg-[#E2EAE2] border border-[#E8DFD8] text-[#4A634E] space-y-2 shadow-warm-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Check className="w-4 h-4 text-[#4A634E]" />
            <span>Added {quantity} × &ldquo;{product.name}&rdquo; to your shopping bag!</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="text-xs font-semibold underline underline-offset-4 hover:text-[#2D2723] transition-colors"
            >
              View Shopping Bag
            </button>
            <span className="text-[#9E958C]">•</span>
            <Link
              href="/shop"
              className="text-xs text-[#4A634E] hover:text-[#2D2723] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Add to Cart Action */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-medium transition-all shadow-warm-md ${isOutOfStock
              ? "bg-[#DDD4CA] text-[#786E65] cursor-not-allowed"
              : "bg-[#2D2723] text-[#FAF7F2] hover:bg-[#3C3530] hover:shadow-warm-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
            }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#E8DFD8]" />
          <span>{isOutOfStock ? "Out of Stock" : "Add to Shopping Bag"}</span>
        </button>
      </div>

      {/* Reassurance & Fixed Shipping Rule Display */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] space-y-3">
        <div className="flex items-start gap-3">
          <Truck className="w-4 h-4 text-[#B88B58] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[#5C534B]">
            <span className="font-medium text-[#2D2723]">Standard Flat Delivery ({formatINR(STORE_CONFIG.SHIPPING_FEE)})</span>:
            {" "}Charged once per order nationwide. Cash on Delivery available across India.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <RefreshCw className="w-4 h-4 text-[#B88B58] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[#5C534B]">
            <span className="font-medium text-[#2D2723]">Easy 7-Day Exchange</span>:
            {" "}Hassle-free size and product exchanges.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-[#B88B58] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[#5C534B]">
            <span className="font-medium text-[#2D2723]">100% Genuine Apparel</span>:
            {" "}Artisanal linens, pure breathable cottons, and curated cuts.
          </div>
        </div>
      </div>
    </div>
  );
}
