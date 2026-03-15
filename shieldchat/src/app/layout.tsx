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
    default: "ShieldChat — 크리에이터를 위한 악성 댓글 방패",
    template: "%s | ShieldChat",
  },
  description: "악성 댓글 수집, 독성 분석, 증거 보존, 법적 대응 가이드까지. 크리에이터를 위한 악플 방어 도구.",
  keywords: ["악성댓글", "악플", "크리에이터", "증거보존", "사이버명예훼손", "법적대응"],
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
