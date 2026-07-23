export function normalizeBaseUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/\/+$/, "");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isConnectedWhatsAppWebhookEvent(body: any): boolean {
  return (
    (body?.event === "connection.update" || body?.event === "session.status") &&
    (body?.data?.status === "connected" ||
      body?.data?.status === "open" ||
      body?.data?.connection === "open")
  );
}

export function isSuccessfulCheckoutStatus(status?: string | null): boolean {
  if (!status) return true;
  return ["success", "complete", "completed"].includes(status);
}

export async function verifySvixSignature(
  svixId: string,
  svixTimestamp: string,
  body: string,
  secret: string,
  signatureHeader: string
): Promise<boolean> {
  const payload = `${svixId}.${svixTimestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  const actual = signatureHeader.replace(/^v1,/, "");
  return timingSafeEqual(actual, expected);
}
