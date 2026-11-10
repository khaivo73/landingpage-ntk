# Báo cáo kiểm thử Motion Studio — 10/11/2026

## Đã xác nhận

- 8/8 tests PASS với `RENDER_TEST=1 npm test`.
- Kiểm tra schema: giới hạn thời lượng/FPS, NaN, tài nguyên không hợp lệ, mốc chuyển cảnh.
- API: tạo/sửa/lưu trữ dự án, chặn ghi cross-origin, JSON lỗi, tài nguyên thiếu, upload giả PNG.
- Pipeline thực: tải PNG và WAV, render 24 khung hình ở 1080×1080, MP4 1 giây có audio; ffprobe xác nhận thông số; tải Range 100 byte và ảnh cảnh trả thành công.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities tại thời điểm chạy.
- Chromium UI: mở giao diện, lưu, đổi tên, mở danh sách dự án thấy tên mới.
- Xuất từ UI: dự án mẫu 3 cảnh/12 giây, dọc 1080×1920/30 fps đạt 100%, có liên kết tải MP4, ảnh của 3 cảnh và báo cáo kỹ thuật.

## Giới hạn

- Chưa kiểm thử Safari/iOS/Android thật.
- Chưa build/chạy Docker trong môi trường này; Dockerfile và compose dành cho VPS.
- Chưa có thử tải nhiều người dùng; thiết kế một người dùng/một tiến trình.
- Chưa có AI đánh giá thẩm mỹ, tự tạo kịch bản hay tự nhận diện beat.
- Chưa xác nhận domain/HTTPS hay triển khai VPS production.
