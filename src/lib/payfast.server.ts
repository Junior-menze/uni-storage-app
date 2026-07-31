// PayFast helpers — server-only. Do NOT import from client code.
import crypto from "crypto";

export type PayFastFields = Record<string, string>;

function urlEncodePayfast(v: string) {
  // PayFast expects application/x-www-form-urlencoded with spaces as '+'
  return encodeURIComponent(v).replace(/%20/g, "+");
}

/**
 * Build the PayFast signature. Order of fields must match what will be posted.
 * The signature is md5 of "key=val&key=val" + optional passphrase.
 */
export function payfastSignature(fields: PayFastFields, passphrase?: string): string {
  const keys = Object.keys(fields).filter((k) => fields[k] !== "" && fields[k] != null && k !== "signature");
  const paramStr = keys.map((k) => `${k}=${urlEncodePayfast(fields[k])}`).join("&");
  const withPass = passphrase && passphrase !== "none"
    ? `${paramStr}&passphrase=${urlEncodePayfast(passphrase)}`
    : paramStr;
  return crypto.createHash("md5").update(withPass).digest("hex");
}

export function isSandbox(): boolean {
  return (process.env.PAYFAST_SANDBOX ?? "true").toLowerCase() !== "false";
}

export function payfastProcessUrl(): string {
  return isSandbox()
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

export function payfastValidateUrl(): string {
  return isSandbox()
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
}

/**
 * Verify an ITN (Instant Transaction Notification) POST from PayFast.
 * 1. Recompute signature over posted fields (minus 'signature').
 * 2. Verify data with PayFast's validate endpoint.
 */
export async function verifyITN(rawBody: string): Promise<{
  ok: boolean;
  fields: PayFastFields;
  reason?: string;
}> {
  const params = new URLSearchParams(rawBody);
  const fields: PayFastFields = {};
  params.forEach((v, k) => { fields[k] = v; });

  const providedSig = fields["signature"];
  if (!providedSig) return { ok: false, fields, reason: "missing signature" };

  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const computed = payfastSignature(fields, passphrase);
  if (computed !== providedSig) return { ok: false, fields, reason: "signature mismatch" };

  // Post-back validation
  const validateBody = new URLSearchParams();
  Object.entries(fields).forEach(([k, v]) => validateBody.append(k, v));
  const res = await fetch(payfastValidateUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: validateBody.toString(),
  });
  const text = (await res.text()).trim();
  if (text !== "VALID") return { ok: false, fields, reason: `validate returned: ${text}` };

  return { ok: true, fields };
}
