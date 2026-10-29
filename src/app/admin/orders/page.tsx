import React, { Suspense } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  AlertCircle,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/StatusBadge";
import { formatINR } from "@/lib/constants";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

interface AdminOrdersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 15;

async function AdminOrdersContent({
  searchParams,
}: AdminOrdersPageProps) {
  await requireAdminSession();
  const params = await searchParams;

  const searchQuery = params?.q?.trim() || "";
  const statusFilter = params?.status?.trim()?.toUpperCase() || "ALL";
  const currentPage = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  // Validate status filter
  const validStatus = Object.values(OrderStatus).includes(
    statusFilter as OrderStatus
  )
    ? (statusFilter as OrderStatus)
    : undefined;

  type OrderQueryArgs = NonNullable<
    Parameters<typeof prisma.order.findMany>[0]
  >;

  let totalCount = 0;
  let orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
    createdAt: Date;
    itemsCount: number;
  }> = [];

  let dbError: string | null = null;

  try {
    const where: NonNullable<OrderQueryArgs["where"]> = {};

    if (validStatus) {
      where.status = validStatus;
    }

    if (searchQuery) {
      where.OR = [
        { orderNumber: { contains: searchQuery } },
        { customerName: { contains: searchQuery } },
        { customerPhone: { contains: searchQuery } },
        { customerEmail: { contains: searchQuery } },
      ];
    }

    const [count, rawOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          totalAmount: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    totalCount = count;
    orders = rawOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || "Customer",
      customerPhone: o.customerPhone || "N/A",
      customerEmail: o.customerEmail || "",
      totalAmount: Number(o.totalAmount),
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt,
      itemsCount: o._count.items,
    }));
  } catch {
    dbError =
      "Unable to fetch orders from database. Please verify your MySQL connection settings.";
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function createPageLink(targetPage: number) {
    const p = new URLSearchParams();
    if (searchQuery) p.set("q", searchQuery);
    if (statusFilter && statusFilter !== "ALL") p.set("status", statusFilter);
    if (targetPage > 1) p.set("page", targetPage.toString());
    const queryString = p.toString();
    return `/admin/orders${queryString ? `?${queryString}` : ""}`;
  }

  const allStatuses: Array<{ key: string; label: string }> = [
    { key: "ALL", label: "All Orders" },
    { key: OrderStatus.PLACED, label: "Placed" },
    { key: OrderStatus.CONFIRMED, label: "Confirmed" },
    { key: OrderStatus.PROCESSING, label: "Processing" },
    { key: OrderStatus.SHIPPED, label: "Shipped" },
    { key: OrderStatus.DELIVERED, label: "Delivered" },
    { key: OrderStatus.CANCELLED, label: "Cancelled" },
  ];

  return (
    <div className="pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
              Customer Orders
            </h1>
            <p className="text-xs text-[#786E65] mt-1">
              Manage fulfillment, update delivery status, and review Cash on Delivery payments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#2D2723] shadow-warm-xs">
              Total Records: <strong className="font-semibold text-[#B88B58]">{totalCount}</strong>
            </span>
          </div>
        </div>

        {/* Database Warning Banner if DB is unreachable */}
        {dbError && (
          <div className="p-4 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] flex items-start gap-3 text-xs text-[#874F4C]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{dbError}</p>
              <p className="font-light text-[#5C534B]">
                Ensure your MySQL database credentials in <code className="px-1 py-0.5 bg-[#FAF7F2] rounded border border-[#E8DFD8]">.env</code> are configured correctly.
              </p>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-4 sm:p-5 shadow-warm-xs space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#ECEAE6]">
            <span className="text-xs font-semibold text-[#786E65] uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Status:</span>
            </span>
            {allStatuses.map((tab) => {
              const isActive = statusFilter === tab.key;
              const linkUrl =
                tab.key === "ALL"
                  ? searchQuery
                    ? `/admin/orders?q=${encodeURIComponent(searchQuery)}`
                    : "/admin/orders"
                  : `/admin/orders?status=${tab.key}${
                      searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                    }`;

              return (
                <Link
                  key={tab.key}
                  href={linkUrl}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#2D2723] text-[#FAF7F2] shadow-warm-xs"
                      : "bg-[#FAF7F2] text-[#786E65] hover:bg-[#F4EFEA] hover:text-[#2D2723] border border-[#E8DFD8]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Search Bar */}
          <form method="GET" action="/admin/orders" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {statusFilter !== "ALL" && (
              <input type="hidden" name="status" value={statusFilter} />
            )}
            <div className="relative flex-1">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by Order #, Customer Name, Phone, or Email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
              <Search className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors shrink-0 shadow-warm-xs"
            >
              Search
            </button>
            {searchQuery && (
              <Link
                href={
                  statusFilter !== "ALL"
                    ? `/admin/orders?status=${statusFilter}`
                    : "/admin/orders"
                }
                className="px-3 py-2.5 rounded-xl text-xs text-[#786E65] hover:text-[#2D2723] border border-[#E8DFD8] bg-[#FAF7F2] transition-colors shrink-0"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Orders Table Card */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 sm:p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#2D2723]">
                No orders match your filter criteria.
              </p>
              <p className="text-xs text-[#786E65]">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try resetting your search query or status filter."
                  : "New customer orders placed through checkout will appear here in real-time."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ECEAE6] bg-[#FAF7F2] text-[#786E65] uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Order Reference</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE6]">
                  {orders.map((order) => {
                    const formattedDate = new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(order.createdAt);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-[#FAF7F2]/60 transition-colors"
                      >
                        <td className="py-4 px-4 sm:px-6 font-mono font-semibold text-[#2D2723] whitespace-nowrap">
                          {order.orderNumber}
                          <span className="block text-[10px] text-[#786E65] font-sans font-normal mt-0.5">
                            {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[#786E65] whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-4 px-4 font-medium text-[#2D2723] whitespace-nowrap">
                          {order.customerName}
                        </td>
                        <td className="py-4 px-4 text-[#786E65] whitespace-nowrap">
                          <div>{order.customerPhone}</div>
                          {order.customerEmail && (
                            <span className="text-[10px] text-[#9E958C] block truncate max-w-[150px]">
                              {order.customerEmail}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-[#2D2723] whitespace-nowrap">
                          {formatINR(order.totalAmount)}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <PaymentStatusBadge status={order.paymentStatus} />
                          <span className="block text-[10px] text-[#9E958C] mt-0.5">
                            {order.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-[11px] uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors shadow-warm-xs"
                          >
                            <span>View Order</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 sm:px-6 border-t border-[#ECEAE6] flex items-center justify-between text-xs text-[#786E65]">
              <span>
                Page {currentPage} of {totalPages} ({totalCount} total orders)
              </span>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={createPageLink(currentPage - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#2D2723] hover:bg-[#F4EFEA] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#9E958C] cursor-not-allowed opacity-50">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={createPageLink(currentPage + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#2D2723] hover:bg-[#F4EFEA] transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#9E958C] cursor-not-allowed opacity-50">
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminOrdersContent searchParams={searchParams} />
    </Suspense>
  );
}
