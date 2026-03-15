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
  metadataBase: new URL("https://clipforge.vercel.app"),
  title: {
    default: "ClipForge — 방송 하이라이트 자동 숏폼 변환",
    template: "%s | ClipForge",
  },
  description: "방송 하이라이트를 자동으로 감지하고 TikTok/YouTube Shorts용 세로 클립을 생성하세요. AI 오디오 분석으로 최적 구간을 찾아냅니다.",
  keywords: ["클립", "숏폼", "하이라이트", "스트리머", "틱톡", "유튜브 쇼츠", "자동화", "방송 편집", "클립 추출"],
  alternates: {
    canonical: "https://clipforge.vercel.app",
  },
  openGraph: {
    title: "ClipForge — 방송 하이라이트 자동 숏폼 변환",
    description: "방송 하이라이트를 자동으로 감지하고 TikTok/YouTube Shorts용 세로 클립을 생성하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "ClipForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipForge — 방송 하이라이트 자동 숏폼 변환",
    description: "AI 오디오 분석으로 하이라이트를 자동 감지하고 숏폼 클립을 생성하세요.",
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
