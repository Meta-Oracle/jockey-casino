import type { Metadata } from "next";
import { Bebas_Neue, Figtree } from "next/font/google";
import "./globals.css";
import { TOKEN } from "@/lib/token";

const display = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${TOKEN.name} Casino — SVG Racing Utility Token`,
  description: `${TOKEN.ticker} on Solana. Breed, upgrade, and race animated horses. Utility token CA ${TOKEN.ca}`,
  openGraph: {
    title: `${TOKEN.ticker} · Jockey Casino`,
    description:
      "SVG-animated horse racing casino. Customize breeds, silks, upgrades — powered by JOCKEY on Solana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
