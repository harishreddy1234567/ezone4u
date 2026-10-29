import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Package,
  MapPin,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Truck,
  AlertTriangle,
  Check,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { formatINR } from "@/lib/constants";
import { OrderStatus } from "@/generated/prisma/enums";

interface OrderConfirmationProps {
  params: Promise<{
    orderReference: string;
  }>;
}

export async function generateMetadata({
  params,
}: OrderConfirmationProps): Promise<Metadata> {
  const { orderReference } = await params;
  return {
    title: `Order Tracking #${orderReference} | Ezone4u`,
    description: "Your Ezone4u Cash on Delivery order details and real-time tracking.",
  };
}

async function OrderConfirmationContent({
  params,
}: OrderConfirmationProps) {
  await connection();
  const { orderReference } = await params;

  if (!orderReference || typeof orderReference !== "string") {
    notFound();
  }

  let order;
  try {
    order = await prisma.order.findUnique({
      where: { orderNumber: orderReference },
      include: {
        deliveryaddress: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    // If database connection fails, provide a safe fallback state
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-[#2D2723]">Order Lookup Temporary Notice</h1>
          <p className="text-sm text-[#786E65] leading-relaxed">
            Your Cash on Delivery order has been recorded. Our system is temporarily updating.
            Please retain your order reference:{" "}
            <span className="font-mono font-semibold text-[#2D2723]">{orderReference}</span>
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  // Format order date
  const orderDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(order.createdAt);

  // Mask customer phone for secure guest access display (e.g. 98••••••21)
  const phone = (order.customerPhone || "").trim();
  const maskedPhone =
    phone.length >= 10
      ? `${phone.slice(0, 2)}••••••${phone.slice(-2)}`
      : phone;

  const cleanCustomerNotes = "";

  // Determine dynamic tracking step indices (1 to 4)
  // Step 1: Placed / Confirmed
  // Step 2: Processing
  // Step 3: Shipped (In Transit)
  // Step 4: Delivered
  const isCancelled = order.status === OrderStatus.CANCELLED;
  let currentStep = 1;

  if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PLACED || order.status === OrderStatus.PENDING) {
    currentStep = 1;
  } else if (order.status === OrderStatus.PROCESSING) {
    currentStep = 2;
  } else if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.OUT_FOR_DELIVERY) {
    currentStep = 3;
  } else if (order.status === OrderStatus.DELIVERED) {
    currentStep = 4;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
      {/* 1. Header & Status Celebration */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-10 text-center space-y-4 shadow-warm-xs">
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center mx-auto shadow-inner ${
            isCancelled
              ? "bg-[#FAF0F0] border-[#F0D5D5] text-[#874F4C]"
              : currentStep === 4
              ? "bg-[#F2F7F2] border-[#D6E6D7] text-[#4A6B53]"
              : "bg-[#F4EFEA] border-[#E8DFD8] text-[#B88B58]"
          }`}
        >
          {isCancelled ? (
            <AlertTriangle className="w-9 h-9 sm:w-11 sm:h-11" />
          ) : currentStep === 4 ? (
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
          ) : (
            <Truck className="w-9 h-9 sm:w-11 sm:h-11" />
          )}
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#B88B58] font-semibold">
            {isCancelled
              ? "Order Status Update"
              : currentStep === 4
              ? "Package Delivered"
              : "Live Order Tracking"}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2D2723] font-normal tracking-wide">
            {isCancelled
              ? "Order Cancelled"
              : currentStep === 4
              ? `Delivered to ${order.customerName}!`
              : `Thank you, ${order.customerName}!`}
          </h1>
          <p className="text-sm text-[#786E65] font-light leading-relaxed">
            {isCancelled
              ? "This order has been cancelled. If you have any inquiries, please contact our support atelier."
              : currentStep === 4
              ? "Your package has been successfully delivered to your destination."
              : order.status === OrderStatus.OUT_FOR_DELIVERY
              ? "Your parcel is out for delivery today and will reach your doorstep shortly. Please keep exact cash ready."
              : currentStep === 3
              ? "Your parcel is on its way with our delivery courier. You only pay upon doorstep arrival."
              : currentStep === 2
              ? "Our atelier team is currently inspecting and preparing your apparel pieces."
              : "Your Cash on Delivery order has been placed and is being reviewed for dispatch."}
          </p>
        </div>

        {/* Reference & Date Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
          <div className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] flex items-center gap-2 max-w-full">
            <span className="text-[#786E65] shrink-0">Order Reference:</span>
            <span className="font-mono font-semibold text-[#2D2723] tracking-wider break-all">
              {order.orderNumber}
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] flex items-center gap-2 text-[#786E65]">
            <Calendar className="w-3.5 h-3.5 text-[#B88B58]" />
            <span>{orderDate}</span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Progress Indicator */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECEAE6] pb-2">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723]">
            Fulfillment Journey
          </h2>
          <span className="text-xs font-medium text-[#786E65]">
            Status: <strong className="text-[#2D2723] font-semibold">{order.status}</strong>
          </span>
        </div>

        {isCancelled ? (
          <div className="p-4 rounded-xl bg-[#FAF0F0] border border-[#F0D5D5] text-xs text-[#874F4C] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Order Cancelled</p>
              <p className="text-[11px] text-[#786E65] mt-0.5">
                No charges applied. The order will not be dispatched.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {/* Step 1: Placed */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                currentStep >= 1
                  ? "bg-[#FAF7F2] border-[#B88B58]/40"
                  : "bg-[#FFFDF9] border-[#E8DFD8] opacity-50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  currentStep > 1
                    ? "bg-[#4A6B53] text-[#FAF7F2]"
                    : currentStep === 1
                    ? "bg-[#B88B58] text-[#FAF7F2]"
                    : "bg-[#E8DFD8] text-[#786E65]"
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2D2723]">Order Placed</p>
                <p className="text-[10px] text-[#786E65] truncate">
                  {order.status === OrderStatus.CONFIRMED ? "Confirmed" : "Received via COD"}
                </p>
              </div>
            </div>

            {/* Step 2: Processing */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                currentStep >= 2
                  ? "bg-[#FAF7F2] border-[#B88B58]/40"
                  : "bg-[#FFFDF9] border-[#E8DFD8] opacity-50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  currentStep > 2
                    ? "bg-[#4A6B53] text-[#FAF7F2]"
                    : currentStep === 2
                    ? "bg-[#B88B58] text-[#FAF7F2]"
                    : "bg-[#E8DFD8] text-[#786E65]"
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2D2723]">Processing</p>
                <p className="text-[10px] text-[#786E65] truncate">
                  {currentStep >= 2 ? "Quality inspection" : "Pending"}
                </p>
              </div>
            </div>

            {/* Step 3: Shipped */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                currentStep >= 3
                  ? "bg-[#FAF7F2] border-[#B88B58]/40"
                  : "bg-[#FFFDF9] border-[#E8DFD8] opacity-50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  currentStep > 3
                    ? "bg-[#4A6B53] text-[#FAF7F2]"
                    : currentStep === 3
                    ? "bg-[#B88B58] text-[#FAF7F2]"
                    : "bg-[#E8DFD8] text-[#786E65]"
                }`}
              >
                {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : "3"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2D2723]">Shipped</p>
                <p className="text-[10px] text-[#786E65] truncate">
                  {order.shippingStatus || "In Transit"}
                </p>
              </div>
            </div>

            {/* Step 4: Delivered */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                currentStep >= 4
                  ? "bg-[#FAF7F2] border-[#4A6B53]/40"
                  : "bg-[#FFFDF9] border-[#E8DFD8] opacity-50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  currentStep === 4
                    ? "bg-[#4A6B53] text-[#FAF7F2]"
                    : "bg-[#E8DFD8] text-[#786E65]"
                }`}
              >
                {currentStep === 4 ? <Check className="w-3.5 h-3.5" /> : "4"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2D2723]">Delivered</p>
                <p className="text-[10px] text-[#786E65] truncate">
                  {currentStep === 4 ? "Completed" : "Doorstep handover"}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. Main 2-Column Order Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ordered Products (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-7 shadow-warm-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEAE6] pb-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#B88B58]" />
                <span>Ordered Items ({order.items.length})</span>
              </h2>
            </div>

            <div className="divide-y divide-[#ECEAE6]">
              {order.items.map((item) => {
                const primaryImage = item.product?.images?.[0];

                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    <div className="relative w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shrink-0">
                      {primaryImage?.url ? (
                        <Image
                          src={primaryImage.url}
                          alt={item.productName}
                          fill
                          sizes="(max-width: 640px) 64px, 80px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#9E958C]">
                          <Sparkles className="w-4 h-4 opacity-50 text-[#B88B58]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-[#2D2723] leading-snug">
                        {item.productName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#786E65]">
                        {item.size && (
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD8]">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD8]">
                            Color: {item.color}
                          </span>
                        )}
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <p className="text-xs text-[#786E65]">
                        Unit Price: {formatINR(Number(item.unitPrice))}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-[#2D2723]">
                        {formatINR(Number(item.subtotal))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doorstep Assurance Callout */}
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8DFD8] p-5 flex items-start gap-3 text-xs text-[#786E65]">
            <ShieldCheck className="w-5 h-5 text-[#B88B58] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#2D2723]">Payment Instructions on Handover</p>
              <p className="leading-relaxed font-light">
                {order.paymentStatus === "PAID"
                  ? "Payment for this order has been verified and received. No further payment is required."
                  : `Please keep the exact amount (${formatINR(
                      Number(order.totalAmount)
                    )}) ready in physical cash or have your UPI QR app ready when our courier arrives.`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Delivery Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary Card */}
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3">
              Payment & Totals
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#5C534B]">
                <span>Product Subtotal</span>
                <span className="font-medium text-[#2D2723]">
                  {formatINR(Number(order.subtotal))}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#5C534B]">
                <span>Fixed Shipping Fee</span>
                <span className="font-medium text-[#2D2723]">
                  {formatINR(Number(order.shippingFee))}
                </span>
              </div>

              <div className="pt-2 border-t border-[#ECEAE6] flex items-baseline justify-between text-sm">
                <span className="font-medium text-[#2D2723]">Total Payable</span>
                <span className="font-serif text-2xl font-semibold text-[#2D2723]">
                  {formatINR(Number(order.totalAmount))}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECEAE6] space-y-2 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#786E65] flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-[#B88B58]" />
                  <span>Payment Method:</span>
                </span>
                <span className="font-medium text-[#2D2723]">
                  Cash on Delivery (COD)
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#786E65]">Payment Status:</span>
                {order.paymentStatus === "PAID" ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#F2F7F2] border border-[#D6E6D7] text-[11px] font-semibold text-[#4A6B53]">
                    Paid (Verified)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[11px] font-semibold text-[#B88B58]">
                    Pending (Pay upon delivery)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Delivery Destination</span>
            </h2>

            <div className="text-xs text-[#5C534B] space-y-1 leading-relaxed">
              <p className="font-semibold text-[#2D2723]">{order.deliveryaddress?.fullName || order.customerName}</p>
              <p>{order.deliveryaddress?.addressLine1 || "Standard Delivery"}</p>
              {order.deliveryaddress?.addressLine2 && <p>{order.deliveryaddress.addressLine2}</p>}
              <p>
                {order.deliveryaddress?.city || ""}{order.deliveryaddress?.state ? `, ${order.deliveryaddress.state}` : ""}{order.deliveryaddress?.postalCode ? ` — ${order.deliveryaddress.postalCode}` : ""}
              </p>
              <p>{order.deliveryaddress?.country || "India"}</p>
              <div className="pt-2 text-[11px] text-[#786E65] border-t border-[#ECEAE6] space-y-0.5">
                <p>Contact Phone: {maskedPhone}</p>
                {order.customerEmail && <p>Receipt Email: {order.customerEmail}</p>}
                {cleanCustomerNotes && (
                  <p className="italic pt-1 text-[#9E958C]">
                    Instructions: &ldquo;{cleanCustomerNotes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Continue Shopping CTA */}
          <div className="pt-2">
            <Link
              href="/shop"
              className="w-full py-4 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-medium text-[#FAF7F2] bg-[#2D2723] hover:bg-[#3C3530] transition-all shadow-warm-md flex items-center justify-center gap-2"
            >
              <span>Explore More Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage({
  params,
}: OrderConfirmationProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#786E65]">Loading order details...</p>
        </div>
      }
    >
      <OrderConfirmationContent params={params} />
    </Suspense>
  );
}
