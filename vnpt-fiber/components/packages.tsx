"use client";
import { ArrowRight, Check, Wifi } from "lucide-react";
import { PACKAGES } from "@/lib/lead-validation";
import { usePackageSelection } from "@/components/package-selection";
export function Packages() {
  const { demand, setDemand } = usePackageSelection();
  function choose(name: string) {
    setDemand(name);
    document.getElementById("dang-ky")?.scrollIntoView({ block: "start" });
    document.getElementById("demand")?.focus({ preventScroll: true });
  }
  return (
    <section id="goi-cuoc" className="section packages-section" aria-labelledby="packages-title">
      <div className="container">
        <div className="section-heading">
          <span className="label">CHỌN TRƯỚC. TƯ VẤN ĐÚNG NHU CẦU.</span>
          <h2 id="packages-title">Một gói cước cho điều bạn cần.</h2>
          <p>So sánh 4 lựa chọn và chọn gói phù hợp để điền sẵn vào yêu cầu tư vấn.</p>
        </div>
        <div className="package-grid">
          {PACKAGES.map((p) => (
            <article key={p.id} className={`package-card ${demand === p.name ? "selected" : ""}`}>
              <div className="package-icon"><Wifi size={24} aria-hidden="true" /></div>
              <h3>{p.name}</h3>
              <p className="package-price"><strong>{p.price.toLocaleString("vi-VN")}<span>đ</span></strong><span>/tháng</span></p>
              <ul>{p.features.map(f => <li key={f}><Check size={17} aria-hidden="true" /><span>{f}</span></li>)}</ul>
              <button type="button" className={`button ${demand === p.name ? "primary" : "pale"}`} aria-pressed={demand === p.name} aria-label={`Chọn gói ${p.name}`} onClick={() => choose(p.name)}>
                {demand === p.name ? "Đã chọn gói" : "Chọn gói này"}<ArrowRight size={17} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
        <div className="package-terms" id="package-terms">
          <p>Giá và quyền lợi theo bảng giới thiệu gói cước VNPT Cần Thơ. Điều kiện áp dụng, VAT, phí lắp đặt và ưu đãi được xác nhận trước khi đăng ký dịch vụ.</p>
          <p>Tốc độ WiFi thực tế phụ thuộc thiết bị, vị trí và môi trường sử dụng. Chọn gói chỉ ghi nhận nhu cầu tư vấn, chưa tạo hợp đồng hoặc thanh toán.</p>
        </div>
      </div>
    </section>
  );
}
