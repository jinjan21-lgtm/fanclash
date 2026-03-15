import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://fanclash.co.kr"),
  title: {
    default: "FanClash — 스트리머 팬 인터랙션 도구",
    template: "%s | FanClash",
  },
  description: "후원 랭킹, 배틀, 룰렛 등 방송 위젯으로 시청자 참여를 극대화하세요. 투네이션, 틱톡, 치지직, 숲 연동.",
  keywords: ["스트리머", "방송 위젯", "후원 랭킹", "도네이션 배틀", "OBS 위젯", "투네이션", "치지직", "숲", "틱톡 라이브"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "FanClash",
    title: "FanClash — 스트리머 팬 인터랙션 도구",
    description: "후원 랭킹, 배틀, 룰렛 등 방송 위젯으로 시청자 참여를 극대화하세요.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "FanClash" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FanClash — 스트리머 팬 인터랙션 도구",
    description: "후원 랭킹, 배틀, 룰렛 등 방송 위젯으로 시청자 참여를 극대화하세요.",
    images: ["/og-image.svg"],
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
