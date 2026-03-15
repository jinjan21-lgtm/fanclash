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
  title: "진크루 — 크리에이터 프로덕트",
  description: "크리에이터를 위한 올인원 툴킷. FanClash, ClipForge, ShieldChat으로 방송을 더 강력하게.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "진크루",
    title: "진크루 — 크리에이터 프로덕트",
    description: "크리에이터를 위한 올인원 툴킷. FanClash, ClipForge, ShieldChat으로 방송을 더 강력하게.",
  },
  twitter: {
    card: "summary_large_image",
    title: "진크루 — 크리에이터 프로덕트",
    description: "크리에이터를 위한 올인원 툴킷.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
