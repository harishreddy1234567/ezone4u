"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Tag,
  UploadCloud,
  Upload,
  Star,
  Link2,
  Loader2,
  X,
} from "lucide-react";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  description: string;
  price: string;
  compareAtPrice: string;
  isFeatured: boolean;
  isActive: boolean;
  images: Array<{
    id?: string;
    url: string;
    altText: string;
    isPrimary: boolean;
  }>;
  variants: Array<{
    id?: string;
    size: string;
    color: string;
    stockQuantity: number;
    sku: string;
  }>;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  categories: CategoryOption[];
  isEditing?: boolean;
}

export default function ProductForm({
  initialData,
  categories,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData>(
    initialData || {
      name: "",
      slug: "",
      sku: "",
      categoryId: "",
      description: "",
      price: "",
      compareAtPrice: "",
      isFeatured: false,
      isActive: true,
      images: [],
      variants: [
        { size: "M", color: "Warm Beige", stockQuantity: 10, sku: "" },
      ],
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualAlt, setManualAlt] = useState("");

  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: newName,
      slug: autoSlug ? slugify(newName) : prev.slug,
    }));
  }

  // Preset size variants helper
  function handleAddStandardSizes() {
    const standardSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const existingSizes = new Set(formData.variants.map((v) => v.size.toUpperCase()));

    const newVariants = standardSizes
      .filter((s) => !existingSizes.has(s))
      .map((size) => ({
        size,
        color: formData.variants[0]?.color || "",
        stockQuantity: 10,
        sku: "",
      }));

    if (newVariants.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, ...newVariants],
    }));
  }

  function handleAddVariantRow() {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: "L",
          color: prev.variants[prev.variants.length - 1]?.color || "",
          stockQuantity: 5,
          sku: "",
        },
      ],
    }));
  }

  function handleRemoveVariant(index: number) {
    if (formData.variants.length <= 1) {
      alert("A product must contain at least one size variant.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  }

  function handleVariantChange(
    index: number,
    field: "size" | "color" | "stockQuantity" | "sku",
    value: string | number
  ) {
    setFormData((prev) => {
      const updated = [...prev.variants];
      const item = { ...updated[index] };
      if (field === "stockQuantity") {
        item.stockQuantity = Math.max(0, parseInt(value.toString(), 10) || 0);
      } else {
        item[field] = value.toString();
      }
      updated[index] = item;
      return { ...prev, variants: updated };
    });
  }

  // Image upload and management helpers
  async function uploadFiles(files: FileList | File[]) {
    setUploadError(null);
    const validExtensions = [".jpg", ".jpeg", ".png"];
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    for (const f of fileArray) {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setUploadError(
          `Unsupported file format "${f.name}". Only JPG, JPEG, and PNG images are supported.`
        );
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setUploadError(
          `File "${f.name}" (${(f.size / (1024 * 1024)).toFixed(
            1
          )} MB) exceeds the 5 MB maximum limit.`
        );
        return;
      }
    }

    setIsUploading(true);

    try {
      const body = new FormData();
      fileArray.forEach((f) => body.append("files", f));

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Failed to upload image(s).");
        setIsUploading(false);
        return;
      }

      const newImages = data.files.map(
        (
          fileObj: { url: string; originalName: string },
          index: number
        ) => ({
          url: fileObj.url,
          altText:
            formData.name.trim() ||
            fileObj.originalName.replace(/\.[^/.]+$/, ""),
          isPrimary:
            formData.images.filter((img) => img.url).length === 0 &&
            index === 0,
        })
      );

      setFormData((prev) => {
        const currentValid = prev.images.filter(
          (img) => img.url.trim().length > 0
        );
        const hasPrimary = currentValid.some((img) => img.isPrimary);
        const updated = [...currentValid, ...newImages];
        if (!hasPrimary && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return {
          ...prev,
          images: updated,
        };
      });
    } catch {
      setUploadError("A network error occurred while uploading product images.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  }

  function handleSetPrimary(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      })),
    }));
  }

  function handleRemoveImage(index: number) {
    setFormData((prev) => {
      const updated = prev.images.filter((_, idx) => idx !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { ...prev, images: updated };
    });
  }

  function handleAltChange(index: number, newAlt: string) {
    setFormData((prev) => {
      const updated = [...prev.images];
      if (updated[index]) {
        updated[index] = { ...updated[index], altText: newAlt };
      }
      return { ...prev, images: updated };
    });
  }

  function handleAddManualUrl() {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const currentValid = prev.images.filter(
        (img) => img.url.trim().length > 0
      );
      const isFirst = currentValid.length === 0;
      return {
        ...prev,
        images: [
          ...currentValid,
          {
            url: trimmed,
            altText: manualAlt.trim() || prev.name.trim() || "Product photo",
            isPrimary: isFirst,
          },
        ],
      };
    });
    setManualUrl("");
    setManualAlt("");
    setShowManualUrlInput(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic client validation
    if (!formData.name.trim()) {
      setErrorMessage("Please enter a product name.");
      return;
    }

    if (!formData.slug.trim()) {
      setErrorMessage("Please enter a URL slug.");
      return;
    }

    if (!formData.categoryId) {
      setErrorMessage("Please select a category for this apparel product.");
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage("Please enter a valid non-negative selling price.");
      return;
    }

    const compareAtPriceNum = formData.compareAtPrice.trim()
      ? parseFloat(formData.compareAtPrice)
      : null;

    if (formData.variants.length === 0) {
      setErrorMessage("Please configure at least one size variant.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      sku: formData.sku.trim() || undefined,
      categoryId: formData.categoryId,
      description: formData.description.trim() || undefined,
      price: priceNum,
      compareAtPrice: compareAtPriceNum,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      images: formData.images
        .filter((img) => img.url.trim().length > 0)
        .map((img, idx) => ({
          id: img.id,
          url: img.url.trim(),
          altText: img.altText.trim() || formData.name.trim(),
          displayOrder: idx,
          isPrimary: img.isPrimary,
        })),
      variants: formData.variants.map((v) => ({
        id: v.id,
        size: v.size.trim(),
        color: v.color.trim() || undefined,
        stockQuantity: v.stockQuantity,
        sku: v.sku.trim() || undefined,
      })),
    };

    try {
      const endpoint = isEditing && initialData?.id
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error || "Failed to save product.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        isEditing
          ? `Product "${formData.name}" updated successfully.`
          : `Product "${formData.name}" created successfully.`
      );

      setIsSubmitting(false);

      // Redirect after short delay
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch {
      setErrorMessage("Network error while saving product to database.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] flex items-start gap-3 text-xs text-[#874F4C]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#F2F7F2] border border-[#D6E6D7] flex items-start gap-3 text-xs text-[#4A6B53]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{successMessage}</span>
        </div>
      )}

      {/* 1. Basic Product Information */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-7 shadow-warm-xs space-y-5">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#B88B58]" />
          <span>General Information</span>
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label htmlFor="prod-name" className="block font-medium text-[#2D2723] mb-1.5">
              Product Title <span className="text-[#874F4C]">*</span>
            </label>
            <input
              type="text"
              id="prod-name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Classic Linen Safari Shirt"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-slug" className="block font-medium text-[#2D2723] mb-1.5 flex items-center justify-between">
                <span>URL Slug <span className="text-[#874F4C]">*</span></span>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[10px] text-[#B88B58] hover:underline font-normal"
                >
                  {autoSlug ? "Manual Slug" : "Auto Slug"}
                </button>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#9E958C] font-mono">/shop/</span>
                <input
                  type="text"
                  id="prod-slug"
                  value={formData.slug}
                  disabled={autoSlug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                  }
                  placeholder="linen-safari-shirt"
                  required
                  className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] font-mono focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prod-category" className="block font-medium text-[#2D2723] mb-1.5">
                Category <span className="text-[#874F4C]">*</span>
              </label>
              <select
                id="prod-category"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-sku" className="block font-medium text-[#2D2723] mb-1.5">
                Master SKU <span className="text-[#9E958C] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="prod-sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="e.g. EZ-SHIRT-001"
                className="w-full px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] font-mono focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-desc" className="block font-medium text-[#2D2723] mb-1.5">
              Description <span className="text-[#9E958C] font-normal">(Optional)</span>
            </label>
            <textarea
              id="prod-desc"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the fabric, tailoring, feel, and silhouette..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* 2. Pricing and Storefront Visibility */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-7 shadow-warm-xs space-y-5">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] border-b border-[#ECEAE6] pb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#B88B58]" />
          <span>Pricing & Storefront Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label htmlFor="prod-price" className="block font-medium text-[#2D2723] mb-1.5">
              Selling Price (INR ₹) <span className="text-[#874F4C]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#786E65] font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                id="prod-price"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="1499.00"
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] font-semibold focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-compare" className="block font-medium text-[#2D2723] mb-1.5">
              Original / Compare-At Price (INR ₹) <span className="text-[#9E958C] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#9E958C]">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                id="prod-compare"
                value={formData.compareAtPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    compareAtPrice: e.target.value,
                  }))
                }
                placeholder="1999.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-[#ECEAE6] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="w-4 h-4 rounded text-[#B88B58] border-[#E8DFD8] focus:ring-[#B88B58]"
            />
            <div>
              <span className="font-semibold text-[#2D2723] block">
                Published on Customer Storefront
              </span>
              <span className="text-[11px] text-[#786E65] font-light block">
                When unchecked, the product is archived and hidden from customer catalogue.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
              }
              className="w-4 h-4 rounded text-[#B88B58] border-[#E8DFD8] focus:ring-[#B88B58]"
            />
            <div>
              <span className="font-semibold text-[#2D2723] block">
                Feature on Homepage &amp; Top Picks
              </span>
              <span className="text-[11px] text-[#786E65] font-light block">
                Highlights this apparel piece in curated banners and featured sections.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Product Photography & Images (Upload & Manage) */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-7 shadow-warm-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECEAE6] pb-4">
          <div>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#B88B58]" />
              <span>Product Photography &amp; Images</span>
            </h2>
            <p className="text-[11px] text-[#786E65] mt-1 font-light">
              Upload photos directly from your device (JPG, JPEG, PNG up to 5 MB). Choose one primary cover image.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] bg-[#2D2723] hover:bg-[#3C3530] transition-all shadow-warm-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Upload Product Images</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualUrlInput(!showManualUrlInput)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#786E65] bg-[#FAF7F2] hover:bg-[#F4EFEA] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
              title="Add image via external URL"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{showManualUrlInput ? "Hide URL Option" : "Add URL"}</span>
            </button>
          </div>
        </div>

        {/* Hidden File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleFileInputChange}
          className="hidden"
          id="product-image-file-input"
        />

        {/* Error notification for uploads */}
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] flex items-start justify-between gap-2.5 text-xs text-[#874F4C]">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="p-1 text-[#874F4C] hover:bg-[#F0D5D5] rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-[#B88B58] bg-[#F4EFEA] scale-[1.01]"
              : "border-[#E8DFD8] bg-[#FAF7F2] hover:border-[#B88B58] hover:bg-[#F4EFEA]/40"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#FFFDF9] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto shadow-warm-xs mb-3">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-[#2D2723]">
            {isUploading
              ? "Validating and uploading images..."
              : isDragging
              ? "Drop product images right here"
              : "Drag & drop product images here, or browse from computer"}
          </p>

          <p className="text-[11px] text-[#786E65] mt-1 font-light max-w-md mx-auto">
            Supported formats: <strong className="font-semibold text-[#5C534B]">JPG, JPEG, PNG</strong> (up to 5 MB per image). Select multiple files to upload simultaneously.
          </p>
        </div>

        {/* Optional Manual URL Input (for backward compatibility) */}
        {showManualUrlInput && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2D2723] uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#B88B58]" />
                <span>Attach External Image URL</span>
              </span>
              <span className="text-[10px] text-[#786E65]">Backward Compatible</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /images/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFDF9] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58]"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={manualAlt}
                  onChange={(e) => setManualAlt(e.target.value)}
                  placeholder="Alt caption"
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFDF9] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58]"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  disabled={!manualUrl.trim()}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium text-[#FAF7F2] bg-[#2D2723] hover:bg-[#3C3530] disabled:opacity-50 transition-colors"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded & Attached Images Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#786E65] pt-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#2D2723]">
              Attached Photography ({formData.images.length})
            </span>
            <span className="text-[11px]">
              {formData.images.length > 0
                ? "Mark one photo as Primary Cover"
                : "No images attached yet"}
            </span>
          </div>

          {formData.images.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#786E65] space-y-1">
              <Sparkles className="w-5 h-5 mx-auto text-[#B88B58] opacity-50 mb-1" />
              <p className="font-medium text-[#2D2723]">No product photos uploaded yet</p>
              <p className="text-[11px]">Use the upload area above to choose photos from your device.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {formData.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl bg-[#FAF7F2] border transition-all flex flex-col justify-between gap-3 ${
                    img.isPrimary
                      ? "border-[#B88B58] shadow-warm-xs ring-1 ring-[#B88B58]"
                      : "border-[#E8DFD8] hover:border-[#DDD4CA]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail Preview */}
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-[#F4EFEA] border border-[#E8DFD8] shrink-0">
                      <ProductImage
                        src={img.url}
                        alt={img.altText || "Product photo"}
                        fill
                        sizes="64px"
                        className="object-cover object-center"
                        fallbackText=""
                      />
                    </div>

                    {/* Metadata & Alt Input */}
                    <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-[#786E65] truncate max-w-[130px] block" title={img.url}>
                          {img.url.startsWith("/uploads/") ? img.url.split("/").pop() : img.url}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-md text-[#786E65] hover:text-[#874F4C] hover:bg-[#FAF0F0] transition-colors shrink-0"
                          title="Remove this photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={img.altText || ""}
                          onChange={(e) => handleAltChange(idx, e.target.value)}
                          placeholder="Alt description caption"
                          className="w-full px-2 py-1 rounded bg-[#FFFDF9] border border-[#E8DFD8] text-[11px] text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-1 focus:ring-[#B88B58]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Selector Control */}
                  <div className="pt-2 border-t border-[#ECEAE6] flex items-center justify-between">
                    {img.isPrimary ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#B88B58] text-[#FFFDF9]">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Primary Cover</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-[#786E65] bg-[#FFFDF9] hover:bg-[#F4EFEA] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
                      >
                        <Star className="w-3 h-3 text-[#B88B58]" />
                        <span>Set as Primary</span>
                      </button>
                    )}

                    <span className="text-[10px] text-[#9E958C] font-mono">
                      Photo #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Sizes & Inventory Variants */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-7 shadow-warm-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECEAE6] pb-3">
          <div>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[#2D2723] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B88B58]" />
              <span>Sizes &amp; Inventory Variants ({formData.variants.length})</span>
            </h2>
            <p className="text-[11px] text-[#786E65] mt-0.5 font-light">
              Each size maintains independent inventory to prevent overselling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddStandardSizes}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#786E65] bg-[#FAF7F2] hover:bg-[#F4EFEA] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
            >
              + Preset (XS–XXL)
            </button>
            <button
              type="button"
              onClick={handleAddVariantRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2D2723] bg-[#FAF7F2] hover:bg-[#F4EFEA] border border-[#E8DFD8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Add Size</span>
            </button>
          </div>
        </div>

        {/* Variants Grid / Rows */}
        <div className="space-y-3">
          {formData.variants.map((v, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
            >
              {/* Size */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase tracking-wider text-[#786E65] mb-1 font-semibold">
                  Size
                </label>
                <input
                  type="text"
                  value={v.size}
                  onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                  placeholder="e.g. M, 32, Free Size"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFDF9] border border-[#E8DFD8] text-xs text-[#2D2723] font-semibold focus:outline-none focus:ring-2 focus:ring-[#B88B58]"
                />
              </div>

              {/* Color */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase tracking-wider text-[#786E65] mb-1 font-semibold">
                  Color / Shade
                </label>
                <input
                  type="text"
                  value={v.color}
                  onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                  placeholder="e.g. Soft Cream"
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFDF9] border border-[#E8DFD8] text-xs text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58]"
                />
              </div>

              {/* Stock Quantity */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase tracking-wider text-[#786E65] mb-1 font-semibold">
                  Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={v.stockQuantity}
                  onChange={(e) =>
                    handleVariantChange(idx, "stockQuantity", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFDF9] border border-[#E8DFD8] text-xs text-[#2D2723] font-mono focus:outline-none focus:ring-2 focus:ring-[#B88B58]"
                />
              </div>

              {/* Variant SKU */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-[#786E65] mb-1 font-semibold">
                  SKU
                </label>
                <input
                  type="text"
                  value={v.sku}
                  onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFDF9] border border-[#E8DFD8] text-xs text-[#2D2723] font-mono focus:outline-none focus:ring-2 focus:ring-[#B88B58]"
                />
              </div>

              {/* Delete Variant Button */}
              <div className="sm:col-span-1 flex items-end justify-end pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(idx)}
                  className="p-2 rounded-lg text-[#786E65] hover:text-[#874F4C] hover:bg-[#FAF0F0] transition-colors"
                  title="Remove variant"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Sticky Bottom Form Actions Bar */}
      <div className="sticky bottom-4 z-20 rounded-2xl bg-[#FFFDF9]/95 backdrop-blur border border-[#E8DFD8] p-4 shadow-warm-md flex items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-[#786E65] bg-[#FAF7F2] hover:bg-[#F4EFEA] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel &amp; Return</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-sm flex items-center gap-2 ${
            isSubmitting
              ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
              : "bg-[#2D2723] hover:bg-[#3C3530] hover:shadow-warm-md active:scale-[0.99]"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#786E65] border-t-transparent rounded-full animate-spin" />
              <span>Saving Product...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? "Save Changes" : "Publish Product"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
