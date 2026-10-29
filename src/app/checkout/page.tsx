"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Sparkles,
  Lock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { STORE_CONFIG, calculateOrderTotals, formatINR } from "@/lib/constants";

interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartCount, subtotal, clearCart } = useCart();
  const { shippingFee, total } = calculateOrderTotals(subtotal);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof CheckoutFormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      errors.customerName = "Please enter your full name (at least 2 characters).";
    }

    const cleanPhone = formData.customerPhone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.customerPhone = "Please enter a valid 10-digit Indian mobile number.";
    }

    if (formData.customerEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) {
        errors.customerEmail = "Please enter a valid email address.";
      }
    }

    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 5) {
      errors.addressLine1 = "Please enter complete flat/house number and street address.";
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = "Please enter your city/town.";
    }

    if (!formData.state.trim() || formData.state.trim().length < 2) {
      errors.state = "Please enter your state.";
    }

    const cleanPin = formData.postalCode.trim().replace(/\D/g, "");
    if (!/^\d{6}$/.test(cleanPin)) {
      errors.postalCode = "Please enter a valid 6-digit PIN code.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError("Your shopping bag is empty. Please add items before placing an order.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim().replace(/\D/g, ""),
        customerEmail: formData.customerEmail.trim() || undefined,
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim().replace(/\D/g, ""),
        country: "India",
        notes: formData.notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          size: item.size || undefined,
          color: item.color || undefined,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setSubmitError(result.error || "Unable to place order. Please verify your details.");
        setIsSubmitting(false);
        return;
      }

      // Order created successfully: clear cart and redirect to confirmation
      clearCart();
      router.push(`/order-confirmation/${result.orderNumber}`);
    } catch {
      setSubmitError("A network error occurred. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#F4EFEA] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-[#2D2723]">Your Bag is Empty</h1>
          <p className="text-sm text-[#786E65]">
            You have no items in your cart to checkout. Browse our collection to add apparel pieces.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
          >
            <span>Explore Collection</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16 w-full space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Shopping Bag</span>
        </Link>
        <div className="border-b border-[#E8DFD8] pb-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
              Guest Checkout
            </h1>
            <p className="text-sm text-[#786E65] mt-1 font-light">
              No account required. Enter your delivery address to place your Cash on Delivery order.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#786E65] bg-[#FAF7F2] px-3 py-1.5 rounded-full border border-[#E8DFD8]">
            <Lock className="w-3.5 h-3.5 text-[#B88B58]" />
            <span>Secure Guest Order</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Delivery Form (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Contact Information */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-4 sm:p-7 shadow-warm-xs space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2D2723] border-b border-[#ECEAE6] pb-3">
                1. Contact Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-xs font-medium text-[#2D2723] mb-1">
                    Full Name <span className="text-[#874F4C]">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Priyanshu Sharma"
                    className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.customerName ? "border-[#874F4C]" : "border-[#E8DFD8]"
                      }`}
                  />
                  {fieldErrors.customerName && (
                    <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.customerName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customerPhone" className="block text-xs font-medium text-[#2D2723] mb-1">
                      Mobile Number <span className="text-[#874F4C]">*</span>
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      maxLength={10}
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.customerPhone ? "border-[#874F4C]" : "border-[#E8DFD8]"
                        }`}
                    />
                    {fieldErrors.customerPhone && (
                      <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.customerPhone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="customerEmail" className="block text-xs font-medium text-[#2D2723] mb-1">
                      Email Address <span className="text-[#9E958C] text-[11px]">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="order updates & receipt"
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.customerEmail ? "border-[#874F4C]" : "border-[#E8DFD8]"
                        }`}
                    />
                    {fieldErrors.customerEmail && (
                      <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.customerEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-7 shadow-warm-xs space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2D2723] border-b border-[#ECEAE6] pb-3">
                2. Delivery Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="addressLine1" className="block text-xs font-medium text-[#2D2723] mb-1">
                    House / Flat No., Street, Building <span className="text-[#874F4C]">*</span>
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="e.g. Flat 302, Green Meadows, 5th Cross Road"
                    className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.addressLine1 ? "border-[#874F4C]" : "border-[#E8DFD8]"
                      }`}
                  />
                  {fieldErrors.addressLine1 && (
                    <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.addressLine1}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="addressLine2" className="block text-xs font-medium text-[#2D2723] mb-1">
                    Landmark / Colony <span className="text-[#9E958C] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="e.g. Near HDFC Bank"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-medium text-[#2D2723] mb-1">
                      City <span className="text-[#874F4C]">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Bangalore"
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.city ? "border-[#874F4C]" : "border-[#E8DFD8]"
                        }`}
                    />
                    {fieldErrors.city && (
                      <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-xs font-medium text-[#2D2723] mb-1">
                      State <span className="text-[#874F4C]">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Karnataka"
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.state ? "border-[#874F4C]" : "border-[#E8DFD8]"
                        }`}
                    />
                    {fieldErrors.state && (
                      <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-xs font-medium text-[#2D2723] mb-1">
                      PIN Code <span className="text-[#874F4C]">*</span>
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      maxLength={6}
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="6 digits"
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all ${fieldErrors.postalCode ? "border-[#874F4C]" : "border-[#E8DFD8]"
                        }`}
                    />
                    {fieldErrors.postalCode && (
                      <p className="text-[11px] text-[#874F4C] mt-1">{fieldErrors.postalCode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-xs font-medium text-[#2D2723] mb-1">
                    Delivery Instructions <span className="text-[#9E958C] text-[11px]">(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. Call before delivery, leave with security guard if unavailable"
                    className="w-full px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method: Cash on Delivery */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-7 shadow-warm-xs space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2D2723] border-b border-[#ECEAE6] pb-3">
                3. Payment Method
              </h2>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#B88B58]/40 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#B88B58] flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B88B58]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#B88B58]" />
                    <span className="text-sm font-medium text-[#2D2723]">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#786E65] pl-8 leading-relaxed font-light">
                  Pay with physical cash or UPI directly to the delivery courier when your package arrives at your doorstep. No advance payment required.
                </p>
              </div>
            </div>

            {/* Submission Error Banner */}
            {submitError && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-4 sm:px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-md flex items-center justify-center gap-2 break-words text-center ${isSubmitting
                  ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
                  : "bg-[#2D2723] hover:bg-[#3C3530] hover:shadow-warm-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88B58]"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#786E65] border-t-transparent rounded-full animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <span>Place Order ({formatINR(total)}) · Cash on Delivery</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary (5 cols on lg, sticky) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEAE6] pb-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723]">
                Order Items ({cartCount})
              </h2>
              <Link href="/cart" className="text-xs text-[#B88B58] hover:underline">
                Edit Bag
              </Link>
            </div>

            {/* Items scroll area */}
            <div className="divide-y divide-[#ECEAE6] max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div className="relative w-14 aspect-[3/4] rounded-lg overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-contain object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9E958C]">
                        <Sparkles className="w-3.5 h-3.5 opacity-60 text-[#B88B58]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#2D2723] truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#786E65]">
                      {item.size && <span>Size: {item.size}</span>}
                      <span>× {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#2D2723]">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Calculations */}
            <div className="pt-3 border-t border-[#ECEAE6] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#5C534B]">
                <span>Items Subtotal</span>
                <span className="font-medium text-[#2D2723]">{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#5C534B]">
                <span>Standard Delivery Fee</span>
                <span className="font-medium text-[#2D2723]">{formatINR(shippingFee)}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF7F2] text-[10px] text-[#786E65] border border-[#E8DFD8]">
                Fixed delivery rate of {formatINR(STORE_CONFIG.SHIPPING_FEE)} applied once per order nationwide.
              </div>
              <div className="pt-2 border-t border-[#ECEAE6] flex items-baseline justify-between text-sm">
                <span className="font-medium text-[#2D2723]">Total Payable</span>
                <span className="font-serif text-2xl font-semibold text-[#2D2723]">
                  {formatINR(total)}
                </span>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="pt-3 border-t border-[#ECEAE6] space-y-2 text-xs text-[#786E65]">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#B88B58] shrink-0" />
                <span>Estimated doorstep delivery in 3–5 working days</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88B58] shrink-0" />
                <span>Pay only after receiving and inspecting the package</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
