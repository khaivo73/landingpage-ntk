"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, ArrowUpRight } from "lucide-react";
export function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#noi-dung">
        Đến nội dung chính
      </a>
      <header className="site-header">
        <div className="container navigation">
          <Link
            className="brand"
            href="/"
            aria-label="VNPT Bình Thủy — Trang chủ"
          >
            <span className="brand-word">
              VNPT<span className="brand-dot">.</span>
            </span>
            <span className="brand-location">
              BÌNH THỦY<span>CẦN THƠ</span>
            </span>
          </Link>
          <nav
            id="main-navigation"
            className={open ? "nav-links open" : "nav-links"}
            aria-label="Điều hướng chính"
          >
            {[
              ["#giai-phap", "Giải pháp"],
              ["#wifi-mesh", "WiFi Mesh"],
              ["#lap-dat", "Lắp đặt"],
              ["#hoi-dap", "Hỏi đáp"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
            <a
              className="mobile-consult"
              href="#dang-ky"
              onClick={() => setOpen(false)}
            >
              Đăng ký tư vấn <ArrowUpRight size={16} />
            </a>
          </nav>
          <a href="tel:0818006881" className="header-phone">
            <Phone size={17} />
            <span>08.1800 6881</span>
          </a>
          <button
            ref={toggle}
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-controls="main-navigation"
            aria-expanded={open}
            type="button"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
