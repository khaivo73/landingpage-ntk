// Google Sheets queue only. This credential cannot claim Telegram/email jobs.
const EXPECTED_HASH = "6c4cfb19e20906fa87087865827b3cf9cfd755efe9aa786ac06de85520d2591f";
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const token = req.headers.get("x-vnpt-sheet-key") || "";
  if (token.length !== 72) return json({ error: "UNAUTHORIZED" }, 401);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), b => b.toString(16).padStart(2, "0")).join("");
  let diff = 0;
  for (let i = 0; i < EXPECTED_HASH.length; i++) diff |= digest.charCodeAt(i) ^ EXPECTED_HASH.charCodeAt(i);
  if (diff) return json({ error: "UNAUTHORIZED" }, 401);
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "INVALID_CONTENT_TYPE" }, 415);
    const reader = req.body?.getReader();
    if (!reader) return json({ error: "INVALID_PAYLOAD" }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2048) { await reader.cancel(); return json({ error: "TOO_LARGE" }, 413); }
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
    const b = JSON.parse(new TextDecoder().decode(all));
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let rpc: string;
    let payload: Record<string, unknown>;
    if (b.action === "claim") {
      rpc = "claim_vnpt_sheet"; payload = {};
    } else if (b.action === "finish" && typeof b.id === "string" && uuid.test(b.id) && typeof b.lease_id === "string" && uuid.test(b.lease_id) && typeof b.success === "boolean") {
      rpc = "finish_vnpt_sheet";
      payload = { p_id: b.id, p_lease_id: b.lease_id, p_success: b.success };
    } else return json({ error: "INVALID_PAYLOAD" }, 400);
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const key = keys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!key || !url) return json({ error: "UNAVAILABLE" }, 503);
    const response = await fetch(`${url}/rest/v1/rpc/${rpc}`, { method: "POST",
      headers: { apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }), "Content-Type": "application/json" },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    if (!response.ok) return json({ error: "QUEUE_FAILED" }, 503);
    return json(await response.json());
  } catch { return json({ error: "QUEUE_FAILED" }, 503); }
});
