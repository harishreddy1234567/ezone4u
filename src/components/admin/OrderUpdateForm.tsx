"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  Save,
} from "lucide-react";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

interface OrderUpdateFormProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  currentCarrier: string | null;
  currentTracking: string | null;
}

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: OrderStatus.PENDING, label: "Pending (Placed)" },
  { value: OrderStatus.CONFIRMED, label: "Confirmed" },
  { value: OrderStatus.PROCESSING, label: "Processing (Packaging)" },
  { value: OrderStatus.SHIPPED, label: "Shipped (In Transit)" },
  { value: OrderStatus.OUT_FOR_DELIVERY, label: "Out For Delivery" },
  { value: OrderStatus.DELIVERED, label: "Delivered (Completed)" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: PaymentStatus.PENDING, label: "Pending (Uncollected)" },
  { value: PaymentStatus.PAID, label: "Paid (Payment Collected)" },
  { value: PaymentStatus.CANCELLED, label: "Cancelled" },
  { value: PaymentStatus.REFUNDED, label: "Refunded" },
];

export default function OrderUpdateForm({
  orderId,
  orderNumber,
  currentStatus,
  currentPaymentStatus,
  currentCarrier,
  currentTracking,
}: OrderUpdateFormProps) {
  const router = useRouter();

  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>(currentPaymentStatus);
  const [carrier, setCarrier] = useState<string>(currentCarrier || "");
  const [trackingNumber, setTrackingNumber] = useState<string>(
    currentTracking || ""
  );
  const [adminNote, setAdminNote] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isTerminal =
    currentStatus === OrderStatus.DELIVERED ||
    currentStatus === OrderStatus.CANCELLED;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          shippingCarrier: carrier.trim() || null,
          trackingNumber: trackingNumber.trim() || null,
          adminNote: adminNote.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.error || "Failed to update order status. Please verify permissions."
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        `Order #${orderNumber} updated successfully. Status: ${status}, Payment: ${paymentStatus}.`
      );
      setAdminNote("");
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setErrorMessage("Network connection error. Unable to save changes.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-7 shadow-warm-xs space-y-6">
      <div className="border-b border-[#ECEAE6] pb-3 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#B88B58]" />
          <span>Fulfillment & Payment Operations</span>
        </h2>
        {isTerminal && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8DFD8] text-[#786E65]">
            Terminal State
          </span>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#F2F7F2] border border-[#D6E6D7] flex items-start gap-2.5 text-xs text-[#4A6B53]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] flex items-start gap-2.5 text-xs text-[#874F4C]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order Status Select */}
          <div>
            <label
              htmlFor="order-status-select"
              className="block text-xs font-medium text-[#2D2723] mb-1.5"
            >
              Order Fulfillment Status
            </label>
            <select
              id="order-status-select"
              value={status}
              disabled={isTerminal}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isTerminal && (
              <p className="text-[10px] text-[#786E65] mt-1 italic">
                This order has reached a terminal status and cannot be transitioned further.
              </p>
            )}
          </div>

          {/* Payment Status Select */}
          <div>
            <label
              htmlFor="payment-status-select"
              className="block text-xs font-medium text-[#2D2723] mb-1.5 flex items-center justify-between"
            >
              <span>Cash Collection Status</span>
              <span className="text-[10px] text-[#B88B58] font-normal">
                Independent of Delivery
              </span>
            </label>
            <select
              id="payment-status-select"
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(e.target.value as PaymentStatus)
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#786E65] mt-1 font-light">
              Only mark as <strong className="font-semibold text-[#4A6B53]">Paid</strong> after cash or UPI payment is verified from the courier.
            </p>
          </div>
        </div>

        {/* Courier & Tracking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#ECEAE6]">
          <div>
            <label
              htmlFor="carrier-input"
              className="block text-xs font-medium text-[#2D2723] mb-1.5"
            >
              Courier / Delivery Provider
            </label>
            <input
              type="text"
              id="carrier-input"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. Delhivery, Blue Dart, DTDC"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="tracking-input"
              className="block text-xs font-medium text-[#2D2723] mb-1.5"
            >
              Tracking / AWB Number
            </label>
            <input
              type="text"
              id="tracking-input"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. AWB9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all font-mono"
            />
          </div>
        </div>

        {/* Admin Audit Note */}
        <div className="pt-2 border-t border-[#ECEAE6]">
          <label
            htmlFor="admin-note-input"
            className="block text-xs font-medium text-[#2D2723] mb-1.5 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#B88B58]" />
            <span>Admin Status Change Note <span className="text-[#9E958C] font-normal">(Internal Audit Only)</span></span>
          </label>
          <input
            type="text"
            id="admin-note-input"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Handed over to courier pickup boy. Manifest verified."
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-xs flex items-center justify-center gap-2 ${
              isSubmitting
                ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
                : "bg-[#2D2723] hover:bg-[#3C3530] hover:shadow-warm-sm active:scale-[0.99]"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#786E65] border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes to Database</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
