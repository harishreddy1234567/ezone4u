import React from "react";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  let badgeStyles = "bg-[#FAF7F2] text-[#786E65] border-[#E8DFD8]";
  let label = status as string;

  switch (status) {
    case OrderStatus.PENDING:
      badgeStyles = "bg-[#FDF6ED] text-[#B88B58] border-[#F2DEBF]";
      label = "Pending";
      break;
    case OrderStatus.PLACED:
      badgeStyles = "bg-[#FDF6ED] text-[#B88B58] border-[#F2DEBF]";
      label = "Placed";
      break;
    case OrderStatus.CONFIRMED:
      badgeStyles = "bg-[#EFF6FF] text-[#3B6694] border-[#D0E1FD]";
      label = "Confirmed";
      break;
    case OrderStatus.PROCESSING:
      badgeStyles = "bg-[#F7F2FA] text-[#7E5E8A] border-[#E8DCF0]";
      label = "Processing";
      break;
    case OrderStatus.SHIPPED:
      badgeStyles = "bg-[#F0F7F6] text-[#3D7770] border-[#D1E6E3]";
      label = "Shipped";
      break;
    case OrderStatus.OUT_FOR_DELIVERY:
      badgeStyles = "bg-[#F0F7F6] text-[#2F615A] border-[#C3DED9]";
      label = "Out for Delivery";
      break;
    case OrderStatus.DELIVERED:
      badgeStyles = "bg-[#F2F7F2] text-[#4A6B53] border-[#D6E6D7]";
      label = "Delivered";
      break;
    case OrderStatus.CANCELLED:
      badgeStyles = "bg-[#FAF0F0] text-[#874F4C] border-[#F0D5D5]";
      label = "Cancelled";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeStyles}`}
    >
      {label}
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  let badgeStyles = "bg-[#FAF7F2] text-[#786E65] border-[#E8DFD8]";
  let label = status as string;

  switch (status) {
    case PaymentStatus.PENDING:
      badgeStyles = "bg-[#FDF6ED] text-[#B88B58] border-[#F2DEBF]";
      label = "Pending (COD)";
      break;
    case PaymentStatus.PAID:
      badgeStyles = "bg-[#F2F7F2] text-[#4A6B53] border-[#D6E6D7]";
      label = "Paid";
      break;
    case PaymentStatus.FAILED:
      badgeStyles = "bg-[#FAF0F0] text-[#A63A36] border-[#F0D5D5]";
      label = "Failed";
      break;
    case PaymentStatus.CANCELLED:
      badgeStyles = "bg-[#FAF0F0] text-[#874F4C] border-[#F0D5D5]";
      label = "Cancelled";
      break;
    case PaymentStatus.REFUNDED:
      badgeStyles = "bg-[#F4EFEA] text-[#786E65] border-[#E8DFD8]";
      label = "Refunded";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${badgeStyles}`}
    >
      {label}
    </span>
  );
}
