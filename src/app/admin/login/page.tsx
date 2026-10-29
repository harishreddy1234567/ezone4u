"use client";

import React, { useState, useSyncExternalStore, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const emptySubscribe = () => () => {};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isJustRegistered = searchParams.get("registered") === "1";

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Invalid credentials. Please verify your details.");
        setIsLoading(false);
        return;
      }

      router.push("/admin/orders");
      router.refresh();
    } catch {
      setError("Network error while connecting to server. Please try again.");
      setIsLoading(false);
    }
  }

  return (
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
          Order Management &amp; Operations Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] p-6 sm:p-8 shadow-warm-md space-y-5">
        {!isMounted ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-[#EDE6DD] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-[#EDE6DD] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl" />
            </div>
            <div className="h-11 w-full bg-[#2D2723] opacity-80 rounded-xl" />
            <div className="pt-4 border-t border-[#ECEAE6] flex flex-col items-center gap-2">
              <div className="h-3 w-44 bg-[#EDE6DD] rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {isJustRegistered && !error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F2F7F2] border border-[#D6E6D7] text-xs text-[#4A6B53]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">
                  Administrator account created successfully! Please sign in with your credentials.
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F9EBEA] border border-[#E8DFD8] text-xs text-[#874F4C]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-[#2D2723] mb-1.5"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="admin-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ezone4u.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
                </div>
              </div>

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
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD8] text-xs sm:text-sm text-[#2D2723] placeholder-[#9E958C] focus:outline-none focus:ring-2 focus:ring-[#B88B58] transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#786E65] absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider font-medium text-[#FAF7F2] transition-all shadow-warm-sm flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-[#DDD4CA] text-[#786E65] cursor-wait"
                    : "bg-[#2D2723] hover:bg-[#3C3530] hover:shadow-warm-md active:scale-[0.99]"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#786E65] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Links Area */}
            <div className="pt-4 border-t border-[#ECEAE6] flex flex-col items-center gap-2.5 text-center">
              <Link
                href="/admin/register"
                className="text-xs text-[#B88B58] hover:text-[#2D2723] font-medium transition-colors"
              >
                First time here? Register Administrator
              </Link>
              <Link
                href="/"
                className="text-xs text-[#786E65] hover:text-[#2D2723] transition-colors"
              >
                &larr; Return to Storefront
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD8] text-center text-xs text-[#786E65]">
            <div className="w-6 h-6 border-2 border-[#B88B58] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
