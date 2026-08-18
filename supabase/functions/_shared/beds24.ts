// Shared Beds24 v2 API client for edge functions.
// Auth model: long-life refresh token (env BEDS24_REFRESH_TOKEN) is exchanged for a
// short-lived access token via GET /authentication/token; the access token is cached
// in public.beds24_token_cache (single row, service-role only via RLS).
// deno-lint-ignore-file no-explicit-any

export const BEDS24_API = "https://api.beds24.com/v2";

const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function getBeds24Token(sb: any): Promise<string> {
  const { data: cached } = await sb
    .from("beds24_token_cache")
    .select("access_token, expires_at")
    .eq("id", 1)
    .maybeSingle();

  if (cached && new Date(cached.expires_at).getTime() - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
    return cached.access_token;
  }

  const refreshToken = Deno.env.get("BEDS24_REFRESH_TOKEN");
  if (!refreshToken) throw new Error("BEDS24_REFRESH_TOKEN is not configured");

  const res = await fetch(`${BEDS24_API}/authentication/token`, {
    headers: { refreshToken },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.token) {
    console.error("beds24 token refresh failed", res.status, JSON.stringify(body));
    throw new Error(`Beds24 token refresh failed (${res.status})`);
  }

  const expiresAt = new Date(Date.now() + Number(body.expiresIn ?? 0) * 1000).toISOString();
  const { error } = await sb
    .from("beds24_token_cache")
    .upsert({ id: 1, access_token: body.token, expires_at: expiresAt }, { onConflict: "id" });
  if (error) console.error("beds24 token cache write failed", error.message);

  return body.token;
}

export async function beds24Fetch(sb: any, path: string, init: RequestInit = {}): Promise<Response> {
  const access = await getBeds24Token(sb);
  const headers = new Headers(init.headers);
  headers.set("token", access);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BEDS24_API}${path}`, { ...init, headers });

  const remaining = Number(res.headers.get("x-five-min-limit-remaining"));
  if (Number.isFinite(remaining) && remaining < 20) {
    console.warn(`beds24 rate limit low: x-five-min-limit-remaining=${remaining}`);
  }
  return res;
}

export type MappedBooking = {
  status: "pending" | "confirmed" | "cancelled";
  channel: "booking" | "direct" | "block";
  guest_name?: string;
};

// Beds24 booking status/referer -> local reservation status + channel.
// 'black' is a maintenance/owner block, not a guest booking.
export function mapBeds24Booking(raw: any): MappedBooking {
  const beds24Status = String(raw?.status ?? "").toLowerCase();
  const referer = String(raw?.referer ?? "");
  const channel: MappedBooking["channel"] = referer.toLowerCase().includes("booking")
    ? "booking"
    : "direct";

  switch (beds24Status) {
    case "confirmed":
      return { status: "confirmed", channel };
    case "new":
    case "request":
      return { status: "pending", channel };
    case "cancelled":
      return { status: "cancelled", channel };
    case "black":
      return { status: "confirmed", channel: "block", guest_name: "חסימת תחזוקה" };
    default:
      console.warn(`beds24 unknown booking status "${beds24Status}", defaulting to pending`);
      return { status: "pending", channel };
  }
}
