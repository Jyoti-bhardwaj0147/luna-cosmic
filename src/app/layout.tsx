import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-VariableFont_opsz,wght.ttf",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const cormorantGaramond = localFont({
  src: "./fonts/CormorantGaramond-VariableFont_wght.ttf",
  variable: "--font-cormorant",
  weight: "300 700",
  display: "swap",
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
    <html
      lang="en"
      className={`${inter.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
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
