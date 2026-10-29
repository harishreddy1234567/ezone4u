import React, { Suspense } from "react";
import Link from "next/link";
import {
  Store,
  Truck,
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { requireAdminSession } from "@/lib/admin-auth";
import { STORE_CONFIG, formatINR } from "@/lib/constants";
import AdminSettingsForms from "@/components/admin/AdminSettingsForms";

export const metadata = {
  title: "Administrator Settings | Ezone4u Operations",
  description: "Manage administrator email credentials, passwords, and security controls.",
};

async function AdminSettingsContent() {
  const session = await requireAdminSession();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Orders</span>
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2D2723] tracking-wide font-normal">
            Administrator Settings
          </h1>
          <p className="text-xs text-[#786E65] mt-1 font-light">
            Manage your administrator credentials, email address, password security, and store parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#E8DFD8] text-xs font-medium text-[#2D2723] hover:bg-[#F4EFEA] transition-colors shadow-warm-xs"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#B88B58]" />
          </Link>
        </div>
      </div>

      {/* Primary: Email and Password Update Forms with Current Password Verification */}
      <AdminSettingsForms
        initialEmail={session.email}
        adminName={session.name}
        adminRole={session.role}
      />

      {/* Secondary: Store Profile & Fulfillment Reference */}
      <div className="pt-6 border-t border-[#E8DFD8]">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#786E65] mb-4">
          Store Information &amp; Operational Defaults
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storefront Identity */}
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#ECEAE6]">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#2D2723]">Store Profile</h3>
                <p className="text-[11px] text-[#786E65]">Public brand and contact identity</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#FAF7F2]">
                <span className="text-[#786E65]">Brand Name</span>
                <span className="font-medium text-[#2D2723]">Ezone4u Contemporary Clothing</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#FAF7F2]">
                <span className="text-[#786E65]">Support Email</span>
                <span className="font-medium text-[#2D2723] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#B88B58]" />
                  care@ezone4u.com
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#786E65]">Support Phone</span>
                <span className="font-medium text-[#2D2723] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#B88B58]" />
                  +91 98765 43210
                </span>
              </div>
            </div>
          </div>

          {/* Fulfillment & Shipping */}
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#ECEAE6]">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#2D2723]">Fulfillment &amp; Checkout</h3>
                <p className="text-[11px] text-[#786E65]">Customer order delivery rules</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#FAF7F2]">
                <span className="text-[#786E65]">Payment Method</span>
                <span className="px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD8] font-medium text-[#2D2723]">
                  Cash on Delivery (COD) Only
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#FAF7F2]">
                <span className="text-[#786E65]">Delivery Fee</span>
                <span className="font-semibold text-[#B88B58]">
                  {formatINR(STORE_CONFIG.SHIPPING_FEE)} Flat Rate
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#786E65]">Guest Checkout</span>
                <span className="inline-flex items-center gap-1.5 text-[#52796F] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#52796F]" />
                  Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#B88B58] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
