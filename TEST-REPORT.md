# Báo cáo bàn giao landing page Nguyễn Tất Kiểm

Ngày kiểm thử: 09/11/2026, Asia/Saigon.

## URL và mã nguồn

- Preview theo nhánh: https://landingpage-ntk-git-preview-dmis.vercel.app
- Deployment đã xác minh Ready: https://landingpage-6si5hsgz2-dmis.vercel.app
- Vercel deployment: https://vercel.com/dmis/landingpage-ntk/eB1VzooHAE6Vo68vLXUCBkZ2tzzH
- Repository: https://github.com/khaivo73/landingpage-ntk
- Nhánh: preview
- Commit đã kiểm thử online: 8b6dddd5f76cd58393bd493fcb5e034fc926b891
- Runtime/code commit: a40c80b5173dac6d62eb19abd54dca065118fe37
- Commit bàn giao tài liệu sau đó chỉ thay README và báo cáo này; không đổi mã ứng dụng.

## Kết quả

| Kiểm thử | Kết quả |
| --- | --- |
| Dependencies | Có lockfile; Next.js 15.5.29, React 19, Node 24.x |
| ESLint | PASS, không lỗi mã nguồn |
| TypeScript | PASS |
| Production build cục bộ | PASS; tạo 6 trang static; route / 12.3 kB, first-load JS 115 kB |
| Production HTML regression | PASS: đủ 7 section, 1 H1, lang vi, noindex, Open Graph, thông báo demo; không có name trên trường form; submit disabled trước hydration |
| Audit production | npm audit --omit=dev --audit-level=high: 0 vulnerabilities; override PostCSS 8.5.32 |
| Vercel build | Ready; môi trường Preview; build duration tổng 42 giây |
| Desktop online | Chromium 1920px và 1440px: trang tải, bố cục hiển thị, không tràn ngang |
| Tablet online | Viewport thật 768×1024: không tràn ngang |
| Mobile online | Viewport thật 390×844 và 320×740: không tràn ngang, course card về một cột |
| Menu mobile online | Mở/đóng, aria-expanded, Escape hoạt động |
| FAQ online | Click mở câu hỏi, Enter đổi aria-expanded và vùng trả lời |
| Form online | Dữ liệu giả hợp lệ: reset, báo không gửi/lưu, URL không thêm query; phone 123 tạo 1 input:invalid và không submit |
| DOM/accessibility cơ bản | 7 section, 1 H1, 0 liên kết neo thiếu đích, 0 trường thiếu label; có skip link, focus-visible, alt, reduced-motion |
| SEO preview | title, description, Open Graph, lang vi, viewport và favicon; noindex/nofollow, robots disallow |
| Console online | 0 warning/error trong log Chromium thu được khi kiểm thử |

## Quyền truy cập và giới hạn kiểm thử

Preview bật bảo vệ đăng nhập Vercel. Tài khoản có quyền project mở và tương tác được. HTTP smoke từ shell chưa đăng nhập bị chuyển tới Login – Vercel; không tính kiểm thử này là PASS. Chưa kiểm thử đầy đủ HTTP assets/404 qua phiên xác thực.

Chưa kiểm thử iOS/Android thật hoặc Safari/Firefox. Accessibility là kiểm tra cơ bản và bàn phím; chưa chạy axe/Lighthouse hay screen reader, chưa chứng nhận WCAG đầy đủ. Chưa có số đo Core Web Vitals thực tế.

Vercel build có cảnh báo ESLint 9 hết thời gian hỗ trợ và cấu hình cache-dir của môi trường npm; không có lỗi build hoặc lỗi runtime ghi nhận. Giữ ESLint tương thích với Next.js 15; cần đánh giá nâng cấp major riêng.

## Nội dung và dữ liệu

7 section hoàn chỉnh dựa trên ZIP gốc, không viết lại từ đầu. Không công bố thành tích, đối tác hay testimonial giả. Khóa học và phản hồi có nhãn demo/chờ xác minh. Ảnh hero có nhãn minh họa AI, chưa xác minh danh tính.

Form là DEMO, không backend, không fetch hoặc storage. Đã sửa nguy cơ native form tạo query trước hydration bằng cách bỏ name trên trường và khóa submit đến khi JS sẵn sàng. Khi JS tắt, nút vẫn disabled. Chỉ nhập dữ liệu thử.

## Trạng thái hosting

Team/project: dmis/landingpage-ntk; Next.js, Node24, root ./; Production branch main, Preview branch preview. Lần khởi tạo đầu của Vercel đã tạo thêm bản Production. Project đã được tạm dừng rồi mở lại vì pause cũng chặn build Preview. Bản bàn giao là URL Preview ở trên; project hiện hoạt động, không gắn domain riêng. Nội dung vẫn demo/noindex ở mọi môi trường.
