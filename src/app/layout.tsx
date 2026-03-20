import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AccountThemeRoot } from "@/components/AccountThemeRoot";
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

/** OS のライト/ダークのみ（localStorage の dashboard-theme は参照しない） */
/** 先頭で一度だけ data-theme を付与（React バンドルより前の初回ペイント用）。変更監視は AccountThemeRoot。 */
const themeInitScript = `
(function(){
  try {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full dashboard-theme-root`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full antialiased">
        <AccountThemeRoot />
        {children}
      </body>
    </html>
  );
}
