import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import GlobalPresence from "./components/GlobalPresence";
import VersionMonitor from "./components/VersionMonitor";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Little Library",
  description: "A private collection of slow things. Curated photography, design, and literature.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Little Library",
    description: "A private collection of slow things.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${lato.variable} antialiased`}>
        <VersionMonitor />
        <GlobalPresence />
        {children}
      </body>
    </html>
  );
}
