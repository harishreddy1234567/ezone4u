import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { STORE_CONFIG } from "@/lib/constants";

const orderSubmissionSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  customerEmail: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  addressLine1: z
    .string()
    .trim()
    .min(5, "Street address must be at least 5 characters")
    .max(250, "Address is too long"),
  addressLine2: z.string().trim().max(150).optional().or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit Indian PIN code"),
  country: z.string().trim().default("India"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product identifier is required"),
        variantId: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        quantity: z
          .number()
          .int()
          .min(1, "Quantity must be at least 1")
          .max(20, "Quantity limit exceeded"),
      })
    )
    .min(1, "Your shopping bag is empty"),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parseResult = orderSubmissionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || "Invalid order information provided.",
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Fetch authoritative product and variant data from MySQL
    const validatedItems: Array<{
      product: { id: string; name: string; price: number };
      variantId?: string;
      size?: string;
      color?: string;
      quantity: number;
    }> = [];

    let authoritativeSubtotal = 0;

    for (const cartItem of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: cartItem.productId },
        select: {
          id: true,
          name: true,
          price: true,
          status: true,
        },
      });

      if (!product || product.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            error: `One of the selected items is no longer available in our collection.`,
          },
          { status: 400 }
        );
      }

      // Check variant and stock if variantId is specified
      if (cartItem.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: cartItem.variantId },
          select: {
            id: true,
            productId: true,
            stockQuantity: true,
            size: true,
            color: true,
          },
        });

        if (!variant || variant.productId !== product.id) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid variant selected for "${product.name}".`,
            },
            { status: 400 }
          );
        }

        if (variant.stockQuantity < cartItem.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for "${product.name}" (Size: ${variant.size}). Only ${variant.stockQuantity} available.`,
            },
            { status: 400 }
          );
        }

        validatedItems.push({
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
          },
          variantId: variant.id,
          size: variant.size,
          color: variant.color || undefined,
          quantity: cartItem.quantity,
        });
      } else {
        validatedItems.push({
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
          },
          size: cartItem.size,
          color: cartItem.color,
          quantity: cartItem.quantity,
        });
      }

      authoritativeSubtotal += Number(product.price) * cartItem.quantity;
    }

    // Fixed Shipping Fee: exactly ₹60 per order, applied once
    const shippingFee = STORE_CONFIG.SHIPPING_FEE;
    const finalTotalAmount = authoritativeSubtotal + shippingFee;

    // Generate unique, non-guessable order reference (e.g., EZ-M3K2-9A4B)
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestampPart = Date.now().toString(36).slice(-4).toUpperCase();
    const orderNumber = `EZ-${timestampPart}-${randomSuffix}`;

    // Execute atomic transaction: decrement inventory & record order
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock for inventory-tracked variants & products
      for (const item of validatedItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 2. Insert Order record with CASH_ON_DELIVERY and PENDING statuses
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail || "",
          customerPhone: data.customerPhone,
          status: "PENDING",
          paymentStatus: "PENDING",
          shippingStatus: "NOT_SHIPPED",
          subtotal: authoritativeSubtotal.toFixed(2),
          shippingFee: shippingFee.toFixed(2),
          totalAmount: finalTotalAmount.toFixed(2),
          currency: "INR",
          deliveryaddress: {
            create: {
              fullName: data.customerName,
              mobile: data.customerPhone,
              addressLine1: data.addressLine1,
              addressLine2: data.addressLine2 || null,
              city: data.city,
              state: data.state,
              postalCode: data.postalCode,
              country: data.country || "India",
              email: data.customerEmail || null,
            },
          },
          items: {
            create: validatedItems.map((item) => ({
              productId: item.product.id,
              productVariantId: item.variantId || null,
              productName: item.product.name,
              size: item.size || null,
              color: item.color || null,
              unitPrice: item.product.price.toFixed(2),
              quantity: item.quantity,
              subtotal: (item.product.price * item.quantity).toFixed(2),
            })),
          },
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      orderNumber: createdOrder.orderNumber,
      message: "Order placed successfully via Cash on Delivery.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to place order at this time. Please check your network connection or try again shortly.",
      },
      { status: 500 }
    );
  }
}
