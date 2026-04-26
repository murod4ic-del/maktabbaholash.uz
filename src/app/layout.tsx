import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MaktabBaholash - Maktab baholash tizimi",
  description:
    "O'zbekiston maktablari uchun zamonaviy baholash va monitoring tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-inter)] bg-gray-50">
        {children}
      </body>
    </html>
  );
}
