import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Wifi,
  Laptop,
  Layers,
  Headphones,
  Phone,
  MapPin,
  House,
  BriefcaseBusiness,
  Store,
  ChevronDown,
  CheckCheck,
  ShieldCheck,
  Signal,
  Router,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { LeadForm } from "@/components/lead-form";
import { leadServiceReady } from "@/lib/config";
export const dynamic = "force-dynamic";
const solutions = [
  {
    id: "01",
    name: "Cho gia đình",
    desc: "Một kết nối cho những điều thân thuộc.",
    icon: House,
    features: [
      "Giải trí, học tập và sinh hoạt hằng ngày",
      "Tư vấn theo số thiết bị và không gian sử dụng",
    ],
    demand: "Internet gia đình",
    photo: "family",
  },
  {
    id: "02",
    name: "Làm việc tại nhà",
    desc: "Sẵn sàng cho một ngày làm việc hiệu quả.",
    icon: BriefcaseBusiness,
    features: [
      "Họp trực tuyến, chia sẻ tài liệu",
      "Lựa chọn kết nối theo nhu cầu công việc",
    ],
    demand: "Làm việc tại nhà",
    photo: "work",
    featured: true,
  },
  {
    id: "03",
    name: "Cửa hàng & kinh doanh",
    desc: "Kết nối hoạt động kinh doanh mỗi ngày.",
    icon: Store,
    features: [
      "Bán hàng, quản lý và các ứng dụng kinh doanh",
      "Trao đổi phương án cho hộ kinh doanh",
    ],
    demand: "Cửa hàng / hộ kinh doanh",
    photo: "shop",
  },
];
const faqs = [
  {
    q: "Khu vực của tôi có thể lắp đặt không?",
    a: "Bạn có thể để lại phường và địa chỉ dự kiến lắp đặt. Bộ phận tư vấn sẽ kiểm tra khả năng cung cấp tại địa chỉ cụ thể trước khi xác nhận phương án.",
  },
  {
    q: "Nên chọn gói cước nào cho gia đình?",
    a: "Gói phù hợp phụ thuộc vào số người sử dụng, thiết bị, nhu cầu học tập, giải trí và ngân sách. Chúng tôi sẽ tư vấn dựa trên nhu cầu thực tế; giá, tốc độ và điều kiện được xác nhận trước khi đăng ký.",
  },
  {
    q: "WiFi Mesh có phù hợp với nhà nhiều tầng?",
    a: "WiFi Mesh là một phương án mở rộng kết nối không dây giữa nhiều điểm phát. Số thiết bị và vị trí lắp cần được tư vấn theo diện tích, vật cản và cấu trúc ngôi nhà.",
  },
  {
    q: "Chi phí và thời gian lắp đặt được tính thế nào?",
    a: "Chi phí, lịch hẹn và chương trình áp dụng phụ thuộc vào gói cước, thời điểm và địa chỉ. Bộ phận tư vấn sẽ trao đổi rõ trước khi bạn quyết định.",
  },
  {
    q: "Gửi thông tin có phải là đăng ký hợp đồng không?",
    a: "Không. Biểu mẫu chỉ ghi nhận nhu cầu để liên hệ tư vấn. Bạn quyết định đăng ký dịch vụ sau khi được cung cấp thông tin về gói cước, chi phí và điều kiện.",
  },
];
export default function Home() {
  const enabled = leadServiceReady();
  return (
    <>
      <Navigation />
      <main id="noi-dung" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <Image
            className="hero-image"
            src="/hero.webp"
            fill
            priority
            sizes="100vw"
            alt="Hình ảnh minh họa gia đình sử dụng máy tính và thiết bị kết nối trong phòng khách"
          />
          <div className="hero-shade" />
          <div className="container hero-content">
            <span className="eyebrow">
              <span /> VNPT BÌNH THỦY · CẦN THƠ
            </span>
            <h1 id="hero-title">
              Internet cáp quang VNPT
              <span>
                Kết nối trọn vẹn.
                <br />
                Sống thông minh hơn.
              </span>
            </h1>
            <p>
              Một kết nối cho cả ngày làm việc,
              <br className="desktop-break" /> học tập và những phút giây bên
              gia đình.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#dang-ky">
                Đăng ký tư vấn <ArrowRight size={19} />
              </a>
              <a className="button outline" href="#giai-phap">
                Khám phá giải pháp <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="hero-local">
              <MapPin size={15} />
              <span>Bình Thủy · Long Tuyền · Thới An Đông · Phước Thới</span>
            </div>
          </div>
          <span className="image-note">Hình ảnh minh họa</span>
        </section>
        <section className="feature-strip" aria-label="Định hướng tư vấn">
          <div className="container features">
            {[
              [Wifi, "Kết nối cho mỗi ngày"],
              [Laptop, "WiFi theo nhu cầu"],
              [Layers, "Giải pháp phù hợp"],
              [Headphones, "Tư vấn rõ ràng"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Wifi;
              return (
                <div key={String(text)}>
                  <I size={27} strokeWidth={1.7} />
                  <span>{String(text)}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section
          id="giai-phap"
          className="section solutions"
          aria-labelledby="solutions-title"
        >
          <div className="container">
            <div className="section-heading">
              <span className="label">KẾT NỐI THEO CÁCH CỦA BẠN</span>
              <h2 id="solutions-title">
                Cuộc sống khác nhau.
                <br className="mobile-break" /> Kết nối phù hợp.
              </h2>
              <p>
                Từ ngôi nhà nhỏ đến cửa hàng bận rộn, bắt đầu bằng một giải pháp
                đúng nhu cầu.
              </p>
            </div>
            <div className="solution-grid">
              {solutions.map((s) => (
                <article
                  key={s.id}
                  className={`solution-card ${s.featured ? "featured" : ""}`}
                >
                  <div className={`solution-photo ${s.photo}`}>
                    <Image
                      src={
                        s.photo === "family"
                          ? "/hero.webp"
                          : s.photo === "work"
                            ? "/workspace.webp"
                            : "/store.webp"
                      }
                      fill
                      sizes="(max-width: 760px) 100vw, 33vw"
                      alt={
                        s.photo === "family"
                          ? "Gia đình cùng sử dụng máy tính"
                          : s.photo === "work"
                            ? "Không gian làm việc tại nhà"
                            : "Không gian cửa hàng hiện đại"
                      }
                    />
                    {s.featured && (
                      <span className="card-tag">TƯ VẤN THEO NHU CẦU</span>
                    )}
                  </div>
                  <div className="solution-body">
                    <div className="card-title">
                      <s.icon size={22} />
                      <span>{s.id}</span>
                    </div>
                    <h3>{s.name}</h3>
                    <p>{s.desc}</p>
                    <ul>
                      {s.features.map((f) => (
                        <li key={f}>
                          <Check size={18} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#dang-ky"
                      className={s.featured ? "button primary" : "button pale"}
                    >
                      Nhận tư vấn <ArrowRight size={18} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <p className="price-note">
              <ShieldCheck size={16} /> Gói cước, tốc độ, chi phí và ưu đãi được
              xác nhận theo địa chỉ và thời điểm đăng ký.
            </p>
          </div>
        </section>
        <section
          id="wifi-mesh"
          className="mesh-section"
          aria-labelledby="mesh-title"
        >
          <div className="container mesh-grid">
            <div className="mesh-photo">
              <Image
                src="/mesh.webp"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                alt="Hình minh họa thiết bị WiFi Mesh trong không gian nội thất hiện đại"
              />
              <span className="mesh-chip">
                <Router size={17} /> WiFi Mesh
              </span>
            </div>
            <div className="mesh-content">
              <span className="label">
                KHÔNG GIAN MỞ RỘNG. KẾT NỐI TIẾP NỐI.
              </span>
              <h2 id="mesh-title">
                WiFi đến gần hơn
                <br />
                với từng không gian.
              </h2>
              <p>
                Tư vấn giải pháp WiFi Mesh cho ngôi nhà nhiều phòng, nhiều tầng
                hoặc khu vực cần thêm điểm phát.
              </p>
              <div className="mesh-points">
                <span>
                  <Signal size={20} /> Mở rộng vùng kết nối
                </span>
                <span>
                  <CheckCheck size={20} /> Bố trí theo thực tế ngôi nhà
                </span>
              </div>
              <a className="text-link" href="#dang-ky">
                Tìm phương án cho nhà bạn <ArrowUpRight size={19} />
              </a>
              <small>
                Khả năng phủ sóng phụ thuộc vào thiết bị, vị trí lắp và vật cản.
              </small>
            </div>
          </div>
        </section>
        <section
          id="lap-dat"
          className="section process"
          aria-labelledby="process-title"
        >
          <div className="container">
            <div className="section-heading">
              <span className="label">TỪ NHU CẦU ĐẾN GIẢI PHÁP</span>
              <h2 id="process-title">
                Đơn giản từng bước.
                <br className="mobile-break" /> Rõ ràng từng lựa chọn.
              </h2>
              <p>
                Bạn chia sẻ nhu cầu. Chúng tôi cùng bạn tìm phương án phù hợp.
              </p>
            </div>
            <div className="process-grid">
              {[
                [
                  "01",
                  "Để lại nhu cầu",
                  "Chọn khu vực và cách bạn sử dụng Internet.",
                ],
                [
                  "02",
                  "Kiểm tra địa chỉ",
                  "Trao đổi khả năng cung cấp và điều kiện lắp đặt.",
                ],
                [
                  "03",
                  "Xác nhận phương án",
                  "Thống nhất gói cước, chi phí và lịch hẹn trước khi đăng ký.",
                ],
              ].map(([n, t, d]) => (
                <article key={n}>
                  <span className="step-number">{n}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="hoi-dap"
          className="faq-section"
          aria-labelledby="faq-title"
        >
          <div className="container faq-grid">
            <div>
              <span className="label">TRƯỚC KHI BẠN QUYẾT ĐỊNH</span>
              <h2 id="faq-title">
                Có thể bạn
                <br />
                đang muốn biết.
              </h2>
              <p>Chưa tìm thấy câu trả lời phù hợp?</p>
              <a className="faq-phone" href="tel:0818006881">
                <Phone size={19} /> 08.1800 6881 <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>
                    {f.q}
                    <ChevronDown size={19} />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section
          id="dang-ky"
          className="contact-section"
          aria-labelledby="contact-title"
        >
          <div className="container contact-grid">
            <div className="contact-copy">
              <span className="label">BẮT ĐẦU TỪ MỘT CUỘC TRÒ CHUYỆN</span>
              <h2 id="contact-title">
                Kết nối tốt hơn.
                <br />
                Cho điều bạn
                <br />
                <em>quan tâm nhất.</em>
              </h2>
              <p>
                Chia sẻ nhu cầu để được tư vấn Internet cáp quang VNPT và WiFi
                Mesh tại khu vực Bình Thủy, Cần Thơ.
              </p>
              <a href="tel:0818006881" className="contact-phone">
                <Phone size={25} />
                <span>
                  <small>GỌI ĐỂ ĐƯỢC TƯ VẤN</small>
                  <strong>08.1800 6881</strong>
                </span>
                <ArrowUpRight size={22} />
              </a>
              <div className="area-note">
                <MapPin size={19} />
                <p>
                  Bình Thủy · Long Tuyền
                  <br />
                  Thới An Đông · Phước Thới
                </p>
              </div>
            </div>
            <LeadForm enabled={enabled} />
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-main">
          <Link href="/" className="brand">
            <span className="brand-word">
              VNPT<span className="brand-dot">.</span>
            </span>
            <span className="brand-location">
              BÌNH THỦY<span>CẦN THƠ</span>
            </span>
          </Link>
          <p>
            Tư vấn Internet cho gia đình
            <br />
            và kinh doanh tại Bình Thủy, Cần Thơ.
          </p>
          <div>
            <a href="tel:0818006881">
              <Phone size={17} />
              08.1800 6881
            </a>
            <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} · Tư vấn Internet VNPT Bình Thủy
          </span>
          <span>
            Hình ảnh minh họa · Thông tin gói cước được xác nhận khi tư vấn
          </span>
        </div>
      </footer>
      <div className="mobile-dock">
        <a href="tel:0818006881">
          <Phone size={19} /> Gọi tư vấn
        </a>
        <a href="#dang-ky">
          Đăng ký tư vấn <ArrowRight size={18} />
        </a>
      </div>
    </>
  );
}
