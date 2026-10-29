"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { STORE_CONFIG, calculateOrderTotals, formatINR } from "@/lib/constants";

export default function CartPage() {
  const { items, cartCount, subtotal, removeItem, updateQuantity } = useCart();

  const { shippingFee, total } = calculateOrderTotals(subtotal);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16 w-full space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="space-y-3">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#E8DFD8] pb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
              Your Shopping Bag
            </h1>
            <p className="text-sm text-[#786E65] mt-1 font-light">
              Review your curated items before proceeding to checkout.
            </p>
          </div>
          {items.length > 0 && (
            <span className="text-xs uppercase tracking-wider text-[#B88B58] font-medium">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cart Items List (Left Column, 8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="divide-y divide-[#ECEAE6] rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-3.5 sm:p-6 shadow-warm-xs">
              {items.map((item) => {
                const itemSubtotal = item.price * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="py-4 sm:py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Image & Product Details */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="relative w-18 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-contain object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#9E958C]">
                            <Sparkles className="w-4 h-4 text-[#B88B58] opacity-60 mb-1" />
                            <span className="text-[9px] uppercase tracking-wider">
                              Ezone4u
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h2 className="text-xs sm:text-base font-medium text-[#2D2723] hover:text-[#B88B58] transition-colors leading-snug">
                          {item.name}
                        </h2>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#786E65]">
                          {item.size && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD8] text-[10px] sm:text-[11px] font-medium text-[#5C534B]">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD8] text-[10px] sm:text-[11px] font-medium text-[#5C534B]">
                              Color: {item.color}
                            </span>
                          )}
                        </div>

                        <div className="pt-1 flex items-baseline gap-1.5">
                          <span className="text-[11px] sm:text-xs text-[#786E65]">Unit Price:</span>
                          <span className="text-xs sm:text-sm font-semibold text-[#2D2723]">
                            {formatINR(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls, Item Subtotal & Remove */}
                    <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#ECEAE6]">
                      {/* Quantity Controls */}
                      <div className="inline-flex items-center rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] shadow-warm-xs p-1">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="p-1.5 text-[#5C534B] hover:text-[#2D2723] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-[#F4EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-[#2D2723]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="p-1.5 text-[#5C534B] hover:text-[#2D2723] rounded-lg hover:bg-[#F4EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-[#9E958C] block">
                            Subtotal
                          </span>
                          <span className="text-sm font-semibold text-[#2D2723]">
                            {formatINR(itemSubtotal)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from bag`}
                          className="p-2 text-[#9E958C] hover:text-[#874F4C] hover:bg-[#F9EBEA] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shopping Continuation Link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#786E65] hover:text-[#2D2723] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Add more pieces from our collection</span>
              </Link>
            </div>
          </div>

          {/* Order Summary (Right Column, 4 cols on lg, sticky) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs space-y-5">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-[#5C534B]">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                  <span className="font-medium text-[#2D2723]">{formatINR(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-[#5C534B]">
                  <div className="flex items-center gap-1.5">
                    <span>Standard Shipping</span>
                  </div>
                  <span className="font-medium text-[#2D2723]">{formatINR(shippingFee)}</span>
                </div>

                <div className="text-[11px] text-[#786E65] font-light leading-relaxed bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFD8]">
                  Fixed standard flat delivery rate of {formatINR(STORE_CONFIG.SHIPPING_FEE)} charged once per order nationwide.
                </div>

                <div className="pt-3 border-t border-[#ECEAE6] flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[#2D2723]">Estimated Total</span>
                  <div className="text-right">
                    <span className="font-serif text-2xl font-semibold text-[#2D2723]">
                      {formatINR(total)}
                    </span>
                    <span className="text-[10px] text-[#9E958C] block">
                      Inclusive of all taxes
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Action Button */}
              <Link
                href="/checkout"
                className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] hover:shadow-warm-lg active:scale-[0.99] transition-all shadow-warm-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#E8DFD8]" />
              </Link>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-[#ECEAE6] space-y-2.5 text-xs text-[#786E65]">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-[#B88B58] shrink-0" />
                  <span>Cash on Delivery Available Nationwide</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-[#B88B58] shrink-0" />
                  <span>7-Day Easy Size & Product Exchange</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B88B58] shrink-0" />
                  <span>100% Genuine Contemporary Apparel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Shopping Bag State */
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-12 sm:p-20 text-center max-w-xl mx-auto space-y-5 shadow-warm-xs">
          <div className="w-16 h-16 rounded-full bg-[#F4EFEA] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#B88B58] font-medium">
              Bag Empty
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2D2723] font-normal">
              Your Shopping Bag is Empty
            </h2>
            <p className="text-sm text-[#786E65] leading-relaxed max-w-md mx-auto">
              You haven&apos;t added any contemporary apparel pieces yet. Explore our curated categories for Men, Women, and Kids.
            </p>
          </div>

          <div className="pt-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] hover:shadow-warm-md transition-all shadow-warm-xs"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 text-[#E8DFD8]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
