# Nguyễn Tất Kiểm — Landing page demo

Tiếp quản trực tiếp mã nguồn ZIP, giữ Next.js App Router, 7 section, CSS tím/đen và ảnh tham chiếu có sẵn.

## Chạy và kiểm thử

Node 24.x, Next.js 15.5.29, React 19, TypeScript, Lucide; có package-lock.json. Override PostCSS 8.5.32 khắc phục advisory dependencies gián tiếp.

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:built
npm start
```

Sau khi có URL deployed: `npm run test:smoke -- <URL_PREVIEW>`.

## Nội dung và form

Đủ Hero, Giới thiệu chuyên gia, Khóa học, Giá trị, Cảm nhận học viên, FAQ, Đăng ký tư vấn. Nội dung khóa học/phản hồi là placeholder có nhãn; chưa có thành tích hay đối tác được xác minh. Ảnh AI có nhãn minh họa và chưa xác minh danh tính; thay bằng ảnh có quyền sử dụng trước khi ra mắt.

Form DEMO không có backend, fetch hay storage. Không nhập dữ liệu thật. Trường không có name; nút bị vô hiệu hóa trước hydration. Sau khi JS sẵn sàng, form kiểm tra dữ liệu giả, reset và thông báo rõ không gửi/lưu. Khi tắt JS, nút vẫn vô hiệu hóa.

SEO preview giữ noindex/nofollow và robots disallow; chưa đặt canonical khi chưa có domain chính thức. Có title, description, Open Graph, lang=vi và favicon. Chưa chứng nhận WCAG đầy đủ.

## Repository và Vercel

- Repository: https://github.com/khaivo73/landingpage-ntk
- Vercel team/project: dmis/landingpage-ntk
- Framework: Next.js; Node.js 24.x; root ./
- Nhánh thử nghiệm: preview. Production branch: main.
- Lần triển khai đầu tự được Vercel gán Production và đã hoàn thành trước khi yêu cầu hủy có hiệu lực. Production đã được pause; Preview deployments không bị ảnh hưởng theo thông báo Vercel.
- Bản Preview tiếp theo được dựng từ nhánh preview. Kiểm tra trạng thái và URL thực tế trên Vercel trước khi bàn giao.

Xem TEST-REPORT.md về kết quả và giới hạn kiểm thử cục bộ. Báo cáo online cuối được cung cấp trong bàn giao.
