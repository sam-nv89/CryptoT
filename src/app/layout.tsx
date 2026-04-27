import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        {/* Ambient background glow */}
        <div className="ambient-glow" />

        {/* Sidebar */}
        <Sidebar />

        {/* Main content (pushed right by sidebar on desktop) */}
        <main className="flex-1 lg:ml-[260px] relative z-10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
