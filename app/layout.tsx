import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "Stalenballen Cup",
  description: "Maak een poule aan en voorspel alle WK wedstrijden",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stalenballen Cup",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} h-full bg-zinc-950`}>
      <head>
        <meta name="theme-color" content="#09090b" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-zinc-950 font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
