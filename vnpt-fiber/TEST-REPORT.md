# Kiểm thử VNPT Fiber

Ngày 09/11/2026, Asia/Saigon. Trạng thái: ứng dụng đã hoàn thiện cục bộ; chưa xác nhận lưu khách hàng thật hoặc triển khai thương mại.

- npm run lint: PASS.
- npm run typecheck: PASS.
- npm test: 12/12 PASS. Kiểm tra điện thoại, consent, khu vực, UUID, thời gian, trường quá dài, UTM, UTF-8, JSON lỗi và payload vượt 8 KiB.
- npm run build: PASS. Next.js 15.5.29; route / server-rendered; 11.3 kB, first-load JS 117 kB; API /api/leads, trang bảo mật, icon, robots, sitemap.
- npm audit --omit=dev --audit-level=high: 0 vulnerabilities.
- Chromium desktop 1363px, tablet CSS 779px, mobile CSS 545px và 340px bằng zoom: không tràn ngang.
- Menu mobile mở và Escape đóng; FAQ native details mở bằng Enter.
- 7 section, 1 H1, lang vi; 0 neo không có đích; 0 input/select thiếu label; ảnh có alt; skip link và reduced-motion.
- Trang /chinh-sach-bao-mat hoạt động và có tiêu đề riêng.
- Form chưa cấu hình database bị vô hiệu hóa, thông báo đúng chưa gửi/lưu.

Chưa kiểm thử API end-to-end với Supabase thật, rate limit transactional thực tế, gửi lặp, quyền anon bằng kết nối live, hoặc khôi phục backup. SQL và API đã được chuẩn bị; cần project/secret để chạy các bước đó. Chưa chứng nhận WCAG, chưa chạy Lighthouse/thiết bị iOS/Android thật. SEO giữ noindex đến khi có URL Production chuẩn và được kích hoạt.
