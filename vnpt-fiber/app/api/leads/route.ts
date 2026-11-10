import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { validateLead } from "@/lib/lead-validation";
import { leadServiceReady, supabaseServerKey } from "@/lib/config";
import { readSmallJson, InputError } from "@/lib/read-json";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: NextRequest) {
  if (!leadServiceReady())
    return reply(
      {
        message:
          "Đăng ký trực tuyến chưa được kích hoạt. Vui lòng gọi 08.1800 6881 để được tư vấn.",
      },
      503,
    );
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.SITE_URL
    ? new URL(process.env.SITE_URL).origin
    : request.nextUrl.origin;
  if (!origin || origin !== expectedOrigin)
    return reply({ message: "Yêu cầu không hợp lệ." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply({ message: "Định dạng không hợp lệ." }, 415);
  let body: unknown;
  try {
    body = await readSmallJson(request);
  } catch (error) {
    if (error instanceof InputError)
      return reply({ message: error.message }, error.status);
    return reply({ message: "Không đọc được thông tin đăng ký." }, 400);
  }
  const { lead, errors } = validateLead(body);
  if (!lead)
    return reply({ message: "Vui lòng kiểm tra thông tin.", errors }, 400);
  if (lead.website)
    return reply({ message: "Không thể xử lý đăng ký này." }, 400);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const token =
      typeof (body as Record<string, unknown>).captchaToken === "string"
        ? (body as Record<string, string>).captchaToken
        : "";
    try {
      const verified = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      const result = await verified.json();
      if (!result.success)
        return reply(
          { message: "Vui lòng hoàn tất xác minh chống spam." },
          400,
        );
    } catch {
      return reply(
        { message: "Xác minh tạm thời gián đoạn. Vui lòng thử lại." },
        503,
      );
    }
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const ipHash = createHmac("sha256", process.env.LEAD_IP_HASH_SECRET!)
    .update(ip)
    .digest("hex");
  try {
    const response = await fetch(
      process.env.LEAD_INTAKE_KEY
        ? `${process.env.SUPABASE_URL}/functions/v1/vnpt-lead-intake`
        : `${process.env.SUPABASE_URL}/rest/v1/rpc/submit_vnpt_lead`,
      {
        method: "POST",
        headers: {
          ...(process.env.LEAD_INTAKE_KEY
            ? { "X-VNPT-Intake-Key": process.env.LEAD_INTAKE_KEY }
            : { apikey: supabaseServerKey()!, ...(supabaseServerKey()!.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${supabaseServerKey()}` }) }),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_id: lead.requestId,
          p_ip_hash: ipHash,
          p_payload: {
            full_name: lead.fullName,
            phone: lead.phone,
            ward: lead.ward,
            demand: lead.demand,
            address: lead.address,
            utm: lead.utm,
          },
        }),
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.message === "RATE_LIMIT")
        return reply(
          {
            message:
              "Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau hoặc gọi 08.1800 6881.",
          },
          429,
        );
      // Never log submitted personal data, request bodies or database credentials.
      console.error("Lead persistence failed", response.status);
      return reply(
        {
          message:
            "Chưa lưu được đăng ký. Vui lòng thử lại hoặc gọi 08.1800 6881.",
        },
        503,
      );
    }
    return reply({
      message:
        "Đã nhận nhu cầu tư vấn. Chúng tôi sẽ liên hệ qua số điện thoại bạn cung cấp.",
      reference: lead.requestId,
    });
  } catch {
    return reply(
      {
        message:
          "Kết nối tạm thời gián đoạn. Chưa xác nhận đăng ký; vui lòng thử lại.",
      },
      503,
    );
  }
}
