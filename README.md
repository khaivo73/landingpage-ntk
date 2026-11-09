# Nguyễn Tất Kiểm — Landing page demo

Dự án tiếp quản trực tiếp từ ZIP; giữ Next.js App Router, 7 section, CSS tím/đen và ảnh tham chiếu có sẵn. Không viết lại bằng framework khác.

## Công nghệ và chạy

Node >=22; Next.js 15.5.29, React 19, TypeScript, Lucide. Lockfile đã được tạo. PostCSS được override 8.5.32 để vá dependencies gián tiếp.

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:built
npm start
```

`dev` hỗ trợ các cờ host/port của môi trường preview. Chạy cục bộ bình thường tại http://localhost:3000.

## Trạng thái nội dung

- Đủ Hero, Giới thiệu chuyên gia, Khóa học, Giá trị, Cảm nhận học viên, FAQ, Đăng ký tư vấn.
- Chưa có hồ sơ, thành tích, đối tác hoặc phản hồi được xác minh. Không sử dụng số liệu hay chứng thực giả.
- Ảnh có sẵn là minh họa AI chưa xác minh danh tính; có nhãn ngay trên trang. Cần thay bằng chân dung có quyền sử dụng trước khi ra mắt chính thức.
- Khóa học và phản hồi là placeholder có nhãn, chưa mở bán.
- Form DEMO không có backend, không dùng fetch, không ghi storage. Trường dữ liệu không có `name`; nút submit bị vô hiệu hóa trước hydration. Sau khi JS sẵn sàng, form kiểm tra dữ liệu giả, reset và thông báo rõ không gửi/lưu. Khi tắt JS, nút vẫn bị vô hiệu hóa.
- Preview giữ noindex/nofollow và robots disallow. Chưa thêm canonical vì chưa có tên miền chính thức.

## Triển khai

Repository: https://github.com/khaivo73/landingpage-ntk

Được tạo bởi chủ tài khoản. Vercel Preview đang được thiết lập từ repository. Chưa xác nhận URL deployed trong commit nhập mã nguồn này. Kiểm tra URL thực tế sau deploy:

```bash
npm run test:smoke -- <URL_PREVIEW>
```

Giữ cấu hình mặc định Next.js, npm ci và npm run build. Biểu mẫu vẫn là demo, chưa thu đăng ký thật. Chi tiết kiểm thử cục bộ ở TEST-REPORT.md.

## Khôi phục lịch sử

ZIP bàn giao kèm `ntk-landing.bundle`. Có thể dùng `git clone ntk-landing.bundle ntk-landing-restored` để giữ commit đã chuẩn bị. Không chứa dependencies, build cache hay thông tin đăng nhập.
