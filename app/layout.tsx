import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poke Hanoi — Đặt món theo calo",
  description:
    "Tự build poke bowl theo mục tiêu calo, xem dinh dưỡng realtime, có AI tư vấn dinh dưỡng.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0E7264",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body className="min-h-[100dvh] bg-sand font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
