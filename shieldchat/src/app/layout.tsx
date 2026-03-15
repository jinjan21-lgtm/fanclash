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
  metadataBase: new URL("https://shieldchat.vercel.app"),
  title: {
    default: "ShieldChat — 크리에이터를 위한 악성 댓글 방패",
    template: "%s | ShieldChat",
  },
  description: "악성 댓글 수집, 독성 분석, 증거 보존, 법적 대응 가이드까지. 크리에이터를 위한 악플 방어 도구. 한국어 욕설, 협박, 명예훼손 자동 감지.",
  keywords: ["악성댓글", "악플", "크리에이터", "증거보존", "사이버명예훼손", "법적대응", "악플 분석", "독성 감지"],
  alternates: {
    canonical: "https://shieldchat.vercel.app",
  },
  openGraph: {
    title: "ShieldChat — 크리에이터를 위한 악성 댓글 방패",
    description: "악성 댓글 수집, 독성 분석, 증거 보존, 법적 대응 가이드까지.",
    type: "website",
    locale: "ko_KR",
    siteName: "ShieldChat",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShieldChat — 크리에이터를 위한 악성 댓글 방패",
    description: "크리에이터를 위한 악플 방어 도구. 증거 수집부터 법적 대응까지.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
