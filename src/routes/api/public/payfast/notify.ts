import { createFileRoute } from "@tanstack/react-router";
import { verifyITN } from "@/lib/payfast.server";

/**
 * PayFast ITN (Instant Transaction Notification) webhook.
 * PayFast POSTs application/x-www-form-urlencoded on payment completion.
 */
export const Route = createFileRoute("/api/public/payfast/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const result = await verifyITN(raw);
        if (!result.ok) {
          console.warn("[payfast] ITN rejected:", result.reason);
          return new Response("Invalid", { status: 400 });
        }
        const f = result.fields;
        const paymentId = f["m_payment_id"];
        const status = (f["payment_status"] ?? "").toUpperCase(); // COMPLETE / FAILED / CANCELLED
        const bookingId = f["custom_str1"];
        const kind = f["custom_str2"];

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Update payment row
        await supabaseAdmin.from("payments").update({
          status: status === "COMPLETE" ? "PAID" : status === "FAILED" ? "FAILED" : "PENDING",
          payfast_pf_payment_id: f["pf_payment_id"] ?? null,
          raw_itn: JSON.parse(JSON.stringify(f)),
          updated_at: new Date().toISOString(),
        }).eq("id", paymentId);

        if (status === "COMPLETE" && bookingId && kind) {
          const patch: { deposit_status?: "PAID"; balance_status?: "PAID" } = {};
          if (kind === "DEPOSIT") patch.deposit_status = "PAID";
          else if (kind === "BALANCE") patch.balance_status = "PAID";
          else if (kind === "FULL") { patch.deposit_status = "PAID"; patch.balance_status = "PAID"; }
          if (Object.keys(patch).length) {
            await supabaseAdmin.from("bookings").update(patch).eq("id", bookingId);
          }
        }

        return new Response("OK");
      },
    },
  },
});
