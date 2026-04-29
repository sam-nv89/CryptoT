import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CryptoTracker — Спреды и Фандинги в реальном времени",
  description:
    "Мониторинг cross-exchange спредов и funding rates между CEX и DEX биржами. Binance, Bybit, OKX, Hyperliquid.",
  keywords: [
    "crypto",
    "spread",
    "funding rate",
    "arbitrage",
    "trading",
    "binance",
    "bybit",
    "hyperliquid",
  ],
};

import { Shell } from "@/components/layout/Shell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {/* Ambient background glow */}
        <div className="ambient-glow" />

        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
