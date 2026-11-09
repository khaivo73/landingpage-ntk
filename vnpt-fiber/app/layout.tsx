import type { Metadata, Viewport } from "next";
import "./globals.css";
const origin =
  process.env.SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
const indexable =
  process.env.SITE_INDEXABLE === "true" && Boolean(process.env.SITE_URL);
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0064df",
};
export const metadata: Metadata = {
  metadataBase: origin ? new URL(origin) : undefined,
  title: {
    default: "Internet cáp quang VNPT Bình Thủy, Cần Thơ | Tư vấn lắp đặt",
    template: "%s | VNPT Bình Thủy",
  },
  description:
    "Tư vấn lắp Internet cáp quang VNPT, WiFi Mesh cho gia đình và cửa hàng tại Bình Thủy, Long Tuyền, Thới An Đông, Phước Thới. Gọi 08.1800 6881.",
  robots: { index: indexable, follow: indexable },
  alternates: process.env.SITE_URL ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    title: "Internet VNPT Bình Thủy — Kết nối trọn vẹn",
    description:
      "Tìm giải pháp Internet phù hợp cho gia đình, làm việc và kinh doanh.",
    images: [
      {
        url: "/hero.webp",
        width: 1280,
        height: 720,
        alt: "Gia đình sử dụng Internet trong không gian sống hiện đại",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
