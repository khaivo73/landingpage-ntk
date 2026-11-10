# Kiểm thử VNPT Fiber

Ngày 10/11/2026, Asia/Saigon. Trạng thái: đã chạy VPS qua HTTPS tại https://internet.vnptcantho.io.vn. Chưa kích hoạt form; chưa xác nhận end-to-end nhận khách từ website.

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

## Xác minh trực tuyến 10/11/2026

- Runtime commit bf108a7db38efc0730fa04de5e1bdb4c2d8cc89c; GitHub Actions run 42722265579 SUCCESS: lint, typecheck, 12 tests, production dependency audit, build và packaging.
- VPS 42.96.17.168: Node 24.22.2, systemd user riêng, bind loopback 127.0.0.1:3100; Apache virtual host riêng. WordPress cũ giữ nguyên cấu hình.
- HTTPS certificate được cấp cho internet.vnptcantho.io.vn, hết hạn 07/02/2027; Certbot renewal timer có sẵn, thêm deploy hook reload Apache.
- HTTP chuyển hướng HTTPS; /, /robots.txt, /chinh-sach-bao-mat, /hero.webp đều HTTP 200; nosniff có mặt.
- Chromium online desktop 1920px và mobile viewport 390x844: 7 section, 1 H1, 0 input/select thiếu label, ảnh tải đủ, không tràn ngang. Mobile menu mở và Escape đóng (DOM state).
- API POST /api/leads khi chưa có secret trả 503 với thông báo đúng; giao diện form bị vô hiệu hóa. Không báo lưu thành công giả.
- Supabase SQL transaction thực tế: gửi lại UUID chỉ 1 dòng, 5 đăng ký/IP/15 phút được nhận, lần 6 bị RATE_LIMIT. Rollback toàn bộ fixture, persisted_rows_after_rollback=0.
- RLS bật; anon/authenticated không được đọc bảng; anon không được gọi RPC. Advisor chỉ INFO RLS-with-no-policy, có chủ đích vì bảng chỉ cho server service role.

Còn thiếu: cấp quyền chuyển khóa server Supabase đến VPS, kiểm thử form end-to-end qua HTTPS, kiểm chứng hàng được lưu và gửi lặp từ API. Chưa chứng nhận WCAG, chưa chạy Lighthouse hoặc thiết bị iOS/Android thật; chưa diễn tập khôi phục backup. SEO giữ noindex đến khi kiểm thử cuối và kích hoạt chính thức.

## Bổ sung 4 gói cước — 10/11/2026

Nguồn nội dung: ảnh tờ giới thiệu VNPT Cần Thơ do chủ website cung cấp trong hội thoại. HOME1 Mesh 215.000đ/tháng, CAM CANH 200.000đ/tháng, CAM MẬT 190.000đ/tháng, CAM SÀNH 205.000đ/tháng. Không tự thêm khuyến mãi/VAT/điều kiện chưa xác minh.

- Thêm thẻ giá và quyền lợi, nút Chọn gói, trạng thái gói đã chọn và chọn sẵn trường Gói cước / nhu cầu. Cùng trạng thái React cho thẻ và form.
- Lựa chọn gửi qua trường demand hiện có và được API chuyển vào payload Supabase; không cần thay schema.
- Lint, typecheck, production build PASS; 13/13 unit tests PASS, gồm chấp nhận 4 tên gói và từ chối tên lạ.
- Chromium preview desktop 1363px: 4 thẻ, không tràn ngang; chọn HOME1 Mesh, CAM CANH, CAM MẬT bằng chuột và CAM SÀNH bằng Enter xác nhận trường demand và thẻ được chọn đúng. Chỉ 1 thẻ được đánh dấu tại một thời điểm.
- CSS đặt 2 cột dưới 1100px và 1 cột dưới 560px; chưa kiểm thử lại viewport mobile cho lần cập nhật này.
- Bản gói cước chưa lên VPS; cần thực thi installer của release mới qua SSH. Form production vẫn chờ cấu hình secret; không tuyên bố end-to-end thành công.
- deploy/activate-leads.sh hỗ trợ quản trị viên nhập khóa server qua SSH với input ẩn, xác thực API quyền đọc limit=0 trước khi ghi file quyền 600; không đưa secret vào command arguments hay Git.
