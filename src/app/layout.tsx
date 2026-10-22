import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageLoader } from "@/components/layout/PageLoader";
import { siteUrl } from "./site-url";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = localFont({
  src: "./fonts/Inter-VariableFont_opsz,wght.ttf",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: false,
});

const cormorantGaramond = localFont({
  src: "./fonts/CormorantGaramond-VariableFont_wght.ttf",
  variable: "--font-cormorant",
  weight: "300 700",
  display: "swap",
});

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Luna Cosmic",
    template: "%s | Luna Cosmic",
  },
  description: "A local lunar calendar for Moon phase, illumination, age, and nearby major phases.",
  applicationName: "Luna Cosmic",
  openGraph: {
    title: "Luna Cosmic",
    description: "Explore lunar phases with local calendar-date calculations.",
    type: "website",
    siteName: "Luna Cosmic",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, cormorantGaramond.variable, "font-sans", geist.variable)}
    >
      <body>
        {siteUrl && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Luna Cosmic", url: siteUrl, description: "A local lunar calendar for Moon phase, illumination, age, and nearby major phases." }).replace(/</g, "\\u003c") }} />}
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <PageLoader />
        <noscript><style>{`.luna-page-loader { display: none; }`}</style></noscript>
        <div className="cosmic-shell" id="luna-page-content">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
