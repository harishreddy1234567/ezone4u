"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";

interface AdminRegisterFormProps {
  initialAllowed: boolean;
}

export default function AdminRegisterForm({
  initialAllowed,
}: AdminRegisterFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(!initialAllowed);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please provide a valid administrator email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your confirmation password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.registrationClosed || response.status === 403) {
          setIsBlocked(true);
        }
        setError(data.error || "Registration could not be completed.");
        setIsLoading(false);
        return;
      }

      setSuccess(
        "Administrator account registered successfully! Redirecting to sign in..."
      );
      setIsLoading(false);

      setTimeout(() => {
        router.push("/admin/login?registered=1");
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error connecting to server. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto shadow-warm-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-3xl text-[#2D2723] tracking-wide font-normal">
            Ezone4u Admin
          </h1>
          <p className="text-xs text-[#786E65] uppercase tracking-wider font-medium">
            Administrator Registration
          </p>
        </div>

        {/* Blocked State: When an admin already exists */}
        {isBlocked ? (
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-8 shadow-warm-md text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8DFD8] text-[#B88B58] flex items-center justify-center mx-auto">
              <LockKeyhole className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-xl text-[#2D2723]">
                Registration Closed
              </h2>
              <p className="text-xs text-[#786E65] leading-relaxed">
                An administrator account is already established for Ezone4u. Public registration is permanently closed to protect administrative operations.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Link
                href="/admin/login"
                className="w-full py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] bg-[#2D2723] hover:bg-[#3C3530] transition-all shadow-warm-sm flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/"
                className="inline-block text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
              >
                &larr; Return to Storefront
              </Link>
            </div>
          </div>
        ) : (
          /* Active Registration Form */
          <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-8 shadow-warm-md space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F2F7F2] border border-[#D6E6D7] text-xs text-[#4A6B53]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="admin-name"
                  className="block text-xs font-medium text-[#2D2723] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="admin-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Darshan M"
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                  <User className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-[#2D2723] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="admin-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ezone4u.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-medium text-[#2D2723] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="admin-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-xs font-medium text-[#2D2723] mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="admin-confirm-password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || Boolean(success)}
                className={`w-full py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-sm flex items-center justify-center gap-2 ${
                  isLoading || Boolean(success)
                    ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
                    : "bg-[#2D2723] hover:bg-[#3C3530] hover:shadow-warm-md active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#786E65] border-t-transparent rounded-full animate-spin" />
                    <span>Registering Administrator...</span>
                  </>
                ) : (
                  <>
                    <span>Register Administrator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Navigation Links */}
            <div className="pt-4 border-t border-[#ECEAE6] flex flex-col items-center gap-2.5 text-center">
              <Link
                href="/admin/login"
                className="text-xs text-[#B88B58] hover:text-[#2D2723] font-medium transition-colors"
              >
                Already registered? Sign In
              </Link>
              <Link
                href="/"
                className="text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
              >
                &larr; Return to Storefront
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
