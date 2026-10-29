"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  FolderTree,
  Search,
} from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
  _count: {
    products: number;
  };
}

interface CategoryManagementProps {
  initialCategories: CategoryItem[];
}

export default function CategoryManagement({
  initialCategories,
}: CategoryManagementProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");

  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setNewName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setNewSlug(generated);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCreateError(data.error || "Failed to create category.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Category "${data.category.name}" created successfully.`);
      setNewName("");
      setNewSlug("");
      setIsCreating(false);
      setIsSubmitting(false);
      router.refresh();
      // Update local state
      setCategories((prev) => [
        ...prev,
        { ...data.category, _count: { products: 0 } },
      ]);
    } catch {
      setCreateError("Network error. Could not create category.");
      setIsSubmitting(false);
    }
  }

  function startEdit(cat: CategoryItem) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setEditError(data.error || "Failed to update category.");
        return;
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName, slug: editSlug } : c))
      );
      setEditingId(null);
      setSuccessMessage(`Category updated successfully.`);
      router.refresh();
    } catch {
      setEditError("Network error. Could not update category.");
    }
  }

  async function handleDelete(cat: CategoryItem) {
    if (cat._count.products > 0) {
      alert(
        `Cannot delete "${cat.name}" because it contains ${cat._count.products} product(s). Reassign products first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete category.");
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setSuccessMessage(`Category "${cat.name}" deleted.`);
      router.refresh();
    } catch {
      alert("Network error. Could not delete category.");
    }
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#E2EAE2] border border-[#D0E2D0] text-[#4A634E] text-xs flex items-center justify-between shadow-warm-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-[#D0E2D0] rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFDF9] border border-[#E8DFD8] p-5 rounded-2xl shadow-warm-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#786E65] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(!isCreating);
            setCreateError(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D2723] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium hover:bg-[#3C3530] transition-colors shadow-warm-xs shrink-0"
        >
          {isCreating ? (
            <>
              <X className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-[#B88B58]" />
              <span>Add New Category</span>
            </>
          )}
        </button>
      </div>

      {/* Create Category Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#B88B58]/40 shadow-warm-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2 border-b border-[#ECEAE6] pb-3">
            <FolderTree className="w-4 h-4 text-[#B88B58]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2D2723]">
              Create New Category
            </h3>
          </div>

          {createError && (
            <div className="p-3 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2D2723] mb-1">
                Category Name <span className="text-[#874F4C]">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Linen Shirts, Casual Jackets"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2D2723] mb-1">
                URL Slug <span className="text-[#874F4C]">*</span>
              </label>
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. linen-shirts"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm font-mono text-[#2D2723] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#786E65] hover:text-[#2D2723] bg-[#FAF7F2] border border-[#E8DFD8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] bg-[#2D2723] hover:bg-[#3C3530] transition-colors shadow-warm-xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving Category..." : "Save Category"}
            </button>
          </div>
        </form>
      )}

      {/* Categories Table / List */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] shadow-warm-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ECEAE6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#B88B58]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2D2723]">
              Categories Directory ({filteredCategories.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#ECEAE6] bg-[#FAF7F2] text-[#786E65] uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4 sm:px-6">Category Name</th>
                <th className="py-3 px-4">URL Slug</th>
                <th className="py-3 px-4 text-center">Assigned Products</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEAE6]">
              {filteredCategories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#FAF7F2]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-[#2D2723]">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#B88B58] text-xs text-[#2D2723] w-full max-w-xs focus:outline-none"
                          />
                          {editError && (
                            <p className="text-[10px] text-[#874F4C]">{editError}</p>
                          )}
                        </div>
                      ) : (
                        <span>{cat.name}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#786E65]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#B88B58] text-xs font-mono text-[#2D2723] w-full max-w-xs focus:outline-none"
                        />
                      ) : (
                        <span>/shop?category={cat.slug}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF7F2] text-[#5C534B] border border-[#E8DFD8]">
                        {cat._count.products}{" "}
                        {cat._count.products === 1 ? "product" : "products"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1.5 rounded-lg bg-[#2D2723] text-[#FAF7F2] hover:bg-[#3C3530] transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#786E65] hover:text-[#2D2723] border border-[#E8DFD8] transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2D2723] hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8DFD8] transition-colors"
                            title="Edit category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg text-[#786E65] hover:text-[#874F4C] hover:bg-[#F9EBEA] border border-transparent hover:border-[#E8DFD8] transition-colors"
                            title={
                              cat._count.products > 0
                                ? "Cannot delete category with products"
                                : "Delete category"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

