import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./content-responsive.css";
import "./header-responsive.css";
import "./auth.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#faf9f7'};

export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  title: "CropShield · Disease & Pest Screening",
  description: "A photo-first disease, pest screening, and crop monitoring workspace for Ja-ron Fish Farm in Solana, Cagayan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
