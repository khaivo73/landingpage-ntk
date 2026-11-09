import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  alternates: { canonical: "/chinh-sach-bao-mat" },
};
export default function Privacy() {
  return (
    <main className="privacy container">
      <Link className="text-link" href="/">
        ← Về trang tư vấn
      </Link>
      <span className="label">CẬP NHẬT 09/11/2026</span>
      <h1>Chính sách bảo mật thông tin tư vấn</h1>
      <p>
        Trang này phục vụ tiếp nhận nhu cầu tư vấn Internet VNPT tại khu vực
        Bình Thủy, Cần Thơ. Đầu mối liên hệ:{" "}
        <a href="tel:0818006881">08.1800 6881</a>.
      </p>
      <h2>Thông tin được tiếp nhận</h2>
      <p>
        Khi biểu mẫu được kích hoạt và bạn đồng ý gửi, chúng tôi tiếp nhận họ
        tên, số điện thoại, khu vực, nhu cầu và địa chỉ nếu bạn cung cấp. Hệ
        thống ghi thời điểm đồng ý, nguồn chiến dịch và một mã băm địa chỉ IP
        phục vụ hạn chế spam; không lưu địa chỉ IP thô trong bảng khách hàng.
      </p>
      <h2>Mục đích sử dụng</h2>
      <p>
        Liên hệ theo yêu cầu, kiểm tra khả năng lắp đặt và tư vấn giải pháp.
        Việc gửi biểu mẫu không tạo hợp đồng và không phát sinh thanh toán.
        Trang không yêu cầu giấy tờ định danh, thông tin ngân hàng hay mật khẩu.
      </p>
      <h2>Lưu trữ và quyền truy cập</h2>
      <p>
        Thông tin được lưu trên cơ sở dữ liệu Supabase khi dịch vụ được cấu
        hình. Website chạy trên VPS do bộ phận phụ trách quản lý; hạ tầng có thể xử lý nhật ký kỹ thuật
        theo chính sách của nhà cung cấp. Không cung cấp danh sách khách hàng
        qua API công khai. Bộ phận phụ trách tư vấn quản lý quyền truy cập dữ
        liệu.
      </p>
      <h2>Yêu cầu chỉnh sửa hoặc xóa</h2>
      <p>
        Gọi 08.1800 6881 để đề nghị chỉnh sửa, dừng liên hệ hoặc xóa thông tin
        đăng ký. Thông tin được giữ trong thời gian cần thiết để xử lý nhu cầu;
        việc rà soát, xóa dữ liệu do bộ phận phụ trách thực hiện.
      </p>
      <h2>Chống spam và cookie</h2>
      <p>
        Khi được bật, Cloudflare Turnstile hỗ trợ xác minh yêu cầu. Website
        không cài công cụ quảng cáo hoặc phân tích hành vi trong phiên bản này.
        Thông số nguồn chiến dịch được gửi cùng đăng ký để biết kênh khách hàng
        tìm thấy trang.
      </p>
      <h2>Khi hệ thống chưa được kích hoạt</h2>
      <p>
        Biểu mẫu hiển thị trạng thái chưa sẵn sàng và không gửi đăng ký. Bạn có
        thể gọi trực tiếp để được tư vấn.
      </p>
    </main>
  );
}
