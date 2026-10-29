"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AdminSettingsFormsProps {
  initialEmail: string;
  adminName: string;
  adminRole: string;
}

export default function AdminSettingsForms({
  initialEmail,
  adminName,
  adminRole,
}: AdminSettingsFormsProps) {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState(initialEmail);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [emailStatus, setEmailStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({
    loading: false,
    error: null,
    success: null,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({
    loading: false,
    error: null,
    success: null,
  });

  // Handle email update
  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus({ loading: true, error: null, success: null });

    if (!emailForm.newEmail.trim()) {
      setEmailStatus({
        loading: false,
        error: "Please enter your new email address.",
        success: null,
      });
      return;
    }

    if (!emailForm.currentPassword) {
      setEmailStatus({
        loading: false,
        error: "Current password is required to authorize changing your email.",
        success: null,
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_email",
          newEmail: emailForm.newEmail.trim(),
          currentPassword: emailForm.currentPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setEmailStatus({
          loading: false,
          error: data.error || "Failed to update email address.",
          success: null,
        });
        return;
      }

      setCurrentEmail(data.newEmail || emailForm.newEmail.trim());
      setEmailForm({ newEmail: "", currentPassword: "" });
      setEmailStatus({
        loading: false,
        error: null,
        success: "Administrator email updated successfully.",
      });
      router.refresh();
    } catch {
      setEmailStatus({
        loading: false,
        error: "Network error while updating email. Please try again.",
        success: null,
      });
    }
  }

  // Handle password update
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: null, success: null });

    if (!passwordForm.currentPassword) {
      setPasswordStatus({
        loading: false,
        error: "Please enter your current password.",
        success: null,
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({
        loading: false,
        error: "New password must be at least 8 characters long.",
        success: null,
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordStatus({
        loading: false,
        error: "New passwords do not match. Please re-enter confirmation password.",
        success: null,
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_password",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPasswordStatus({
          loading: false,
          error: data.error || "Failed to update password.",
          success: null,
        });
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordStatus({
        loading: false,
        error: null,
        success: "Administrator password updated successfully.",
      });
    } catch {
      setPasswordStatus({
        loading: false,
        error: "Network error while updating password. Please try again.",
        success: null,
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-5 sm:p-6 shadow-warm-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#2D2723]">{adminName}</h2>
            <div className="flex items-center gap-2 text-xs text-[#786E65] mt-0.5">
              <span className="font-mono">{currentEmail}</span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58]">
                {adminRole}
              </span>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-[#786E65] bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E8DFD8] self-start sm:self-auto">
          Security policy: Any credential modification requires current password verification.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Change Email Form */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#ECEAE6]">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2723]">Change Email Address</h3>
              <p className="text-[11px] text-[#786E65]">Update your login and notification email</p>
            </div>
          </div>

          {emailStatus.error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{emailStatus.error}</span>
            </div>
          )}

          {emailStatus.success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F2F7F2] border border-[#D6E6D7] text-xs text-[#4A6B53]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{emailStatus.success}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#786E65] mb-1">
                Current Registered Email
              </label>
              <input
                type="email"
                value={currentEmail}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#E8DFD8] text-xs text-[#786E65] font-mono opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="new-email" className="block font-medium text-[#2D2723] mb-1">
                New Email Address <span className="text-[#874F4C]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="new-email"
                  value={emailForm.newEmail}
                  onChange={(e) =>
                    setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))
                  }
                  placeholder="new-admin@ezone4u.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                />
                <Mail className="w-3.5 h-3.5 text-[#786E65] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label
                htmlFor="current-password-email"
                className="block font-medium text-[#2D2723] mb-1"
              >
                Current Password <span className="text-[#874F4C]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="current-password-email"
                  value={emailForm.currentPassword}
                  onChange={(e) =>
                    setEmailForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password to authorize"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                />
                <KeyRound className="w-3.5 h-3.5 text-[#786E65] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={emailStatus.loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-xs flex items-center justify-center gap-2 ${
                emailStatus.loading
                  ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
                  : "bg-[#2D2723] hover:bg-[#3C3530]"
              }`}
            >
              {emailStatus.loading ? (
                <span>Updating Email...</span>
              ) : (
                <>
                  <span>Save Email Address</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 2. Change Password Form */}
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 shadow-warm-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#ECEAE6]">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2723]">Change Password</h3>
              <p className="text-[11px] text-[#786E65]">Update password with scrypt encryption</p>
            </div>
          </div>

          {passwordStatus.error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordStatus.error}</span>
            </div>
          )}

          {passwordStatus.success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F2F7F2] border border-[#D6E6D7] text-xs text-[#4A6B53]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordStatus.success}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label
                htmlFor="current-password-pass"
                className="block font-medium text-[#2D2723] mb-1"
              >
                Current Password <span className="text-[#874F4C]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="current-password-pass"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                />
                <KeyRound className="w-3.5 h-3.5 text-[#786E65] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block font-medium text-[#2D2723] mb-1"
              >
                New Password <span className="text-[#874F4C]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                />
                <Lock className="w-3.5 h-3.5 text-[#786E65] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block font-medium text-[#2D2723] mb-1"
              >
                Confirm New Password <span className="text-[#874F4C]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirm-new-password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  placeholder="Re-enter new password"
                  required
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                />
                <Lock className="w-3.5 h-3.5 text-[#786E65] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordStatus.loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-xs flex items-center justify-center gap-2 ${
                passwordStatus.loading
                  ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
                  : "bg-[#2D2723] hover:bg-[#3C3530]"
              }`}
            >
              {passwordStatus.loading ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
