# Internet VNPT Bình Thủy — Landing page nhận nhu cầu tư vấn

Next.js 15.5.29 / React 19 / TypeScript / Node 24.x. Thiết kế theo bản tham chiếu xanh–trắng; 7 phần và 4 ảnh minh họa riêng. Số liên hệ 08.1800 6881.

## Chạy

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Kích hoạt dữ liệu thật

1. Chọn một project Supabase do chủ tài khoản quản lý.
2. Chạy supabase/001_leads.sql. Bảng vnpt_leads bật RLS; anon/authenticated không có quyền đọc, ghi hay gọi RPC; chỉ service_role phía server thao tác được.
3. Trong /etc/vnpt-fiber.env trên VPS (quyền 600), thêm SUPABASE_URL, SUPABASE_SECRET_KEY (secret), LEAD_IP_HASH_SECRET (secret ngẫu nhiên ít nhất 32 ký tự). Không đặt service role trong NEXT_PUBLIC_*, mã nguồn hay trình duyệt.
4. Có thể bật Cloudflare Turnstile bằng cả NEXT_PUBLIC_TURNSTILE_SITE_KEY và TURNSTILE_SECRET_KEY; nếu chỉ cấu hình một khóa, form không được kích hoạt. Khi chưa dùng Turnstile, vẫn có rate limit, honeypot, thời gian tối thiểu và giới hạn payload.
5. Cấu hình SITE_URL là URL Production chuẩn, SITE_INDEXABLE=true sau khi kiểm thử và xác nhận nội dung. Trước đó robots giữ noindex/disallow.
6. Deploy và kiểm thử form bằng dữ liệu giả; xác nhận hàng trong Supabase, kiểm tra gửi lặp không tạo bản ghi mới; xóa riêng dữ liệu thử.
7. Đọc/chăm sóc/xuất CSV ở Supabase Dashboard > Table Editor > vnpt_leads, bằng tài khoản được cấp quyền. Không có endpoint công khai liệt kê khách hàng.

## Luồng nhận khách

Form POST /api/leads → kiểm tra cấu hình, Origin, kiểu/nội dung JSON (tối đa 8 KiB, đọc stream có giới hạn), consent, số điện thoại, khu vực, UUID và thời gian → xác minh Turnstile nếu cấu hình → HMAC địa chỉ IP → RPC transactional Supabase → chỉ trả thành công khi database xác nhận.

RPC giới hạn 5 đăng ký/IP băm/15 phút với advisory transaction lock; UUID là idempotency key cho retry. Mã băm không phải địa chỉ IP thô. UTM được giới hạn độ dài; referrer chỉ lưu hostname. Không log nội dung đăng ký/credentials. Chưa cấu hình database: API trả 503 và form bị khóa với hướng dẫn gọi tư vấn, không giả báo gửi thành công.

## Hosting

VPS Ubuntu 22.04 hiện có Apache và WordPress tại vnptcantho.io.vn. Landing page chạy bằng Next.js standalone ở 127.0.0.1:3100, systemd với user riêng; Apache reverse proxy bằng virtual host riêng. Không thay cấu hình website cũ. Xem deploy/README.md.

Mã ứng dụng độc lập trong thư mục vnpt-fiber, nhánh vnpt-fiber của repository đã kết nối. Giá/gói/ưu đãi chưa được xác minh nên không tự công bố. Ảnh là minh họa.

## Vận hành

Rà soát quyền người quản trị, thiết lập sao lưu và thời gian lưu dữ liệu; chính sách dự kiến cần được chủ trang xác nhận trước khi chạy quảng cáo. Supabase Free có thể pause khi ít hoạt động, không tương đương một cam kết dịch vụ liên tục. Bản này chưa gắn analytics, quảng cáo, Zalo OA hay gửi tin nhắn tự động.
