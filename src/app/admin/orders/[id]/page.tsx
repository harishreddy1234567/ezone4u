import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  Truck,
  Sparkles,
  History,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/StatusBadge";
import OrderUpdateForm from "@/components/admin/OrderUpdateForm";
import { formatINR } from "@/lib/constants";

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function AdminOrderDetailContent({
  params,
}: AdminOrderDetailPageProps) {
  await requireAdminSession();
  const { id } = await params;

  let order;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        deliveryaddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
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
    order = null;
  }

  if (!order) {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(order.createdAt);

  const formattedUpdatedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(order.updatedAt);

  const auditLogs: string[] = [];
  const customerNotes = "";

  return (
    <div className="pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb */}
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Orders Management</span>
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
                Order #{order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#786E65]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B88B58]" />
                <span>Placed on {formattedDate}</span>
              </span>
              <span>·</span>
              <span>Last updated: {formattedUpdatedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/order-confirmation/${order.orderNumber}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFEA] text-xs text-[#2D2723] border border-[#E8DFD8] transition-colors inline-flex items-center gap-1.5 shadow-warm-xs"
            >
              <span>View Customer Tracking Page</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Products & Update Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Fulfillment & Payment Form */}
            <OrderUpdateForm
              orderId={order.id}
              orderNumber={order.orderNumber}
              currentStatus={order.status}
              currentPaymentStatus={order.paymentStatus}
              currentCarrier={order.shippingStatus}
              currentTracking={""}
            />

            {/* Ordered Products Table */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-7 shadow-warm-xs space-y-4">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#B88B58]" />
                <span>Ordered Items ({order.items.length})</span>
              </h2>

              <div className="divide-y divide-[#ECEAE6]">
                {order.items.map((item) => {
                  const image = item.product?.images?.[0];

                  return (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center gap-4"
                    >
                      <div className="relative w-16 aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shrink-0">
                        {image?.url ? (
                          <Image
                            src={image.url}
                            alt={item.productName}
                            fill
                            sizes="64px"
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

            {/* Status History & Audit Log */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-7 shadow-warm-xs space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-[#B88B58]" />
                <span>Internal Audit Trail & Status History</span>
              </h2>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-[#786E65] italic py-2">
                  No status modifications recorded yet. Initial order placed via Cash on Delivery.
                </p>
              ) : (
                <div className="space-y-2 pt-1 font-mono text-[11px] text-[#5C534B]">
                  {auditLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] leading-relaxed"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, Customer & Courier Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Financial Summary Card */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs space-y-4">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3">
                Financial Breakdown
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#5C534B]">
                  <span>Items Subtotal</span>
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
                  <span className="text-[#786E65]">Payment Method:</span>
                  <span className="font-medium text-[#2D2723]">
                    Cash on Delivery (COD)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#786E65]">Payment Status:</span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Customer & Delivery Information Card */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#B88B58]" />
                <span>Customer & Destination Details</span>
              </h2>

              <div className="text-xs text-[#5C534B] space-y-2 leading-relaxed">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#9E958C] block">
                    Recipient Name
                  </span>
                  <span className="font-semibold text-[#2D2723] text-sm">
                    {order.deliveryaddress?.fullName || order.customerName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#ECEAE6]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#9E958C] block">
                      Mobile Number
                    </span>
                    <a
                      href={`tel:${order.deliveryaddress?.mobile || order.customerPhone}`}
                      className="font-medium text-[#2D2723] hover:text-[#B88B58] transition-colors"
                    >
                      {order.deliveryaddress?.mobile || order.customerPhone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#9E958C] block">
                      Email Address
                    </span>
                    <span className="font-medium text-[#2D2723] truncate block">
                      {order.deliveryaddress?.email || order.customerEmail || "Not provided (Guest)"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#ECEAE6]">
                  <span className="text-[10px] uppercase tracking-wider text-[#9E958C] block">
                    Delivery Address
                  </span>
                  <p className="text-[#2D2723] mt-0.5">{order.deliveryaddress?.addressLine1 || "Standard Delivery"}</p>
                  {order.deliveryaddress?.addressLine2 && <p>{order.deliveryaddress.addressLine2}</p>}
                  <p>
                    {order.deliveryaddress?.city || ""}{order.deliveryaddress?.state ? `, ${order.deliveryaddress.state}` : ""}{order.deliveryaddress?.postalCode ? ` — ${order.deliveryaddress.postalCode}` : ""}
                  </p>
                  <p className="font-medium">{order.deliveryaddress?.country || "India"}</p>
                </div>

                {customerNotes && (
                  <div className="pt-2 border-t border-[#ECEAE6]">
                    <span className="text-[10px] uppercase tracking-wider text-[#9E958C] block">
                      Customer Delivery Note
                    </span>
                    <p className="italic text-[#2D2723] mt-0.5 bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DFD8]">
                      &ldquo;{customerNotes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Courier & Tracking Details Card */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#B88B58]" />
                <span>Courier / Dispatch Information</span>
              </h2>

              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#786E65]">Courier Partner:</span>
                  <span className="font-medium text-[#2D2723]">
                    {order.shippingStatus || "Not yet assigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#786E65]">Tracking / AWB:</span>
                  <span className="font-mono font-semibold text-[#2D2723]">
                    Pending dispatch
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminOrderDetailContent params={params} />
    </Suspense>
  );
}
