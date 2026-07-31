import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { payfastSignature, payfastProcessUrl } from "@/lib/payfast.server";

const InitInput = z.object({
  booking_id: z.string().uuid(),
  kind: z.enum(["DEPOSIT", "BALANCE", "FULL"]),
});

/**
 * Prepares a PayFast checkout: creates a pending payment row and returns
 * the full set of form fields + signature + process URL. The client
 * auto-submits a form to PayFast.
 */
export const initPayfastCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InitInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, profiles!bookings_user_id_fkey(full_name, email, phone_number)")
      .eq("id", data.booking_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !booking) throw new Error("Booking not found");

    let amount: number;
    if (data.kind === "DEPOSIT") {
      if (booking.deposit_status === "PAID") throw new Error("Deposit already paid.");
      amount = Number(booking.deposit_amount);
    } else if (data.kind === "BALANCE") {
      if (booking.deposit_status !== "PAID") throw new Error("Pay deposit first.");
      if (booking.balance_status === "PAID") throw new Error("Balance already paid.");
      amount = Number(booking.balance_amount);
    } else {
      if (booking.deposit_status === "PAID" && booking.balance_status === "PAID") {
        throw new Error("Already fully paid.");
      }
      amount = Number(booking.total_amount);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error: pErr } = await supabaseAdmin
      .from("payments")
      .insert({
        booking_id: booking.id,
        user_id: userId,
        kind: data.kind,
        amount,
        status: "PENDING",
      })
      .select("id")
      .single();
    if (pErr || !payment) throw new Error(pErr?.message ?? "Could not create payment");

    // Derive site origin
    const req = getRequest();
    const origin = new URL(req.url).origin;

    const merchantId = process.env.PAYFAST_MERCHANT_ID!;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY!;
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    const profile = (booking as any).profiles ?? {};
    const [firstName, ...rest] = String(profile.full_name ?? "Student").trim().split(/\s+/);
    const lastName = rest.join(" ") || "Storage";

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/dashboard?payment=success&booking=${booking.id}`,
      cancel_url: `${origin}/dashboard?payment=cancelled&booking=${booking.id}`,
      notify_url: `${origin}/api/public/payfast/notify`,
      name_first: firstName || "Student",
      name_last: lastName,
      email_address: profile.email ?? "",
      cell_number: (profile.phone_number ?? "").replace(/\D/g, "").slice(0, 15),
      m_payment_id: payment.id,
      amount: amount.toFixed(2),
      item_name: `StashSpace booking ${booking.id.slice(0, 8)} — ${data.kind}`,
      item_description: `${data.kind} payment for storage booking`,
      custom_str1: booking.id,
      custom_str2: data.kind,
    };

    // Drop empties before signing (PayFast doesn't include them)
    Object.keys(fields).forEach((k) => { if (!fields[k]) delete fields[k]; });

    const signature = payfastSignature(fields, passphrase);
    return {
      processUrl: payfastProcessUrl(),
      fields: { ...fields, signature },
    };
  });
