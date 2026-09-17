import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Luna Cosmic Violet",
    template: "%s | Luna Cosmic Violet",
  },
  description: "A local lunar calendar for Moon phase, illumination, age, and nearby major phases.",
  applicationName: "Luna Cosmic Violet",
  openGraph: {
    title: "Luna Cosmic Violet",
    description: "Explore lunar phases with local calendar-date calculations.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body>
        <div className="cosmic-shell">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
