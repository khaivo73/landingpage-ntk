import "server-only";
export function supabaseServerKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}
export function leadServiceReady() {
  const base = Boolean(
    process.env.SUPABASE_URL?.startsWith("https://") &&
    (supabaseServerKey() || (process.env.LEAD_INTAKE_KEY?.length ?? 0) >= 64) &&
    (process.env.LEAD_IP_HASH_SECRET?.length ?? 0) >= 32,
  );
  const captcha =
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) ===
    Boolean(process.env.TURNSTILE_SECRET_KEY);
  return base && captcha;
}
