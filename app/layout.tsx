import type { Metadata } from "next";
import { Bebas_Neue, Figtree } from "next/font/google";
import "./globals.css";
import { TOKEN } from "@/lib/token";
import SolanaProviders from "@/components/SolanaProviders";

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
  title: `${TOKEN.name} Casino — Live PvP Utility Token`,
  description: `${TOKEN.ticker} on Solana. Live PvP betting, upgrades, and treasury-routed utility. CA ${TOKEN.ca}`,
  openGraph: {
    title: `${TOKEN.ticker} · Jockey Casino`,
    description:
      "Live PvP horse racing casino. Real $JOCKEY economy — spends route to treasury.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}
