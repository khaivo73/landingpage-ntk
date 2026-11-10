export const WARDS = [
  "Bình Thủy",
  "Long Tuyền",
  "Thới An Đông",
  "Phước Thới",
  "Khu vực khác",
] as const;
// Prices and inclusions transcribed from the owner's supplied VNPT Cần Thơ leaflet.
// Tax, eligibility, installation fees and promotion validity are not specified.
export const PACKAGES = [
  { id: "home1-mesh", name: "HOME1 Mesh", price: 215000,
    features: ["Tốc độ WiFi 300 Mbps", "Family Safe và Green Net", "01 thiết bị WiFi Mesh 6"] },
  { id: "cam-canh", name: "CAM CANH", price: 200000,
    features: ["Tốc độ WiFi 300 Mbps", "01 camera Indoor", "Lưu trữ cloud 3 ngày"] },
  { id: "cam-mat", name: "CAM MẮT", price: 190000,
    features: ["Tốc độ WiFi 300 Mbps", "Truyền hình MyTV (app)", "01 camera Indoor · cloud 1 ngày"] },
  { id: "cam-sanh", name: "CAM SÀNH", price: 205000,
    features: ["Tốc độ WiFi 300 Mbps", "Truyền hình MyTV (app)", "01 camera Indoor · cloud 1 ngày", "01 thiết bị WiFi Mesh"] },
] as const;
export const DEMANDS = [
  "Internet gia đình",
  "Làm việc tại nhà",
  "Cửa hàng / hộ kinh doanh",
  "Internet + WiFi Mesh",
  "Cần tư vấn thêm",
  ...PACKAGES.map((p) => p.name),
] as const;
export type Lead = {
  fullName: string;
  phone: string;
  ward: string;
  demand: string;
  address: string;
  consent: boolean;
  requestId: string;
  startedAt: number;
  website: string;
  utm: Record<string, string>;
};
export function normalizePhone(value: string): string {
  const clean = value.replace(/[\s().-]/g, "");
  return clean.startsWith("+84") ? "0" + clean.slice(3) : clean;
}
export function validateLead(
  input: unknown,
  now = Date.now(),
): { lead?: Lead; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { errors: { form: "Dữ liệu không hợp lệ." } };
  const x = input as Record<string, unknown>;
  const str = (key: string) =>
    typeof x[key] === "string" ? (x[key] as string).trim() : "";
  const fullName = str("fullName").replace(/\s+/g, " ");
  const phone = normalizePhone(str("phone"));
  const ward = str("ward"),
    demand = str("demand"),
    address = str("address");
  if (
    fullName.length < 2 ||
    fullName.length > 80 ||
    /[<>\x00-\x1f]/.test(fullName)
  )
    errors.fullName = "Nhập họ tên từ 2 đến 80 ký tự.";
  if (!/^0[35789]\d{8}$/.test(phone))
    errors.phone = "Nhập số di động Việt Nam gồm 10 chữ số.";
  if (!(WARDS as readonly string[]).includes(ward))
    errors.ward = "Vui lòng chọn khu vực lắp đặt.";
  if (!(DEMANDS as readonly string[]).includes(demand))
    errors.demand = "Vui lòng chọn nhu cầu sử dụng.";
  if (address.length > 200 || /[<>\x00-\x1f]/.test(address))
    errors.address = "Địa chỉ tối đa 200 ký tự, không chứa ký tự đặc biệt.";
  if (x.consent !== true)
    errors.consent = "Cần đồng ý để chúng tôi liên hệ tư vấn.";
  const requestId = str("requestId");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId,
    )
  )
    errors.form = "Phiên đăng ký không hợp lệ. Vui lòng tải lại trang.";
  const startedAt =
    typeof x.startedAt === "number" && Number.isFinite(x.startedAt)
      ? x.startedAt
      : 0;
  if (now - startedAt < 1200 || now - startedAt > 7_200_000)
    errors.form = "Vui lòng kiểm tra thông tin rồi thử lại.";
  const utm: Record<string, string> = {};
  if (x.utm && typeof x.utm === "object" && !Array.isArray(x.utm)) {
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "referrer",
    ]) {
      const value = (x.utm as Record<string, unknown>)[key];
      if (typeof value === "string") utm[key] = value.slice(0, 200);
    }
  }
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    lead: {
      fullName,
      phone,
      ward,
      demand,
      address,
      consent: true,
      requestId,
      startedAt,
      website: str("website"),
      utm,
    },
  };
}
