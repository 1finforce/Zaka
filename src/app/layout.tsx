import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"] });
export const metadata: Metadata = { title: "Zaka", description: "Expense allowances" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${manrope.variable} ${fraunces.variable} font-sans`}>{children}</body></html>;
}
