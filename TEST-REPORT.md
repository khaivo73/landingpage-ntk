# Báo cáo kiểm thử — 09/11/2026 (Asia/Saigon)

Trạng thái: HOÀN THIỆN CỤC BỘ, CHƯA HOÀN TẤT TRIỂN KHAI.

## Kiểm thử đã chạy

| Hạng mục | Kết quả / bằng chứng |
| --- | --- |
| Dependencies | npm install thành công, có package-lock.json |
| Lint | npm run lint: không lỗi/cảnh báo ở mã nguồn cuối |
| TypeScript | npm run typecheck: thành công |
| Production build | npm run build: Next.js 15.5.29, 6 trang static tạo thành công; route / khoảng 12.3 kB, first-load JS 115 kB |
| Production HTML | npm run test:built: 7 section, một H1, vi, Open Graph, noindex, thông báo demo; không có name trên input/select, submit disabled trước hydration |
| Dependencies production | npm audit --omit=dev --audit-level=high: 0 vulnerabilities sau override PostCSS 8.5.32 |
| Desktop | Chromium, viewport CSS rộng 1363px: Hero hiển thị, điều hướng và form có bố cục hai cột; không tràn ngang |
| Responsive | CSS viewport 545px và 340px qua browser zoom: không tràn ngang, card về một cột; ở 340px course column 305px |
| Menu mobile | Mở/đóng; aria-expanded chuyển; Escape đóng; chọn Khóa học đóng menu và đi tới section |
| FAQ | Nhấn chuột mở câu hỏi; bàn phím Enter đổi aria-expanded; vùng trả lời có id và aria-labelledby |
| Form | Trường trống bị browser validation chặn; phone 123 bị pattern chặn; dữ liệu giả hợp lệ được reset và báo không gửi/lưu |
| Liên kết | 0 liên kết neo thiếu đích |
| Accessibility cơ bản | 0 ảnh thiếu alt, 0 input/select thiếu label, focus-visible, skip link, reduced-motion, lang=vi |
| SEO preview | title/description, Open Graph, viewport, icon, noindex/nofollow; không bịa structured data về chuyên gia hoặc đánh giá |

## Lỗi phát hiện và sửa

- Lệnh preview truyền cờ kiểu Vite không tương thích Next: thêm wrapper chuyển --host sang --hostname và bỏ --strictPort.
- ESLint ban đầu quét build output .next: thêm ignores cho output và file next-env sinh tự động.
- Cảnh báo CSS align-items:end: đổi thành flex-end.
- Dependency PostCSS có advisory: pin override 8.5.32; audit production về 0.
- Ảnh AI trước đây chỉ được giải thích trong README: thêm nhãn trực tiếp trên trang.
- Thiếu liên kết ARIA FAQ/menu, skip link và một số màu nhạt: đã cải thiện.
- Trong kiểm thử tải trang, native form có thể gửi dữ liệu thử qua query string trước hydration. Đã bỏ name trên các trường và disable nút tới khi JS sẵn sàng; kiểm tra regression ngay trên HTML production.

## Giới hạn cần ghi nhận

- Responsive được thử bằng thay đổi chiều rộng CSS qua zoom, chưa kiểm thử thiết bị iOS/Android thật hoặc Safari/Firefox.
- Accessibility mới kiểm tra cơ bản và bàn phím, chưa chứng nhận WCAG đầy đủ, chưa chạy axe/Lighthouse hoặc screen reader.
- Chưa xác minh chân dung, hồ sơ chuyên gia, khóa học hoặc testimonial. Tất cả vẫn rõ trạng thái demo.
- HTTP smoke từ shell đến preview bị ECONNREFUSED do môi trường preview ở bề mặt trình duyệt riêng. Trang được mở và tương tác được bằng Chromium. `test:smoke` dành cho URL được triển khai; chưa được tính là PASS.
- Chưa có kết quả test URL Vercel, DNS/TLS, HTTP asset/404 và hành vi bản deployed. Chưa có URL trực tuyến để bàn giao.

## Điều kiện tiếp tục

1. Đăng nhập GitHub trên tab đang mở (tài khoản khaivo73), hoặc cung cấp repository mới mà GitHub connector được cấp quyền ghi.
2. Cài/kết nối Vercel trong ChatGPT và xác thực tài khoản/team đích.
3. Tạo repo private, đẩy commit, triển khai Vercel Preview, kiểm tra URL thực tế và chạy `npm run test:smoke -- <URL>`.

Không báo hoàn thành toàn bộ trước khi bước 3 thành công.

## Kiểm tra lại bản vá cuối

Chromium tải URL sạch: nút demo disabled ban đầu, enabled sau hydration; 0 trường có name. Gửi dữ liệu giả hợp lệ: URL vẫn là http://127.0.0.1:4173/ (không query); status báo không gửi/lưu; sửa dữ liệu làm status cũ biến mất. Bản vá đã được kiểm thử trực tiếp sau build cuối.

## Cập nhật kết nối

Repository do người dùng tạo: https://github.com/khaivo73/landingpage-ntk. GitHub xác nhận quyền push/admin. Phiên Vercel đã mở trong trình duyệt. Bước triển khai và kiểm thử online đang tiếp tục; các blocker mô tả trước đây là trạng thái lịch sử.

## Blocker được xác minh khi tiếp tục

Vercel team dmis đã đăng nhập và liệt kê được landingpage-ntk để import. GitHub get_repo trả quyền tài khoản push/admin=true, nhưng thao tác create_file trả 403 Resource not accessible by integration. Chưa có mã nguồn nào được ghi lên repository. Danh sách installations của kết nối hiện tại rỗng; cần cấp quyền kết nối GitHub của ChatGPT đối với repository và quyền ghi Contents, hoặc cung cấp một phương thức push được xác thực. Chưa có deployment.
