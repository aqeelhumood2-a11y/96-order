import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/config/site";
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
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "A premium coffee and equipment e-commerce platform.",
  openGraph: {
    title: SITE_NAME,
    description: "A premium coffee and equipment e-commerce platform.",
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "A premium coffee and equipment e-commerce platform.",
    images: ["/brand/og-default.png"],
  },
};

// The primary-600 brand purple — matches the browser chrome (mobile address
// bar, PWA splash) to the logo background rather than the OS default.
export const viewport = {
  themeColor: "#52346a",
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
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
