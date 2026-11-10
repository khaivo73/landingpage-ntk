# Internet VNPT Bình Thủy — Landing page tư vấn

Next.js 15.5.29 / React 19 / TypeScript / Node 24.x. Website: https://internet.vnptcantho.io.vn/

Form đã hoạt động thực tế: chọn một trong bốn gói cước hoặc nhu cầu khác, điền liên hệ và đồng ý tư vấn → API Next.js → đầu nhận Supabase → RPC giao dịch → bản ghi vnpt_leads. Chỉ xác nhận thành công sau khi database nhận dữ liệu.

## Chạy và kiểm thử

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Triển khai

Ứng dụng trong thư mục vnpt-fiber, nhánh vnpt-fiber của repository khaivo73/landingpage-ntk. Giữ nguyên dự án NTK ở root. GitHub Actions đóng gói standalone; VPS chạy service systemd vnpt-fiber bằng user riêng, cổng loopback 3100. Apache dùng virtual host riêng internet.vnptcantho.io.vn; không thay website WordPress vnptcantho.io.vn.

Bản runtime đang chạy: b35fcb8bfa81bd4191e5e97ae115827a5c04978e. Xem deploy/README.md và TEST-REPORT.md.

## Cấu hình dữ liệu

- Project Supabase: sktvegipvzngwsditzjx (Singapore).
- File /etc/vnpt-fiber.env trên VPS, root:root quyền 600: SUPABASE_URL, LEAD_INTAKE_KEY, LEAD_IP_HASH_SECRET, SITE_URL. Không dùng NEXT_PUBLIC_ cho các khóa máy chủ.
- Edge Function supabase/functions/vnpt-lead-intake xác thực khóa máy chủ bằng digest, giới hạn payload và gọi đúng RPC. verify_jwt=false vì function tự xác thực bằng khóa riêng; không mở endpoint không xác thực.
- Digest trong source không phải khóa gốc. Khi xoay khóa: tạo khóa ngẫu nhiên mới, cập nhật digest và deploy function, cập nhật file môi trường VPS, restart service, kiểm thử trước khi nhận khách.
- RLS bật; anon/authenticated bị thu hồi quyền đọc/ghi/gọi RPC. Khóa quản trị được lấy từ biến môi trường sẵn có của Supabase ở function, không đưa lên VPS bằng phương án này.
- Có thể cấu hình cả cặp NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY. Hiện dùng rate limit database, honeypot, thời gian tối thiểu và body cap.
- Kiểu cũ SUPABASE_SECRET_KEY hoặc SUPABASE_SERVICE_ROLE_KEY vẫn được hỗ trợ nếu không có LEAD_INTAKE_KEY.

## Chăm sóc khách hàng

Quản trị viên đăng nhập Supabase Dashboard, mở Table Editor → vnpt_leads; lọc status=new để xem khách mới. Trường demand chứa gói/nhu cầu đã chọn. Có thể cập nhật status, assigned_to và note để theo dõi. Không có thông báo hay tin nhắn tự động trong bản này.

Các dòng utm_source=system_qa là dữ liệu thử, đã đánh dấu closed và KHÔNG LIÊN HỆ.

## Nội dung và vận hành

Giá và quyền lợi bốn gói theo ảnh chủ website cung cấp; CAM MẬT đã được chủ website xác nhận tên. VAT, điều kiện áp dụng, phí và ưu đãi cần được xác nhận khi tư vấn. Ảnh trang là minh họa.

SITE_INDEXABLE vẫn false; cần rà soát cấu hình robots/sitemap trước khi bật index Production. Supabase Free có thể pause khi ít hoạt động. Quản trị viên cần thiết lập sao lưu và rà soát thời gian lưu dữ liệu. Không log dữ liệu liên hệ hoặc khóa kết nối.
