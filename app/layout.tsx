import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#100d1e' };
export const metadata: Metadata = {
  title: 'Nguyễn Tất Kiểm | Học tập & phát triển — Demo',
  description: 'Bản demo giao diện giới thiệu Nguyễn Tất Kiểm và các chủ đề kinh doanh, marketing, phát triển bản thân. Nội dung chương trình chờ xác minh.',
  robots: { index: false, follow: false },
  openGraph: { title: 'Nguyễn Tất Kiểm | Học tập & phát triển — Demo', description: 'Khám phá giao diện học tập và phát triển. Khóa học và biểu mẫu ở chế độ demo.', locale: 'vi_VN', type: 'website' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
