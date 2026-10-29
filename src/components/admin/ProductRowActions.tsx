"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Eye, EyeOff, Trash2, AlertCircle } from "lucide-react";

interface ProductRowActionsProps {
  productId: string;
  productName: string;
  isActive: boolean;
  orderCount: number;
}

export default function ProductRowActions({
  productId,
  productName,
  isActive: initialActive,
  orderCount,
}: ProductRowActionsProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  async function handleToggleActive() {
    setIsProcessing(true);
    setErrorBanner(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_active" }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorBanner(data.error || "Failed to update visibility.");
        setIsProcessing(false);
        return;
      }

      setIsActive(data.isActive);
      setIsProcessing(false);
      router.refresh();
    } catch {
      setErrorBanner("Network error updating product status.");
      setIsProcessing(false);
    }
  }

  async function handleDelete() {
    if (orderCount > 0) {
      alert(
        `Cannot delete "${productName}" because it is referenced in ${orderCount} customer order(s).\n\nPlease use "Archive" instead to hide this product safely from the customer storefront.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${productName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setErrorBanner(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorBanner(data.error || "Failed to delete product.");
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);
      router.refresh();
    } catch {
      setErrorBanner("Network error deleting product.");
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {errorBanner && (
        <div
          title={errorBanner}
          className="text-[#874F4C] cursor-help p-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Edit Product */}
      <Link
        href={`/admin/products/${productId}/edit`}
        className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#2D2723] hover:bg-[#F4EFEA] border border-[#E8DFD8] transition-colors"
        title="Edit Product Details & Variants"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Link>

      {/* Toggle Visibility / Archive */}
      <button
        onClick={handleToggleActive}
        disabled={isProcessing}
        className={`p-1.5 rounded-lg border transition-colors ${
          isActive
            ? "bg-[#FAF7F2] text-[#4A6B53] border-[#E8DFD8] hover:bg-[#F2F7F2]"
            : "bg-[#FDF6ED] text-[#B88B58] border-[#F2DEBF] hover:bg-[#FDF6ED]/80"
        }`}
        title={isActive ? "Archive & Hide from Storefront" : "Activate & Publish to Storefront"}
      >
        {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* Delete (Safe Deletion with Order History Check) */}
      <button
        onClick={handleDelete}
        disabled={isProcessing}
        className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#786E65] hover:text-[#874F4C] hover:bg-[#FAF0F0] border border-[#E8DFD8] hover:border-[#F0D5D5] transition-colors disabled:opacity-50"
        title={orderCount > 0 ? "Cannot delete: referenced in customer orders" : "Permanently Delete Product"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
