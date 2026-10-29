import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

// Allowed status state transitions map
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PENDING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PROCESSING]: [
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SHIPPED]: [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [], // Terminal state
};

const updateOrderSchema = z.object({
  status: z
    .enum([
      OrderStatus.PLACED,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ])
    .optional(),
  paymentStatus: z
    .enum([
      PaymentStatus.PENDING,
      PaymentStatus.PAID,
      PaymentStatus.CANCELLED,
      PaymentStatus.REFUNDED,
    ])
    .optional(),
  shippingCarrier: z.string().trim().max(100).optional().nullable(),
  trackingNumber: z.string().trim().max(100).optional().nullable(),
  adminNote: z.string().trim().max(500).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  orderBy: { displayOrder: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve order details from database.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parseResult = updateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Invalid update data.",
        },
        { status: 400 }
      );
    }

    const {
      status: targetStatus,
      paymentStatus: targetPaymentStatus,
    } = parseResult.data;

    // Fetch existing order from MySQL
    const currentOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: "Order record not found." },
        { status: 404 }
      );
    }

    // Terminal states cannot be transitioned or re-cancelled
    if (currentOrder.status === OrderStatus.CANCELLED) {
      return NextResponse.json(
        {
          success: false,
          error: "Order is already cancelled and in terminal state.",
        },
        { status: 400 }
      );
    }

    // Validate order status transition
    if (targetStatus && targetStatus !== currentOrder.status) {
      const allowed = ALLOWED_TRANSITIONS[currentOrder.status];
      if (!allowed || !allowed.includes(targetStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition: Cannot move order from ${currentOrder.status} to ${targetStatus}.`,
          },
          { status: 400 }
        );
      }
    }

    // Apply updates to MySQL with inventory restoration on cancellation
    let updatedOrder;

    if (targetStatus === OrderStatus.CANCELLED) {
      // Atomic stock restoration: restore stock to variants and products, then mark CANCELLED
      updatedOrder = await prisma.$transaction(async (tx) => {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of orderItems) {
          if (item.productVariantId) {
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        return await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.CANCELLED,
            shippingStatus: "CANCELLED",
          },
        });
      });
    } else {
      updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          ...(targetStatus ? { status: targetStatus } : {}),
          ...(targetPaymentStatus ? { paymentStatus: targetPaymentStatus } : {}),
          ...(targetStatus === "SHIPPED" || targetStatus === "OUT_FOR_DELIVERY" || targetStatus === "DELIVERED"
            ? { shippingStatus: targetStatus }
            : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.orderNumber} successfully updated.`,
      order: updatedOrder,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order in database.",
      },
      { status: 500 }
    );
  }
}
