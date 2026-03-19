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
  title: "Latlas アカウント管理",
  description: "ログイン情報とプロフィールの編集",
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('dashboard-theme');
    document.documentElement.classList.add('dashboard-theme-root');
    document.documentElement.setAttribute('data-theme', (t === 'dark' || t === 'light') ? t : 'light');
  } catch (e) {
    document.documentElement.classList.add('dashboard-theme-root');
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
