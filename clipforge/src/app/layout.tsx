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
  title: {
    default: "ClipForge — 방송 하이라이트 자동 숏폼 변환",
    template: "%s | ClipForge",
  },
  description: "방송 하이라이트를 자동으로 감지하고 TikTok/YouTube Shorts용 세로 클립을 생성하세요.",
  keywords: ["클립", "숏폼", "하이라이트", "스트리머", "틱톡", "유튜브 쇼츠", "자동화"],
  openGraph: {
    title: "ClipForge — 방송 하이라이트 자동 숏폼 변환",
    description: "방송 하이라이트를 자동으로 감지하고 TikTok/YouTube Shorts용 세로 클립을 생성하세요.",
    type: "website",
  },
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
