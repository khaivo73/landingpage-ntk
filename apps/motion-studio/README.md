# Motion Studio

Ứng dụng dựng video motion graphics bằng mã, được phát triển bằng Codex. Giao diện tiếng Việt; backend Node.js; Playwright chụp khung hình; FFmpeg xuất MP4. Chạy trên máy tính hoặc VPS có lưu trữ bền vững.

## Chức năng đã có

- Tạo, đặt tên, lưu, mở lại và lưu trữ dự án; bản nháp trong trình duyệt.
- Thêm, nhân bản, xóa, đổi thứ tự tối đa 12 cảnh, tổng tối đa 60 giây.
- Sửa tiêu đề, mô tả, nhãn, CTA, thương hiệu, màu nền và điểm nhấn.
- Ba bố cục; ba chuyển động spring, slide, fade.
- Tải ảnh PNG/JPG/WebP, nhạc MP3/WAV/OGG/M4A, tối đa 20 MB/tệp.
- Xem trước bằng cùng bộ vẽ được dùng khi xuất; phát nhạc và kéo timeline.
- Tỷ lệ dọc 1080×1920, vuông 1080×1080, ngang 1920×1080; 24 hoặc 30 fps.
- Khớp thời lượng cảnh theo BPM nhập tay; âm lượng và fade-out nhạc khi xuất.
- Hàng đợi xuất tuần tự, tiến độ, hủy, phục hồi thông tin tác vụ sau khởi động lại.
- Tải MP4 H.264/AAC, PNG đại diện từng cảnh và báo cáo kỹ thuật JSON.
- Nhập/xuất JSON nội dung dự án, kiểm tra dữ liệu phía máy chủ.
- HTTP Basic Authentication cho một người dùng khi bật APP_PASSWORD; production bắt buộc mật khẩu tối thiểu 12 ký tự.

## Chạy bằng Node.js

Cần Node.js >=22 và `ffmpeg`, `ffprobe` trong PATH. Cài FFmpeg từ nguồn chính thức phù hợp hệ điều hành; xác nhận bằng `ffmpeg -version` và `ffprobe -version`.

```bash
npm ci
npx playwright install chromium
npm start
```

Mở http://127.0.0.1:3000. Linux có thể cần `npx playwright install --with-deps chromium` nếu thiếu thư viện hệ thống. Có thể đặt `CHROMIUM_PATH` để dùng Chromium đã cài.

Nếu mã đang nằm trong repo `landingpage-ntk`, trước hết chuyển vào `apps/motion-studio`. App độc lập với landing page ở thư mục gốc.

## Chạy trên VPS bằng Docker

```bash
# Tại thư mục chứa Dockerfile:
# Tạo .env với APP_PASSWORD là mật khẩu riêng ít nhất 12 ký tự.
docker compose up -d --build
```

Mở qua SSH tunnel hoặc reverse proxy HTTPS tới 127.0.0.1:3000. Tài khoản đăng nhập: `admin`, mật khẩu: `APP_PASSWORD`. Compose chỉ bind cổng ở loopback; cấu hình reverse proxy/HTTPS thuộc môi trường VPS của bạn. Chưa triển khai VPS trong lần bàn giao này.

Bản app cần Node.js và tiến trình FFmpeg/Chromium lâu dài. Không chạy nguyên trạng trên GitHub Pages, Cloudflare Workers hoặc Vercel Functions. GitHub lưu mã nguồn; VPS/Docker chạy ứng dụng.

## Cách làm video đầu tiên

1. Sửa tên dự án và thương hiệu, chọn tỷ lệ.
2. Chọn cảnh bên trái; nhập chữ, thêm ảnh, chọn màu và chuyển động.
3. Thêm/bớt/đổi thứ tự cảnh theo nhu cầu, giữ tổng không quá 60 giây.
4. Tải nhạc, chỉnh âm lượng. Nếu dùng BPM, nhập BPM đã biết và bấm “Khớp cảnh theo BPM”.
5. Xem trước rồi lưu. Bấm “Xuất MP4”.
6. Khi hoàn tất, tải video và xem ảnh đại diện từng cảnh. Mở “Video đã xuất” để xem lịch sử.

## Kiểm thử

```bash
npm test
# Có FFmpeg + Chromium: chạy thêm pipeline xuất MP4 thật.
RENDER_TEST=1 npm test
```

PowerShell: `$env:RENDER_TEST='1'; npm test`. Bài test tích hợp tạo ảnh và âm thanh thử, tải lên, xuất video vuông 1 giây/24 fps, kiểm tra audio, thông số và HTTP Range. Dùng thư mục dữ liệu tạm, tự dọn sau test. Không cần API key.

## Dữ liệu và vận hành

- Mặc định `data/` gồm projects, assets, outputs, jobs; có thể đặt `DATA_DIR`.
- Dùng ổ đĩa/volume bền vững và sao lưu cả thư mục; dữ liệu không đưa lên Git.
- JSON xuất ra chỉ chứa cấu hình và đường dẫn tài nguyên, không nhúng ảnh/nhạc. Khi chuyển máy chủ cần chuyển cả `data/assets` cùng dự án.
- Lưu trữ dự án là soft archive, không xóa tệp. Khôi phục: bỏ trường `archived` trong JSON dự án khi server đã dừng hoặc mở GET /api/projects/:id rồi lưu lại.
- Một tiến trình Node phục vụ một workspace. Không chạy nhiều replica chung thư mục dữ liệu. Các JSON được ghi qua rename nguyên tử.
- Hàng đợi tối đa 5 tác vụ, 200 tác vụ đã lưu; chủ máy chủ cần dọn bản xuất cũ khi đạt giới hạn. Không có quota dung lượng tổng và chưa có tự dọn assets.
- Tác vụ đang chạy khi máy chủ bị dừng sẽ được đánh dấu lỗi khi khởi động lại; xuất lại để tiếp tục. Không tự khôi phục từng khung hình.
- Hủy ở giai đoạn encode có thể cần chờ FFmpeg kết thúc/timeout; khung hình tạm được dọn.
- Dùng tài nguyên ảnh/nhạc mà bạn có quyền sử dụng.

## Phạm vi AI

Codex là công cụ phát triển ứng dụng. App hiện dựng video theo mẫu, chưa gọi Codex/OpenAI API lúc chạy, chưa tạo ảnh/giọng nói, chưa tự nhận diện beat và chưa tự chấm thẩm mỹ 8/10. Báo cáo kiểm tra kỹ thuật không được trình bày như đánh giá chất lượng nghệ thuật. BPM là tham số người dùng cung cấp. Có thể tiếp tục tích hợp AI bằng một backend riêng khi đã chọn nhà cung cấp và ngân sách.

## Cấu trúc

- `server.mjs`: HTTP API, lưu dữ liệu, xác thực, upload, hàng đợi.
- `lib/project.mjs`: schema và dự án mẫu.
- `lib/render.mjs`: Playwright → khung hình → FFmpeg → ffprobe.
- `public/engine.js`: bộ vẽ dùng chung cho preview và render.
- `public/app.js`, `index.html`, `style.css`: giao diện biên tập.
- `test/`: kiểm tra schema, API và pipeline MP4.

Xem `TEST-REPORT.md` để biết kiểm tra đã thực hiện và giới hạn.
