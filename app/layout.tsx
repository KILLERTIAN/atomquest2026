import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// JetBrains Mono via local Google Fonts fallback
const jetbrainsMono = localFont({
  src: [
    { path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "AtomQuest 2026 — Goal Tracking Portal",
  description: "Atomberg's internal goal setting and tracking platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${geist.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
