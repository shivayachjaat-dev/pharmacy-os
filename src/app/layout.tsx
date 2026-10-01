import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PharmacyOS — Enterprise Pharmacy Operating System",
  description: "Next-generation multi-store pharmacy management, shelf intelligence, POS, and customer ordering system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
