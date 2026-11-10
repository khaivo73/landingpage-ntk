# Kiểm thử VNPT Fiber — 10/11/2026

## Bản đang chạy

- URL: https://internet.vnptcantho.io.vn/
- Runtime commit: b35fcb8bfa81bd4191e5e97ae115827a5c04978e.
- GitHub Actions 42783244713: SUCCESS — lint, typecheck, 13 unit tests, production dependency audit, production build, standalone packaging.
- Next.js 15.5.29, Node 24.22.2, VPS 42.96.17.168; riêng service vnpt-fiber, lắng nghe 127.0.0.1:3100 và Apache HTTPS proxy.
- 4 gói HOME1 Mesh, CAM CANH, CAM MẬT, CAM SÀNH; giá/quyền lợi theo ảnh chủ website cung cấp. Tên CAM MẬT đã sửa theo xác nhận của chủ website.

## Form thực tế — PASS

1. Tải website công khai, chọn CAM MẬT trên thẻ gói; form điền sẵn đúng lựa chọn.
2. Điền tên thử, điện thoại thử, Bình Thủy, địa chỉ thử và đồng ý liên hệ.
3. Bấm Nhận tư vấn gói cước; giao diện báo đang gửi rồi xác nhận Đã nhận nhu cầu tư vấn.
4. Form được reset sau thành công, nút gửi trở lại hoạt động.
5. Kiểm chứng bản ghi 4120c68e-1b66-4515-ab66-8c545f6e1f49 trong Supabase: gói CAM MẬT, Bình Thủy, nguồn system_qa, có consent_at.
6. GET trang chủ HTTP 200; không còn thông báo chờ kích hoạt, các ô nhập cho phép thao tác.

## API trực tuyến — PASS

- Đăng ký hợp lệ: 200, reference đúng UUID.
- Gửi lại cùng UUID: 200; truy vấn database xác nhận duy nhất 1 dòng.
- Điện thoại sai, thiếu đồng ý, tên gói lạ: 400.
- Origin ngoài website: 403.
- Content-Type không phải JSON: 415.
- JSON hỏng: 400.
- Body vượt 8 KiB: 413.
- Honeypot có nội dung: 400.
- Timestamp ở tương lai: 400.

Lưu ý kiểm thử: ngưỡng gửi tối thiểu 1,2 giây được kiểm tra bằng unit test với đồng hồ cố định. Không dùng thời gian gửi qua Internet để kết luận ngưỡng này, vì độ trễ mạng có thể vượt 1,2 giây.

## Lưu trữ và quyền truy cập — PASS

- VPS gọi Edge Function vnpt-lead-intake bằng khóa riêng chỉ dùng cho đầu nhận đăng ký. Khóa được nhập ẩn, không ghi shell history, không có trong Git hoặc frontend; file môi trường quyền 600.
- Function xác thực SHA-256 của khóa, kiểm tra payload có giới hạn, chỉ gọi RPC submit_vnpt_lead. Khóa quản trị database chỉ được dùng trong môi trường Supabase.
- Gọi trực tiếp function không có khóa: 401 UNAUTHORIZED.
- Bản thử qua function 9faafc38-9125-4c88-97cc-06efceba8ac4 lưu đúng CAM MẬT.
- Bảng bật RLS; anon/authenticated không có quyền SELECT; anon không có quyền EXECUTE RPC. Không cung cấp API liệt kê khách hàng công khai.
- RPC giới hạn 5 đăng ký/IP băm/15 phút, khóa giao dịch chống race; kiểm thử SQL trước đó đã xác minh lần thứ 6 bị RATE_LIMIT và UUID lặp không tăng dòng.
- Advisor không có cảnh báo bảo mật WARN/ERROR; INFO RLS-with-no-policy có chủ đích vì bảng chỉ dành cho service role. [Giải thích advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- 3 bản ghi QA của phiên này giữ trạng thái closed, ghi chú KHÔNG LIÊN HỆ; không nằm trong danh sách khách mới. Không xóa dữ liệu khách hàng thật.

## Giao diện và SEO

- Desktop Chromium 1363px: 4 thẻ, không tràn ngang; chọn gói và gửi form trực tuyến đã kiểm chứng.
- Bản trước đã kiểm thử viewport mobile 390x844 và menu Escape; CSS thẻ giá chuyển 2 cột ở 1100px và 1 cột ở 560px. Chưa chạy lại thao tác gửi form trên thiết bị di động thật cho bản này.
- Nhãn input/select đầy đủ, focus bàn phím, trạng thái gửi có aria-live, checkbox đồng ý bắt buộc; chưa chứng nhận WCAG.
- HTTPS, tiêu đề vi, H1, canonical và chính sách bảo mật có mặt. SITE_INDEXABLE hiện giữ false (noindex); chưa bật index tìm kiếm.
- Chưa chạy Lighthouse hoặc diễn tập khôi phục backup. Không có analytics, tự gửi tin Zalo, SMS hay gọi điện tự động.
