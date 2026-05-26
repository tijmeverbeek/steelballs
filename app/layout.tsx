import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Steelballs",
  description: "Maak een poule aan en voorspel alle WK wedstrijden",
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} h-full bg-zinc-950`}>
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="min-h-full bg-zinc-950 font-sans antialiased">{children}</body>
    </html>
  );
}
