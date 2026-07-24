import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Archive44 — The Memory Layer of Crypto",
    template: "%s | Archive44",
  },
  description:
    "AI-powered crypto intelligence platform that permanently archives and organizes wallets, tokens, founders, DAOs, governance, contracts, social history, and blockchain activity.",
  keywords: [
    "crypto",
    "blockchain",
    "AI",
    "wallet intelligence",
    "token analytics",
    "DAO governance",
    "on-chain data",
    "crypto search",
  ],
  authors: [{ name: "Archive44" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://archive44.com",
    siteName: "Archive44",
    title: "Archive44 — The Memory Layer of Crypto",
    description:
      "Search every wallet, token, founder, protocol, DAO and on-chain event with AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Archive44 — The Memory Layer of Crypto",
    description:
      "Search every wallet, token, founder, protocol, DAO and on-chain event with AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0c2a54",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
