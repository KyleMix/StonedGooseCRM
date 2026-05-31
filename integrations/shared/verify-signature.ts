// HMAC-SHA256 webhook signature verification. Both Documenso and Cal.com
// sign their outbound webhooks; we verify before trusting the payload.

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyHmacSignature(
  rawBody: string | Buffer,
  receivedSignature: string | undefined,
  secret: string,
): boolean {
  if (!secret) return true; // verification disabled when secret unset
  if (!receivedSignature) return false;

  const computed = createHmac("sha256", secret)
    .update(typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody)
    .digest("hex");

  // Strip an optional "sha256=" prefix that some providers add.
  const provided = receivedSignature.replace(/^sha256=/, "");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
