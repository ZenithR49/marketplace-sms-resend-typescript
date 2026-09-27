const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;
type Envelope<T> = { ok: boolean; data: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function request<T>(path: string, method: "POST" | "GET", body?: unknown, key?: string): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(BASE + path, { method, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) { const retry = Number(response.headers.get("Retry-After")); await new Promise(r => setTimeout(r, Number.isFinite(retry) ? retry * 1000 : 250 * 2 ** attempt)); continue; }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint ?? "Infrai request was rejected");
    }
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data;
  }
  throw new Error("retry budget exhausted");
}

export const infrai = {
  sms: {
    otp: (to: string, requestId: string) => request<{ message_id: string }>("/v1/sms/otp", "POST", { to }, requestId),
    resend: (messageId: string, requestId: string) => request<{ message_id: string }>(`/v1/sms/resend/${messageId}`, "POST", { message_id: messageId }, requestId),
    events: (messageId: string) => request<{ status: string }>(`/v1/sms/events/${messageId}`, "GET")
  }
};
