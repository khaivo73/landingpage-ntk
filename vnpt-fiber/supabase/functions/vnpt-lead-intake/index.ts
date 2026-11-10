// Server-to-server intake only. This digest is not the secret; rotate both together.
const EXPECTED_HASH = "707a79de4eead5c63f853cfaa4b9e4c04216ab40f3182960d5cfd2b411b45d24";
import { validateLead } from "./lead-validation.ts";
import { readSmallJson, InputError } from "./read-json.ts";
const reply = (message: string, status: number) => new Response(JSON.stringify({ message }), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply("METHOD_NOT_ALLOWED", 405);
  const token = req.headers.get("x-vnpt-intake-key") || "";
  if (token.length !== 72) return reply("UNAUTHORIZED", 401);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), b => b.toString(16).padStart(2,"0")).join("");
  let diff = 0;
  for (let i = 0; i < EXPECTED_HASH.length; i++) diff |= digest.charCodeAt(i) ^ EXPECTED_HASH.charCodeAt(i);
  if (diff !== 0) return reply("UNAUTHORIZED", 401);
  if (!req.headers.get("content-type")?.includes("application/json")) return reply("INVALID_CONTENT_TYPE", 415);
  try {
    const body = await readSmallJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) return reply("INVALID_PAYLOAD", 400);
    const b = body as Record<string, unknown>;
    if (!b.p_payload || typeof b.p_payload !== "object" || Array.isArray(b.p_payload) || typeof b.p_ip_hash !== "string" || !/^[0-9a-f]{64}$/.test(b.p_ip_hash)) return reply("INVALID_PAYLOAD", 400);
    const p = b.p_payload as Record<string, unknown>;
    // Consent and anti-bot timing have already been verified by the authenticated VPS.
    const { lead } = validateLead({ fullName:p.full_name,phone:p.phone,ward:p.ward,demand:p.demand,address:p.address,utm:p.utm,requestId:b.p_id,consent:true,website:"",startedAt:Date.now()-2000 });
    if (!lead) return reply("INVALID_PAYLOAD", 400);
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const key = keys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!key || !url) return reply("SERVICE_UNAVAILABLE", 503);
    const response = await fetch(`${url}/rest/v1/rpc/submit_vnpt_lead`, {
      method:"POST", headers: { apikey:key, ...(key.startsWith("sb_secret_") ? {} : {Authorization:`Bearer ${key}`}), "Content-Type":"application/json" },
      body:JSON.stringify({ p_id:lead.requestId,p_ip_hash:b.p_ip_hash,p_payload:{full_name:lead.fullName,phone:lead.phone,ward:lead.ward,demand:lead.demand,address:lead.address,utm:lead.utm} }),
      signal:AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const error = await response.json().catch(()=>({}));
      return reply(error.message === "RATE_LIMIT" ? "RATE_LIMIT" : "PERSISTENCE_FAILED", error.message === "RATE_LIMIT" ? 429 : 503);
    }
    return reply("SAVED", 200);
  } catch (error) {
    if (error instanceof InputError) return reply("INVALID_PAYLOAD", error.status);
    return reply("SERVICE_UNAVAILABLE", 503);
  }
});
