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
  title: "Latlas Account",
  description: "ログイン情報とプロフィールの編集",
};

const themeInitScript = `
(function(){
  function systemTheme() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e2) {
      return 'light';
    }
  }
  try {
    var t = localStorage.getItem('dashboard-theme');
    document.documentElement.classList.add('dashboard-theme-root');
    var resolved = (t === 'dark' || t === 'light') ? t : systemTheme();
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.classList.add('dashboard-theme-root');
    document.documentElement.setAttribute('data-theme', systemTheme());
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
