import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import StorefrontShell from "@/components/layout/StorefrontShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ezone4u | Contemporary Clothing & Fashion",
  description:
    "Curated contemporary fashion with effortless elegance. Premium clothing collection designed for comfort and style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#2D2723]">
        <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
          <StorefrontShell>{children}</StorefrontShell>
        </Suspense>
      </body>
    </html>
  );
}
