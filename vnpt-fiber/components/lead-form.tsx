"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  Phone,
} from "lucide-react";
import { usePackageSelection } from "@/components/package-selection";
import { WARDS, DEMANDS, PACKAGES } from "@/lib/lead-validation";
type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
export function LeadForm({ enabled }: { enabled: boolean }) {
  const { demand, setDemand } = usePackageSelection();
  const [ready, setReady] = useState(false),
    [sending, setSending] = useState(false),
    [message, setMessage] = useState(""),
    [success, setSuccess] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [scriptReady, setScriptReady] = useState(false);
  const requestId = useRef(""),
    started = useRef(0),
    captcha = useRef(""),
    captchaBox = useRef<HTMLDivElement>(null),
    widget = useRef<string | undefined>(undefined),
    status = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    requestId.current = crypto.randomUUID();
    started.current = Date.now();
    setReady(true);
  }, []);
  useEffect(() => {
    if (!scriptReady || !siteKey || !captchaBox.current || !window.turnstile)
      return;
    widget.current = window.turnstile.render(captchaBox.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token: string) => {
        captcha.current = token;
      },
      "expired-callback": () => {
        captcha.current = "";
      },
      "error-callback": () => {
        captcha.current = "";
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, [scriptReady, siteKey]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enabled || !ready || sending) return;
    const form = e.currentTarget;
    setErrors({});
    setMessage("");
    setSuccess(false);
    if (siteKey && !captcha.current) {
      setMessage("Vui lòng hoàn tất xác minh chống spam.");
      return;
    }
    const value = (id: string) =>
      (form.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement)
        .value;
    const utm: Record<string, string> = {};
    const params = new URLSearchParams(location.search);
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const v = params.get(key);
      if (v) utm[key] = v;
    }
    // Keep attribution to referring hostname only, avoiding private query strings.
    if (document.referrer) {
      try {
        utm.referrer = new URL(document.referrer).hostname;
      } catch {}
    }
    setSending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: value("full-name"),
          phone: value("phone"),
          ward: value("ward"),
          demand: value("demand"),
          address: value("address"),
          website: value("website"),
          consent: (form.querySelector("#consent") as HTMLInputElement).checked,
          requestId: requestId.current,
          startedAt: started.current,
          utm,
          captchaToken: captcha.current,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      setMessage(result.message || "Chưa xác nhận đăng ký. Vui lòng thử lại.");
      if (response.ok) {
        setSuccess(true);
        form.reset();
        setDemand("");
        requestId.current = crypto.randomUUID();
        started.current = Date.now();
      } else {
        setErrors(result.errors || {});
      }
    } catch {
      setMessage(
        "Kết nối tạm thời gián đoạn. Vui lòng thử lại hoặc gọi 08.1800 6881.",
      );
    } finally {
      setSending(false);
      captcha.current = "";
      if (widget.current) window.turnstile?.reset(widget.current);
      status.current?.focus();
    }
  }
  return (
    <form className="lead-form" onSubmit={submit} aria-describedby="form-note">
      <div className="form-heading">
        <span className="label">KẾT NỐI VỚI CHÚNG TÔI</span>
        <h3>Nhận tư vấn gói cước</h3>
        <p>
          Cho chúng tôi biết nhu cầu. Phương án cụ thể được xác nhận sau khi
          kiểm tra địa chỉ.
        </p>
      </div>
      {PACKAGES.some((p) => p.name === demand) && (
        <p className="package-selection-note" role="status">Gói đã chọn: <strong>{demand}</strong>. Lựa chọn chỉ được gửi khi bạn hoàn tất form và nhận xác nhận thành công.</p>
      )}
      {!enabled && (
        <div className="form-unavailable" role="note">
          <strong>Đăng ký online đang chờ kích hoạt.</strong>
          <span>
            Hiện thông tin chưa được gửi hoặc lưu. Gọi{" "}
            <a href="tel:0818006881">08.1800 6881</a> để được tư vấn.
          </span>
        </div>
      )}
      <fieldset disabled={!enabled || sending}>
        <legend className="sr-only">Thông tin liên hệ tư vấn Internet</legend>
        <div className="form-row">
          <label htmlFor="full-name">
            Họ và tên <span>*</span>
            <input
              id="full-name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Nhập họ và tên"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "name-error" : undefined}
            />
            {errors.fullName && (
              <small id="name-error" className="field-error">
                {errors.fullName}
              </small>
            )}
          </label>
          <label htmlFor="phone">
            Số điện thoại <span>*</span>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={18}
              placeholder="Số điện thoại liên hệ"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <small id="phone-error" className="field-error">
                {errors.phone}
              </small>
            )}
          </label>
        </div>
        <div className="form-row">
          <label htmlFor="ward">
            Khu vực lắp đặt <span>*</span>
            <select
              id="ward"
              required
              defaultValue=""
              aria-invalid={!!errors.ward}
            >
              <option value="" disabled>
                Chọn phường / khu vực
              </option>
              {WARDS.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>
          <label htmlFor="demand">
            Gói cước / nhu cầu <span>*</span>
            <select
              id="demand"
              required
              value={demand}
              onChange={(e) => setDemand(e.target.value)}
              aria-invalid={!!errors.demand}
            >
              <option value="" disabled>
                Chọn nhu cầu
              </option>
              {DEMANDS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <label htmlFor="address">
          Địa chỉ dự kiến <small>(không bắt buộc)</small>
          <input
            id="address"
            autoComplete="street-address"
            maxLength={200}
            placeholder="Tên đường, khu dân cư hoặc địa chỉ lắp đặt"
            aria-invalid={!!errors.address}
          />
        </label>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">
            Website
            <input id="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="consent" htmlFor="consent">
          <input type="checkbox" id="consent" required />
          <span>
            Tôi đồng ý để bộ phận tư vấn liên hệ theo nhu cầu trên và đã đọc{" "}
            <Link href="/chinh-sach-bao-mat">chính sách bảo mật</Link>.
          </span>
        </label>
        {siteKey && enabled && <div ref={captchaBox} className="captcha-box" />}
        <button
          className="button primary form-submit"
          type="submit"
          disabled={!ready || sending || !enabled}
        >
          {sending ? (
            <>
              <LoaderCircle className="spin" size={19} /> Đang gửi yêu cầu
            </>
          ) : (
            <>
              Nhận tư vấn gói cước <ArrowRight size={19} />
            </>
          )}
        </button>
      </fieldset>
      <div
        ref={status}
        className={success ? "form-status success" : "form-status"}
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        {message && (
          <>
            {success && <CheckCircle2 size={20} />}
            <p>{message}</p>
          </>
        )}
      </div>
      <p className="form-footnote" id="form-note">
        <LockKeyhole size={13} /> Thông tin chỉ dùng để tư vấn theo nhu cầu của
        bạn.
      </p>
      <noscript>
        <p>
          Vui lòng bật JavaScript hoặc{" "}
          <a href="tel:0818006881">gọi 08.1800 6881</a> để đăng ký.
        </p>
      </noscript>
      {siteKey && enabled && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}
      <a className="form-call" href="tel:0818006881">
        <Phone size={15} /> Hoặc gọi ngay 08.1800 6881
      </a>
    </form>
  );
}
