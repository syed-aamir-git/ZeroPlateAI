import type { Metadata } from "next";
import "./globals.css";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZeroPlate.ai — Food Waste Reduction & Redistribution",
  description:
    "AI-powered smart food waste reduction & sustainable redistribution ecosystem for institutional kitchens and food processing units.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

import ZeroPlateAiChat from "@/components/ai/zeroplate-ai-chat";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        fraunces.variable,
        ibmPlexSans.variable,
        ibmPlexMono.variable
      )}
    >
      <body className="min-h-screen antialiased bg-ledger-paper text-ink relative">
        {children}
        <ZeroPlateAiChat />
      </body>
    </html>
  );
}
